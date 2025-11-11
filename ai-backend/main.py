"""
ClimaSense AI Backend
Integrates AgriBERT classifier and GraphCast weather forecasting
Endpoints: /api/agri_analysis, /api/graphcast_forecast, and /api/analyze-farm (legacy)
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from transformers import pipeline
import torch
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
import os
import time
import uuid

# GraphCast imports
from graphcast.model_manager import GraphCastModelManager
from graphcast.era5_fetcher import ERA5DataFetcher
from graphcast.inference_pipeline import GraphCastInferencePipeline
from graphcast.agricultural_metrics import AgriculturalMetricsCalculator
from graphcast.cache_manager import ForecastCacheManager
from graphcast.config import validate_coordinates
from graphcast.request_queue import get_queue_manager, initialize_queue_manager, shutdown_queue_manager, RequestPriority
from graphcast.profiler import get_profiler

# Setup structured logging with request ID support
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Add request_id filter for structured logging
class RequestIDFilter(logging.Filter):
    """Add request_id to log records for tracing"""
    def filter(self, record):
        if not hasattr(record, 'request_id'):
            record.request_id = 'N/A'
        return True

logger.addFilter(RequestIDFilter())

app = FastAPI(
    title="ClimaSense AI Backend",
    description="AI-powered agricultural analysis, recommendations, and weather forecasting",
    version="1.0.0"
)

# Request ID middleware for tracing
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to each request for tracing"""
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    request.state.estimated_wait_ms = 0.0
    
    # Add to logging context
    old_factory = logging.getLogRecordFactory()
    
    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.request_id = request_id
        return record
    
    logging.setLogRecordFactory(record_factory)
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    # Add queue wait time header if available
    if hasattr(request.state, 'estimated_wait_ms') and request.state.estimated_wait_ms > 0:
        response.headers["X-Estimated-Wait-Time-Ms"] = str(int(request.state.estimated_wait_ms))
    
    # Add queue size header if queue manager is available
    if queue_manager:
        try:
            queue_size = queue_manager.queue.qsize()
            response.headers["X-Queue-Size"] = str(queue_size)
        except:
            pass
    
    # Restore old factory
    logging.setLogRecordFactory(old_factory)
    
    return response

# CORS middleware - Allow Loveable preview and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handlers for GraphCast endpoints
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Custom HTTP exception handler with enhanced error responses.
    
    Adds retry-after header for 503 errors and detailed error information.
    """
    headers = {}
    
    # Add Retry-After header for service unavailable errors
    if exc.status_code == 503:
        headers["Retry-After"] = "3600"  # Retry after 1 hour
    
    # Create detailed error response
    error_response = {
        "error": exc.detail,
        "status_code": exc.status_code,
        "path": str(request.url),
        "timestamp": datetime.now().isoformat()
    }
    
    # Add helpful hints for common errors
    if exc.status_code == 400 and "coordinates" in exc.detail.lower():
        error_response["hint"] = (
            "Please provide coordinates within Maharashtra bounds: "
            "latitude 18.0-21.0°N, longitude 73.0-77.0°E. "
            "Example: Pune (18.5204, 73.8567)"
        )
    elif exc.status_code == 503:
        error_response["hint"] = (
            "The weather forecasting service is temporarily unavailable. "
            "This may be due to model initialization or data fetching issues. "
            "Please try again in a few minutes."
        )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response,
        headers=headers
    )

# Global model variables
agri_classifier = None
device = None
models_loaded = False

# GraphCast global variables
graphcast_model_manager = None
graphcast_era5_fetcher = None
graphcast_inference_pipeline = None
graphcast_cache_manager = None
graphcast_metrics_calculator = None
graphcast_initialized = False

# Request queue and profiler
queue_manager = None
profiler = get_profiler()

# Performance metrics tracking
performance_metrics = {
    "total_requests": 0,
    "cache_hits": 0,
    "cache_misses": 0,
    "total_inference_time_ms": 0,
    "error_count": 0,
    "agri_analysis_requests": 0
}

# AgriBERT classification labels
AGRIBERT_LABELS = {
    "LABEL_0": "Drought Stress",
    "LABEL_1": "Pest Infestation",
    "LABEL_2": "Nutrient Deficiency",
    "LABEL_3": "Optimal Conditions",
    "LABEL_4": "Waterlogging",
    "LABEL_5": "Disease Risk",
    "LABEL_6": "Heat Stress",
    "LABEL_7": "Cold Stress"
}

# Request/Response Models
class AnalyzeFarmRequest(BaseModel):
    text: str

class AnalyzeFarmResponse(BaseModel):
    model: str = "AgriBERT"
    prediction: str
    confidence: float
    timestamp: str

class AIRecommendRequest(BaseModel):
    """Deprecated request model - kept for backward compatibility"""
    prompt: str

class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    device: str
    agri_classifier: str
    graphcast_system: str

# GraphCast Forecast Request/Response Models
class GraphCastForecastRequest(BaseModel):
    """Request model for GraphCast weather forecast"""
    latitude: float = Field(..., ge=18.0, le=21.0, description="Latitude in degrees (18.0-21.0 for Maharashtra)")
    longitude: float = Field(..., ge=73.0, le=77.0, description="Longitude in degrees (73.0-77.0 for Maharashtra)")
    forecast_days: Optional[int] = Field(10, ge=1, le=10, description="Number of forecast days (1-10)")
    
    @validator('latitude')
    def validate_latitude(cls, v):
        if not (18.0 <= v <= 21.0):
            raise ValueError('Latitude must be between 18.0 and 21.0 degrees (Maharashtra bounds)')
        return v
    
    @validator('longitude')
    def validate_longitude(cls, v):
        if not (73.0 <= v <= 77.0):
            raise ValueError('Longitude must be between 73.0 and 77.0 degrees (Maharashtra bounds)')
        return v

class RawWeatherDataResponse(BaseModel):
    """Raw weather data for a single day"""
    precipitation_mm: float
    temp_max_c: float
    temp_min_c: float
    humidity_percent: float

class ForecastDayResponse(BaseModel):
    """Forecast data for a single day"""
    date: str  # ISO 8601 format
    rain_risk: float = Field(..., ge=0, le=100, description="Rainfall risk score (0-100)")
    temp_extreme: float = Field(..., ge=0, le=100, description="Temperature extreme risk score (0-100)")
    soil_moisture_proxy: float = Field(..., ge=0, le=100, description="Soil moisture proxy (0-100)")
    confidence_score: float = Field(..., ge=0, le=1, description="Forecast confidence (0-1)")
    raw_data: RawWeatherDataResponse

class LocationResponse(BaseModel):
    """Location information"""
    latitude: float
    longitude: float
    region: str

class ForecastMetadataResponse(BaseModel):
    """Metadata about the forecast"""
    model_version: str
    generated_at: str  # ISO 8601 format
    cache_hit: bool
    inference_time_ms: int

class GraphCastForecastResponse(BaseModel):
    """Response model for GraphCast weather forecast"""
    location: LocationResponse
    forecast: List[ForecastDayResponse]
    metadata: ForecastMetadataResponse

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: str
    status_code: int

# AgriBERT Analysis Request/Response Models
class AgriAnalysisContext(BaseModel):
    """Optional context for agricultural analysis"""
    crop: Optional[str] = None
    region: Optional[str] = None
    season: Optional[str] = None

class AgriAnalysisRequest(BaseModel):
    """Request model for agricultural text analysis"""
    text: str = Field(..., min_length=1, description="Agricultural query or observation")
    context: Optional[AgriAnalysisContext] = None

class AgriAnalysisResult(BaseModel):
    """Analysis result with category and confidence"""
    category: str
    confidence: float
    recommendations: List[str]

class AgriAnalysisResponse(BaseModel):
    """Response model for agricultural text analysis"""
    model: str = "AgriBERT"
    analysis: AgriAnalysisResult
    timestamp: str

@app.on_event("shutdown")
async def shutdown_services():
    """Shutdown services gracefully"""
    logger.info("Shutting down services...")
    
    # Shutdown request queue
    try:
        await shutdown_queue_manager()
        logger.info("✅ Request queue manager shutdown")
    except Exception as e:
        logger.error(f"❌ Error shutting down queue manager: {e}")
    
    # Print profiling report
    try:
        profiler.print_report(sort_by='total_time_ms', limit=15)
    except Exception as e:
        logger.error(f"❌ Error printing profiling report: {e}")
    
    logger.info("Shutdown complete")


@app.on_event("startup")
async def load_models():
    """Load AI models on startup and cache them"""
    global agri_classifier, device, models_loaded
    global graphcast_model_manager, graphcast_era5_fetcher, graphcast_inference_pipeline
    global graphcast_cache_manager, graphcast_metrics_calculator, graphcast_initialized
    global queue_manager
    
    logger.info("=" * 60)
    logger.info("ClimaSense AI Backend - Starting Model Loading")
    logger.info("=" * 60)
    
    # Log research-grade status warning for GraphCast
    logger.warning(
        "⚠️  GraphCast is a research-grade weather forecasting model. "
        "Predictions should be validated against local observations and "
        "are not suitable for operational weather warnings."
    )
    
    try:
        # Detect device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"🖥️  Device detected: {device.upper()}")
        
        # Load AgriBERT Classifier
        logger.info("\n📦 Loading AgriBERT classifier...")
        logger.info("   Model: GautamR/agri_bert_classifier")
        try:
            agri_classifier = pipeline(
                "text-classification",
                model="GautamR/agri_bert_classifier",
                device=0 if device == "cuda" else -1,
                top_k=1
            )
            logger.info("   ✅ AgriBERT loaded and cached successfully")
        except Exception as e:
            logger.error(f"   ❌ Could not load AgriBERT: {e}")
            logger.info("   ⚠️  Will use fallback classification")
            agri_classifier = None
        
        models_loaded = (agri_classifier is not None)
        
        # Initialize GraphCast components
        logger.info("\n📦 Initializing GraphCast weather forecasting system...")
        try:
            graphcast_model_manager = GraphCastModelManager()
            graphcast_era5_fetcher = ERA5DataFetcher()
            graphcast_inference_pipeline = GraphCastInferencePipeline(
                model_manager=graphcast_model_manager,
                data_fetcher=graphcast_era5_fetcher
            )
            graphcast_cache_manager = ForecastCacheManager()
            graphcast_metrics_calculator = AgriculturalMetricsCalculator()
            graphcast_initialized = True
            logger.info("   ✅ GraphCast system initialized successfully")
        except Exception as e:
            logger.error(f"   ❌ Could not initialize GraphCast: {e}")
            logger.info("   ⚠️  GraphCast endpoints will return errors")
            graphcast_initialized = False
        
        # Initialize request queue manager
        logger.info("\n📦 Initializing request queue manager...")
        try:
            await initialize_queue_manager()
            queue_manager = get_queue_manager()
            logger.info("   ✅ Request queue manager initialized")
        except Exception as e:
            logger.error(f"   ❌ Could not initialize queue manager: {e}")
        
        logger.info("\n" + "=" * 60)
        logger.info("🚀 ClimaSense AI Backend Ready!")
        logger.info(f"   AgriBERT: {'✅ Loaded' if agri_classifier else '❌ Fallback'}")
        logger.info(f"   GraphCast: {'✅ Initialized' if graphcast_initialized else '❌ Unavailable'}")
        logger.info(f"   Request Queue: {'✅ Active' if queue_manager else '❌ Unavailable'}")
        logger.info(f"   Server: http://localhost:8000")
        logger.info("=" * 60 + "\n")
        
    except Exception as e:
        logger.error(f"❌ Critical error loading models: {e}")
        logger.info("⚠️  Running in fallback mode")

@app.post("/api/analyze-farm", response_model=AnalyzeFarmResponse)
async def analyze_farm(request: AnalyzeFarmRequest):
    """
    Analyze farm/crop/soil/weather text using AgriBERT classifier
    
    Example:
    POST /api/analyze-farm
    {"text": "soil is dry and temperature is rising"}
    
    Returns:
    {"model": "AgriBERT", "prediction": "Drought Stress", "confidence": 0.91}
    """
    logger.info(f"📥 /api/analyze-farm - Request: {request.text[:50]}...")
    
    try:
        if agri_classifier:
            # Use AgriBERT model
            results = agri_classifier(request.text)
            
            # Handle different return formats
            if isinstance(results, list) and len(results) > 0:
                if isinstance(results[0], list):
                    result = results[0][0]  # Nested list format
                else:
                    result = results[0]  # Simple list format
            else:
                result = results
            
            # Extract prediction and confidence
            label = result.get('label', 'LABEL_0')
            confidence = result.get('score', 0.75)
            
            # Map label to readable prediction
            prediction = AGRIBERT_LABELS.get(label, label)
            
            logger.info(f"   ✅ AgriBERT prediction: {prediction} ({confidence:.2f})")
            
            response = AnalyzeFarmResponse(
                model="AgriBERT",
                prediction=prediction,
                confidence=round(confidence, 2),
                timestamp=datetime.now().isoformat()
            )
        else:
            # Fallback classification
            prediction, confidence = fallback_classify(request.text)
            logger.info(f"   ⚠️  Fallback prediction: {prediction} ({confidence:.2f})")
            
            response = AnalyzeFarmResponse(
                model="AgriBERT (Fallback)",
                prediction=prediction,
                confidence=confidence,
                timestamp=datetime.now().isoformat()
            )
        
        return response
        
    except Exception as e:
        logger.error(f"   ❌ Error in /api/analyze-farm: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def fallback_classify(text: str) -> tuple:
    """Fallback classification when AgriBERT is not available"""
    text_lower = text.lower()
    
    # Keyword-based classification
    if any(word in text_lower for word in ['dry', 'drought', 'water shortage', 'arid']):
        return "Drought Stress", 0.85
    elif any(word in text_lower for word in ['pest', 'insect', 'bug', 'infestation']):
        return "Pest Infestation", 0.85
    elif any(word in text_lower for word in ['nutrient', 'deficiency', 'yellow', 'pale']):
        return "Nutrient Deficiency", 0.85
    elif any(word in text_lower for word in ['waterlog', 'flood', 'excess water', 'standing water']):
        return "Waterlogging", 0.85
    elif any(word in text_lower for word in ['disease', 'fungus', 'blight', 'rot']):
        return "Disease Risk", 0.85
    elif any(word in text_lower for word in ['hot', 'heat', 'high temperature', 'scorching']):
        return "Heat Stress", 0.85
    elif any(word in text_lower for word in ['cold', 'frost', 'freeze', 'low temperature']):
        return "Cold Stress", 0.85
    elif any(word in text_lower for word in ['good', 'optimal', 'healthy', 'normal']):
        return "Optimal Conditions", 0.80
    else:
        return "Optimal Conditions", 0.70

def generate_recommendations(category: str, context: Optional[AgriAnalysisContext] = None) -> List[str]:
    """
    Generate actionable recommendations based on AgriBERT classification category.
    
    Args:
        category: Classification category from AgriBERT
        context: Optional context with crop, region, season information
        
    Returns:
        List of actionable recommendations
    """
    recommendations_map = {
        "Drought Stress": [
            "Implement drip irrigation to maximize water efficiency",
            "Apply mulch to retain soil moisture and reduce evaporation",
            "Consider drought-resistant crop varieties for future planting",
            "Schedule irrigation during early morning or late evening to minimize water loss",
            "Monitor soil moisture levels regularly using sensors or manual checks"
        ],
        "Pest Infestation": [
            "Inspect crops regularly for early pest detection",
            "Apply neem-based organic pesticides as first-line treatment",
            "Introduce beneficial insects like ladybugs to control pest populations",
            "Remove and destroy heavily infested plants to prevent spread",
            "Practice crop rotation to break pest life cycles"
        ],
        "Nutrient Deficiency": [
            "Conduct soil testing to identify specific nutrient deficiencies",
            "Apply balanced NPK fertilizers based on soil test results",
            "Add organic compost to improve soil structure and nutrient availability",
            "Consider foliar feeding for quick nutrient uptake",
            "Monitor plant symptoms and adjust fertilization accordingly"
        ],
        "Optimal Conditions": [
            "Maintain current farming practices as conditions are favorable",
            "Continue regular monitoring of crop health and soil conditions",
            "Plan for upcoming planting or harvesting activities",
            "Consider expanding cultivation if resources permit",
            "Document successful practices for future reference"
        ],
        "Waterlogging": [
            "Improve field drainage by creating channels or installing drainage tiles",
            "Avoid irrigation until soil moisture levels normalize",
            "Apply gypsum to improve soil structure and drainage",
            "Consider raised bed cultivation for better water management",
            "Monitor for fungal diseases that thrive in waterlogged conditions"
        ],
        "Disease Risk": [
            "Remove infected plant material immediately to prevent spread",
            "Apply appropriate fungicides or bactericides based on disease type",
            "Improve air circulation by proper plant spacing",
            "Avoid overhead irrigation which promotes disease spread",
            "Practice crop rotation with non-susceptible crops"
        ],
        "Heat Stress": [
            "Increase irrigation frequency during hot periods",
            "Apply shade nets or temporary shading for sensitive crops",
            "Mulch heavily to keep soil temperatures down",
            "Schedule field activities during cooler parts of the day",
            "Consider heat-tolerant varieties for future planting"
        ],
        "Cold Stress": [
            "Use row covers or plastic tunnels to protect crops from frost",
            "Apply irrigation before expected frost to moderate temperature",
            "Avoid pruning or fertilizing before cold periods",
            "Harvest mature crops before severe cold weather arrives",
            "Consider cold-hardy varieties for winter cultivation"
        ]
    }
    
    # Get base recommendations for the category
    recommendations = recommendations_map.get(category, [
        "Monitor crop conditions regularly",
        "Consult with local agricultural extension services",
        "Keep detailed records of observations and interventions"
    ])
    
    # Add context-specific recommendations if available
    if context:
        if context.region and "Maharashtra" in context.region:
            recommendations.append("Consult Maharashtra Agricultural Department for region-specific guidance")
        if context.crop:
            recommendations.append(f"Review best practices specific to {context.crop} cultivation")
        if context.season:
            recommendations.append(f"Consider seasonal factors for {context.season} when implementing changes")
    
    return recommendations

@app.post("/api/agri_analysis", response_model=AgriAnalysisResponse)
async def agri_analysis(request: AgriAnalysisRequest, http_request: Request):
    """
    Analyze agricultural text and provide recommendations using AgriBERT.
    
    This endpoint wraps the existing AgriBERT classification logic and provides
    user-friendly categories with actionable recommendations.
    
    Example:
    POST /api/agri_analysis
    {
        "text": "My crops are showing yellow leaves and stunted growth",
        "context": {
            "crop": "rice",
            "region": "Pune, Maharashtra",
            "season": "monsoon"
        }
    }
    
    Returns:
    {
        "model": "AgriBERT",
        "analysis": {
            "category": "Nutrient Deficiency",
            "confidence": 0.89,
            "recommendations": [
                "Conduct soil testing to identify specific nutrient deficiencies",
                "Apply balanced NPK fertilizers based on soil test results",
                ...
            ]
        },
        "timestamp": "2024-11-09T10:30:00"
    }
    """
    request_start_time = time.time()
    request_id = getattr(http_request.state, 'request_id', 'unknown')
    
    # Track request
    performance_metrics["agri_analysis_requests"] += 1
    
    logger.info(
        f"📥 /api/agri_analysis - Request received | "
        f"text_length={len(request.text)} | "
        f"has_context={request.context is not None} | "
        f"request_id={request_id}"
    )
    
    try:
        # Use existing AgriBERT classification logic
        if agri_classifier:
            # Use AgriBERT model
            results = agri_classifier(request.text)
            
            # Handle different return formats
            if isinstance(results, list) and len(results) > 0:
                if isinstance(results[0], list):
                    result = results[0][0]  # Nested list format
                else:
                    result = results[0]  # Simple list format
            else:
                result = results
            
            # Extract prediction and confidence
            label = result.get('label', 'LABEL_0')
            confidence = result.get('score', 0.75)
            
            # Map label to readable category
            category = AGRIBERT_LABELS.get(label, label)
            
            classification_time_ms = int((time.time() - request_start_time) * 1000)
            logger.info(
                f"✅ AgriBERT classification | "
                f"category={category} | "
                f"confidence={confidence:.2f} | "
                f"classification_time={classification_time_ms}ms | "
                f"request_id={request_id}"
            )
            
        else:
            # Fallback classification
            category, confidence = fallback_classify(request.text)
            classification_time_ms = int((time.time() - request_start_time) * 1000)
            logger.warning(
                f"⚠️  Fallback classification used | "
                f"category={category} | "
                f"confidence={confidence:.2f} | "
                f"classification_time={classification_time_ms}ms | "
                f"request_id={request_id}"
            )
        
        # Generate recommendations based on category and context
        recommendations = generate_recommendations(category, request.context)
        
        # Create response
        response = AgriAnalysisResponse(
            model="AgriBERT",
            analysis=AgriAnalysisResult(
                category=category,
                confidence=round(confidence, 2),
                recommendations=recommendations
            ),
            timestamp=datetime.now().isoformat()
        )
        
        total_time_ms = int((time.time() - request_start_time) * 1000)
        logger.info(
            f"📤 Response sent | "
            f"total_time={total_time_ms}ms | "
            f"recommendations_count={len(recommendations)} | "
            f"request_id={request_id}"
        )
        
        return response
        
    except Exception as e:
        total_time_ms = int((time.time() - request_start_time) * 1000)
        logger.error(
            f"❌ Error in /api/agri_analysis | "
            f"error={str(e)} | "
            f"total_time={total_time_ms}ms | "
            f"request_id={request_id}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail=f"Agricultural analysis failed: {str(e)}")

@app.post("/api/ai-recommend")
async def ai_recommend_deprecated(request: AIRecommendRequest):
    """
    DEPRECATED: This endpoint has been removed.
    
    The Gemma-based recommendation endpoint has been replaced with specialized models:
    - Use /api/graphcast_forecast for weather forecasting with agricultural metrics
    - Use /api/agri_analysis for agricultural text analysis and recommendations
    
    Returns HTTP 410 Gone to indicate permanent removal.
    """
    logger.warning(
        f"⚠️  Deprecated endpoint /api/ai-recommend accessed. "
        f"Request: {request.prompt[:50]}..."
    )
    
    raise HTTPException(
        status_code=410,
        detail={
            "error": "Endpoint Deprecated",
            "message": (
                "The /api/ai-recommend endpoint has been permanently removed. "
                "Please use the following specialized endpoints instead:"
            ),
            "alternatives": {
                "weather_forecast": {
                    "endpoint": "/api/graphcast_forecast",
                    "description": "Get 7-10 day weather forecasts with agricultural metrics",
                    "example": {
                        "latitude": 18.5204,
                        "longitude": 73.8567,
                        "forecast_days": 10
                    }
                },
                "agricultural_analysis": {
                    "endpoint": "/api/agri_analysis",
                    "description": "Analyze agricultural text and get recommendations",
                    "example": {
                        "text": "My crops are showing yellow leaves",
                        "context": {
                            "crop": "rice",
                            "region": "Pune, Maharashtra"
                        }
                    }
                }
            },
            "migration_guide": (
                "For weather-related queries, use /api/graphcast_forecast. "
                "For crop advice and agricultural analysis, use /api/agri_analysis."
            )
        }
    )


@app.post("/api/graphcast_forecast", response_model=GraphCastForecastResponse)
async def graphcast_forecast(request: GraphCastForecastRequest, http_request: Request):
    """
    Generate GraphCast weather forecast for specified location.
    
    This endpoint provides 7-10 day weather forecasts with agricultural metrics
    including rainfall risk, temperature extremes, and soil moisture proxy.
    
    Example:
    POST /api/graphcast_forecast
    {"latitude": 18.5204, "longitude": 73.8567, "forecast_days": 10}
    
    Returns:
    GraphCastForecastResponse with location, forecast days, and metadata
    """
    request_start_time = time.time()
    request_id = getattr(http_request.state, 'request_id', 'unknown')
    
    logger.info(
        f"📥 /api/graphcast_forecast - Request received | "
        f"lat={request.latitude}, lon={request.longitude}, days={request.forecast_days} | "
        f"request_id={request_id}"
    )
    
    # Track request
    performance_metrics["total_requests"] += 1
    
    # Check if GraphCast is initialized
    if not graphcast_initialized:
        performance_metrics["error_count"] += 1
        logger.error(f"GraphCast system not initialized | request_id={request_id}")
        raise HTTPException(
            status_code=503,
            detail="GraphCast weather forecasting system is not available. Please try again later."
        )
    
    try:
        # Validate coordinates are within Maharashtra bounds
        if not validate_coordinates(request.latitude, request.longitude):
            logger.warning(
                f"Invalid coordinates: lat={request.latitude}, lon={request.longitude}"
            )
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Coordinates ({request.latitude}, {request.longitude}) are outside "
                    f"Maharashtra bounds. Valid ranges: latitude 18.0-21.0°N, longitude 73.0-77.0°E"
                )
            )
        
        # Check cache for existing forecast
        cache_check_start = time.time()
        logger.info("Checking forecast cache...")
        cached_forecast = graphcast_cache_manager.get_forecast(
            lat=request.latitude,
            lon=request.longitude,
            forecast_days=request.forecast_days
        )
        cache_check_time_ms = int((time.time() - cache_check_start) * 1000)
        
        if cached_forecast:
            performance_metrics["cache_hits"] += 1
            cache_hit_rate = (performance_metrics["cache_hits"] / performance_metrics["total_requests"]) * 100
            
            logger.info(
                f"✅ Cache HIT | "
                f"cache_check_time={cache_check_time_ms}ms | "
                f"cache_hit_rate={cache_hit_rate:.1f}% | "
                f"request_id={request_id}"
            )
            
            # Convert cached forecast to response format
            response = _convert_forecast_to_response(cached_forecast)
            
            # Update cache hit flag
            response.metadata.cache_hit = True
            
            total_time_ms = int((time.time() - request_start_time) * 1000)
            logger.info(
                f"📤 Response sent | "
                f"total_time={total_time_ms}ms | "
                f"cache_hit=true | "
                f"request_id={request_id}"
            )
            
            # Add queue info to response headers if available
            if queue_manager:
                estimated_wait = queue_manager.get_estimated_wait_time()
                http_request.state.estimated_wait_ms = estimated_wait
            
            return response
        
        # Cache miss - run inference
        performance_metrics["cache_misses"] += 1
        cache_hit_rate = (performance_metrics["cache_hits"] / performance_metrics["total_requests"]) * 100
        
        logger.info(
            f"❌ Cache MISS | "
            f"cache_check_time={cache_check_time_ms}ms | "
            f"cache_hit_rate={cache_hit_rate:.1f}% | "
            f"Starting inference pipeline | "
            f"request_id={request_id}"
        )
        
        # Run inference pipeline through queue manager
        inference_start_time = time.time()
        try:
            logger.info(f"Queueing GraphCast model inference | request_id={request_id}")
            
            # Use queue manager if available, otherwise run directly
            if queue_manager:
                # Add estimated wait time to response headers
                estimated_wait = queue_manager.get_estimated_wait_time()
                http_request.state.estimated_wait_ms = estimated_wait
                
                # Enqueue request with normal priority
                forecast_result = await queue_manager.enqueue_request(
                    request_id=request_id,
                    task=graphcast_inference_pipeline.run_inference,
                    kwargs={
                        'lat': request.latitude,
                        'lon': request.longitude,
                        'forecast_days': request.forecast_days
                    },
                    priority=RequestPriority.NORMAL
                )
            else:
                # Fallback to direct execution if queue not available
                logger.warning("Queue manager not available, running inference directly")
                forecast_result = await graphcast_inference_pipeline.run_inference(
                    lat=request.latitude,
                    lon=request.longitude,
                    forecast_days=request.forecast_days
                )
            inference_time_ms = int((time.time() - inference_start_time) * 1000)
            performance_metrics["total_inference_time_ms"] += inference_time_ms
            avg_inference_time = performance_metrics["total_inference_time_ms"] / performance_metrics["cache_misses"]
            
            logger.info(
                f"✅ Inference completed | "
                f"inference_time={inference_time_ms}ms | "
                f"avg_inference_time={avg_inference_time:.0f}ms | "
                f"request_id={request_id}"
            )
        except Exception as inference_error:
            inference_time_ms = int((time.time() - inference_start_time) * 1000)
            performance_metrics["error_count"] += 1
            error_rate = (performance_metrics["error_count"] / performance_metrics["total_requests"]) * 100
            
            logger.error(
                f"❌ Inference failed | "
                f"inference_time={inference_time_ms}ms | "
                f"error={str(inference_error)} | "
                f"error_rate={error_rate:.1f}% | "
                f"request_id={request_id}"
            )
            error_msg = str(inference_error).lower()
            
            # Check if error is due to ERA5 data unavailability
            if "era5" in error_msg or "data" in error_msg or "fetch" in error_msg:
                logger.error(f"ERA5 data unavailable: {inference_error}")
                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Weather data is temporarily unavailable. "
                        "Unable to fetch initial conditions from ERA5 dataset. "
                        "Please try again later."
                    )
                )
            # Check if error is due to model inference timeout or failure
            elif "timeout" in error_msg or "inference" in error_msg:
                logger.error(f"Model inference failed: {inference_error}")
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Weather forecast model inference failed or timed out. "
                        "This may be due to high computational load. "
                        "Please try again in a few minutes."
                    )
                )
            else:
                # Generic inference error
                logger.error(f"GraphCast inference failed: {inference_error}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Weather forecast generation failed: {str(inference_error)}"
                )
        
        if forecast_result is None:
            logger.warning("GraphCast inference returned None, using mock forecast data")
            # Generate mock forecast as fallback - returns response directly
            mock_forecast = _generate_mock_forecast(
                request.latitude,
                request.longitude,
                request.forecast_days
            )
            
            # Convert mock dict to response format directly
            response = GraphCastForecastResponse(**mock_forecast)
            inference_time_ms = 10
            
            total_time_ms = int((time.time() - request_start_time) * 1000)
            logger.info(
                f"📤 Mock response sent | "
                f"total_time={total_time_ms}ms | "
                f"mock_data=true | "
                f"request_id={request_id}"
            )
            
            return response
        
        # Calculate agricultural metrics
        metrics_start_time = time.time()
        logger.info(f"Calculating agricultural metrics | request_id={request_id}")
        forecast_result = _calculate_agricultural_metrics(forecast_result)
        metrics_time_ms = int((time.time() - metrics_start_time) * 1000)
        logger.info(
            f"✅ Metrics calculated | "
            f"metrics_time={metrics_time_ms}ms | "
            f"request_id={request_id}"
        )
        
        # Store in cache
        cache_store_start = time.time()
        logger.info(f"Storing forecast in cache | request_id={request_id}")
        graphcast_cache_manager.set_forecast(
            lat=request.latitude,
            lon=request.longitude,
            forecast_days=request.forecast_days,
            forecast=forecast_result
        )
        cache_store_time_ms = int((time.time() - cache_store_start) * 1000)
        logger.info(
            f"✅ Forecast cached | "
            f"cache_store_time={cache_store_time_ms}ms | "
            f"request_id={request_id}"
        )
        
        # Convert to response format
        response = _convert_forecast_to_response(forecast_result)
        
        total_time_ms = int((time.time() - request_start_time) * 1000)
        logger.info(
            f"📤 Response sent | "
            f"total_time={total_time_ms}ms | "
            f"inference_time={inference_time_ms}ms | "
            f"metrics_time={metrics_time_ms}ms | "
            f"cache_hit=false | "
            f"request_id={request_id}"
        )
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ Error in /api/graphcast_forecast: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


def _generate_mock_forecast(lat: float, lon: float, forecast_days: int) -> Dict[str, Any]:
    """
    Generate mock forecast data when GraphCast model is unavailable.
    
    Args:
        lat: Latitude
        lon: Longitude
        forecast_days: Number of forecast days
        
    Returns:
        Mock forecast dictionary with realistic weather data
    """
    import random
    from datetime import datetime, timedelta
    
    logger.info(f"Generating mock forecast for lat={lat}, lon={lon}, days={forecast_days}")
    
    forecast_days_list = []
    base_date = datetime.now()
    
    # Generate realistic weather data for Maharashtra region
    for day in range(forecast_days):
        date = base_date + timedelta(days=day + 1)
        
        # Simulate realistic weather patterns
        temp_max = random.uniform(28, 38)  # °C
        temp_min = random.uniform(18, 25)  # °C
        precipitation = random.uniform(0, 15) if random.random() > 0.6 else 0  # mm
        humidity = random.uniform(40, 85)  # %
        
        # Calculate risk scores
        rain_risk = min(100, (precipitation / 25.0) * 100)
        temp_extreme = min(100, abs(temp_max - 30) / 10 * 100)
        soil_moisture = min(100, 50 + precipitation * 2 - (temp_max - 25) * 2)
        confidence = max(0.5, 0.95 - (day * 0.05))
        
        forecast_days_list.append({
            "date": date.isoformat(),
            "rain_risk": round(rain_risk, 2),
            "temp_extreme": round(temp_extreme, 2),
            "soil_moisture_proxy": round(max(0, soil_moisture), 2),
            "confidence_score": round(confidence, 2),
            "raw_data": {
                "precipitation_mm": round(precipitation, 2),
                "temp_max_c": round(temp_max, 2),
                "temp_min_c": round(temp_min, 2),
                "humidity_percent": round(humidity, 2)
            }
        })
    
    return {
        "location": {
            "latitude": lat,
            "longitude": lon,
            "region": "Maharashtra, India"
        },
        "forecast": forecast_days_list,
        "metadata": {
            "model_version": "mock-v1.0",
            "generated_at": datetime.now().isoformat(),
            "cache_hit": False,
            "inference_time_ms": 10
        }
    }


def _calculate_agricultural_metrics(forecast_result):
    """
    Calculate agricultural metrics for forecast result.
    
    Args:
        forecast_result: ForecastResult from inference pipeline
        
    Returns:
        Updated ForecastResult with agricultural metrics
    """
    try:
        # Extract raw weather data
        dates = [day.date for day in forecast_result.forecast_days]
        precipitation = [day.raw_weather.precipitation_mm for day in forecast_result.forecast_days]
        temp_max = [day.raw_weather.temp_max_c for day in forecast_result.forecast_days]
        temp_min = [day.raw_weather.temp_min_c for day in forecast_result.forecast_days]
        temp_mean = [day.raw_weather.temp_mean_c for day in forecast_result.forecast_days]
        humidity = [day.raw_weather.humidity_percent for day in forecast_result.forecast_days]
        
        # Convert to numpy arrays
        import numpy as np
        precipitation_arr = np.array(precipitation)
        temp_max_arr = np.array(temp_max)
        temp_min_arr = np.array(temp_min)
        temp_mean_arr = np.array(temp_mean)
        humidity_arr = np.array(humidity)
        
        # Calculate metrics
        rainfall_risks = graphcast_metrics_calculator.calculate_rainfall_risk(
            precipitation=precipitation_arr,
            dates=dates
        )
        
        temp_extreme_risks = graphcast_metrics_calculator.calculate_temperature_extreme_risk(
            temp_max=temp_max_arr,
            temp_min=temp_min_arr,
            dates=dates
        )
        
        soil_moisture_proxies = graphcast_metrics_calculator.calculate_soil_moisture_proxy(
            precipitation=precipitation_arr,
            temperature=temp_mean_arr,
            humidity=humidity_arr,
            dates=dates
        )
        
        # Update forecast days with calculated metrics
        for i, day in enumerate(forecast_result.forecast_days):
            day.rain_risk = rainfall_risks[i].risk_score
            day.temp_extreme = temp_extreme_risks[i].risk_score
            day.soil_moisture_proxy = soil_moisture_proxies[i].moisture_percent
            
            # Recalculate confidence score
            day.confidence_score = graphcast_metrics_calculator.calculate_confidence_score(
                forecast_day=i + 1
            )
        
        return forecast_result
        
    except Exception as e:
        logger.error(f"Error calculating agricultural metrics: {e}", exc_info=True)
        # Return forecast with default metrics if calculation fails
        return forecast_result


def _convert_forecast_to_response(forecast_result) -> GraphCastForecastResponse:
    """
    Convert ForecastResult to GraphCastForecastResponse.
    
    Args:
        forecast_result: ForecastResult from inference pipeline
        
    Returns:
        GraphCastForecastResponse for API response
    """
    # Convert location
    location = LocationResponse(
        latitude=forecast_result.location.latitude,
        longitude=forecast_result.location.longitude,
        region=forecast_result.location.region
    )
    
    # Convert forecast days
    forecast_days = []
    for day in forecast_result.forecast_days:
        raw_data = RawWeatherDataResponse(
            precipitation_mm=day.raw_weather.precipitation_mm,
            temp_max_c=day.raw_weather.temp_max_c,
            temp_min_c=day.raw_weather.temp_min_c,
            humidity_percent=day.raw_weather.humidity_percent
        )
        
        forecast_day = ForecastDayResponse(
            date=day.date.isoformat(),
            rain_risk=day.rain_risk,
            temp_extreme=day.temp_extreme,
            soil_moisture_proxy=day.soil_moisture_proxy,
            confidence_score=day.confidence_score,
            raw_data=raw_data
        )
        
        forecast_days.append(forecast_day)
    
    # Convert metadata
    metadata = ForecastMetadataResponse(
        model_version=forecast_result.metadata.model_version,
        generated_at=forecast_result.metadata.generated_at.isoformat(),
        cache_hit=forecast_result.metadata.cache_hit,
        inference_time_ms=forecast_result.metadata.inference_time_ms
    )
    
    return GraphCastForecastResponse(
        location=location,
        forecast=forecast_days,
        metadata=metadata
    )


# Removed old unused functions - using new streamlined endpoints

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    Returns model loading status and system information
    """
    logger.info("📊 /api/health - Health check requested")
    
    return HealthResponse(
        status="ok",
        models_loaded=models_loaded,
        device=device if device else "unknown",
        agri_classifier="loaded" if agri_classifier else "fallback",
        graphcast_system="initialized" if graphcast_initialized else "unavailable"
    )

@app.get("/api/metrics")
async def get_metrics():
    """
    Get performance metrics for monitoring.
    
    Returns:
        Dictionary with performance statistics including:
        - Request counts
        - Cache hit rate
        - Average inference time
        - Error rate
        - Queue statistics
        - Profiling data
    """
    cache_hit_rate = 0.0
    if performance_metrics["total_requests"] > 0:
        cache_hit_rate = (performance_metrics["cache_hits"] / performance_metrics["total_requests"]) * 100
    
    avg_inference_time = 0.0
    if performance_metrics["cache_misses"] > 0:
        avg_inference_time = performance_metrics["total_inference_time_ms"] / performance_metrics["cache_misses"]
    
    error_rate = 0.0
    if performance_metrics["total_requests"] > 0:
        error_rate = (performance_metrics["error_count"] / performance_metrics["total_requests"]) * 100
    
    # Get cache stats from cache manager
    cache_stats = {}
    if graphcast_cache_manager:
        try:
            cache_stats = graphcast_cache_manager.get_cache_stats()
        except:
            pass
    
    # Get queue stats
    queue_stats = {}
    if queue_manager:
        try:
            queue_stats = queue_manager.get_queue_stats()
        except:
            pass
    
    # Get profiling data (top 10 slowest operations)
    profiling_data = {}
    try:
        sorted_metrics = profiler.get_sorted_metrics(sort_by='total_time_ms', limit=10)
        profiling_data = {
            name: {
                'count': metrics['count'],
                'total_ms': round(metrics['total_time_ms'], 2),
                'avg_ms': round(metrics['avg_time_ms'], 2),
                'max_ms': round(metrics['max_time_ms'], 2)
            }
            for name, metrics in sorted_metrics
        }
    except:
        pass
    
    logger.info("📊 /api/metrics - Metrics requested")
    
    return {
        "requests": {
            "total": performance_metrics["total_requests"],
            "graphcast_forecast": performance_metrics["total_requests"] - performance_metrics["agri_analysis_requests"],
            "agri_analysis": performance_metrics["agri_analysis_requests"]
        },
        "cache": {
            "hits": performance_metrics["cache_hits"],
            "misses": performance_metrics["cache_misses"],
            "hit_rate_percent": round(cache_hit_rate, 2),
            "stats": cache_stats
        },
        "performance": {
            "avg_inference_time_ms": round(avg_inference_time, 2),
            "total_inference_time_ms": performance_metrics["total_inference_time_ms"]
        },
        "errors": {
            "count": performance_metrics["error_count"],
            "rate_percent": round(error_rate, 2)
        },
        "queue": queue_stats,
        "profiling": profiling_data,
        "system": {
            "graphcast_initialized": graphcast_initialized,
            "agri_classifier_loaded": agri_classifier is not None,
            "queue_manager_active": queue_manager is not None,
            "device": device if device else "unknown"
        }
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "ClimaSense AI Backend",
        "version": "2.0.0",
        "description": "AI-powered agricultural analysis and weather forecasting with GraphCast",
        "endpoints": {
            "POST /api/agri_analysis": "Analyze agricultural text with recommendations using AgriBERT",
            "POST /api/graphcast_forecast": "Get 7-10 day weather forecast with agricultural metrics using GraphCast",
            "POST /api/analyze-farm": "Analyze farm conditions using AgriBERT (legacy, use /api/agri_analysis instead)",
            "GET /api/health": "Check backend health and model status",
            "GET /": "This information page"
        },
        "models": {
            "AgriBERT": "GautamR/agri_bert_classifier - Agricultural text classification",
            "GraphCast": "DeepMind GraphCast - Research-grade weather forecasting model"
        },
        "deprecated_endpoints": {
            "POST /api/ai-recommend": "REMOVED - Use /api/graphcast_forecast or /api/agri_analysis instead"
        },
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )
