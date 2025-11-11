"""
Agricultural Metrics Calculator
Derives farming-relevant metrics from raw weather predictions for Maharashtra region.
Optimized with vectorized NumPy operations for performance.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Any
import numpy as np
from .config import AGRICULTURAL_THRESHOLDS
from .profiler import get_profiler

# Get global profiler
profiler = get_profiler()


@dataclass
class RainfallRisk:
    """Rainfall risk assessment for a specific day."""
    date: datetime
    risk_score: float  # 0-100
    daily_precipitation_mm: float
    cumulative_7day_mm: float
    intensity_mm_per_hour: float
    risk_level: str  # "low", "moderate", "high"


@dataclass
class TempExtremeRisk:
    """Temperature extreme risk assessment for a specific day."""
    date: datetime
    risk_score: float  # 0-100
    temp_max_c: float
    temp_min_c: float
    optimal_min_c: float
    optimal_max_c: float
    risk_level: str  # "low", "moderate", "high"


@dataclass
class SoilMoistureProxy:
    """Soil moisture proxy estimation for a specific day."""
    date: datetime
    moisture_percent: float  # 0-100
    precipitation_mm: float
    evapotranspiration_mm: float
    drainage_mm: float
    moisture_level: str  # "dry", "optimal", "saturated"


class AgriculturalMetricsCalculator:
    """
    Calculate agricultural metrics from weather forecast data.
    
    This class derives farming-relevant indicators including rainfall risk,
    temperature extreme risk, and soil moisture proxy using region-specific
    thresholds calibrated for Maharashtra agriculture.
    """
    
    def __init__(self, region_config: Optional[Dict[str, Any]] = None):
        """
        Initialize calculator with region-specific thresholds.
        
        Args:
            region_config: Optional custom configuration. If None, uses default
                          Maharashtra thresholds from config.py
        """
        self.config = region_config or AGRICULTURAL_THRESHOLDS
        self.rainfall_config = self.config["rainfall_risk"]
        self.temp_config = self.config["temperature_optimal_ranges"]
        self.temp_extreme_config = self.config["temperature_extreme"]
        self.soil_config = self.config["soil_moisture"]
        self.confidence_config = self.config["confidence"]
        
        # Initialize soil moisture state
        self.soil_moisture_state = self.soil_config["initial_moisture"]
    
    @profiler.profile_function("calculate_rainfall_risk")
    def calculate_rainfall_risk(
        self,
        precipitation: np.ndarray,
        dates: List[datetime],
        hours_per_timestep: float = 24.0
    ) -> List[RainfallRisk]:
        """
        Calculate daily rainfall risk scores (0-100) using vectorized operations.
        
        Risk is based on:
        - Daily precipitation amount
        - 7-day cumulative precipitation
        - Rainfall intensity (mm/hour) for flash flood risk
        
        Args:
            precipitation: Array of precipitation values in mm
            dates: List of datetime objects for each forecast day
            hours_per_timestep: Hours covered by each precipitation value (default: 24)
            
        Returns:
            List of RainfallRisk objects, one per day
        """
        n_days = len(precipitation)
        
        # Vectorized intensity calculation
        intensities = precipitation / hours_per_timestep if hours_per_timestep > 0 else np.zeros_like(precipitation)
        
        # Vectorized cumulative precipitation using rolling window
        window_days = self.rainfall_config["cumulative_window_days"]
        cumulatives = np.array([
            np.sum(precipitation[max(0, i - window_days + 1):i+1])
            for i in range(n_days)
        ])
        
        # Vectorized risk score calculation
        risk_scores = self._calculate_rainfall_risk_scores_vectorized(
            precipitation, cumulatives, intensities
        )
        
        # Vectorized risk level determination
        risk_levels = np.where(risk_scores < 30, "low",
                              np.where(risk_scores < 60, "moderate", "high"))
        
        # Build result list
        risks = [
            RainfallRisk(
                date=date,
                risk_score=float(risk_score),
                daily_precipitation_mm=float(precip),
                cumulative_7day_mm=float(cumulative),
                intensity_mm_per_hour=float(intensity),
                risk_level=risk_level
            )
            for date, risk_score, precip, cumulative, intensity, risk_level
            in zip(dates, risk_scores, precipitation, cumulatives, intensities, risk_levels)
        ]
        
        return risks
    
    def _calculate_rainfall_risk_scores_vectorized(
        self,
        daily_precip: np.ndarray,
        cumulative_precip: np.ndarray,
        intensity: np.ndarray
    ) -> np.ndarray:
        """
        Calculate rainfall risk scores from precipitation metrics using vectorized operations.
        
        Args:
            daily_precip: Array of daily precipitation in mm
            cumulative_precip: Array of 7-day cumulative precipitation in mm
            intensity: Array of rainfall intensity in mm/hour
            
        Returns:
            Array of risk scores from 0-100
        """
        low_thresh = self.rainfall_config["low_threshold"]
        mod_thresh = self.rainfall_config["moderate_threshold"]
        high_cumul_thresh = self.rainfall_config["high_cumulative_threshold"]
        flash_flood_intensity = self.rainfall_config["flash_flood_intensity"]
        
        # Component 1: Daily precipitation risk (0-40 points) - vectorized
        daily_risk = np.zeros_like(daily_precip)
        
        # Low range
        mask_low = daily_precip < low_thresh
        daily_risk[mask_low] = 0.0
        
        # Moderate range
        mask_mod = (daily_precip >= low_thresh) & (daily_precip < mod_thresh)
        daily_risk[mask_mod] = 20.0 * (daily_precip[mask_mod] - low_thresh) / (mod_thresh - low_thresh)
        
        # High range
        mask_high = daily_precip >= mod_thresh
        excess = daily_precip[mask_high] - mod_thresh
        daily_risk[mask_high] = 20.0 + np.minimum(20.0, excess / 2.0)
        
        # Component 2: Cumulative precipitation risk (0-30 points) - vectorized
        cumulative_risk = np.minimum(30.0, 30.0 * cumulative_precip / high_cumul_thresh)
        
        # Component 3: Intensity risk for flash floods (0-30 points) - vectorized
        intensity_risk = np.where(
            intensity >= flash_flood_intensity,
            np.minimum(30.0, 15.0 + (intensity - flash_flood_intensity)),
            15.0 * intensity / flash_flood_intensity
        )
        
        # Total risk score - vectorized
        total_risk = daily_risk + cumulative_risk + intensity_risk
        
        return np.minimum(100.0, total_risk)
    
    def _calculate_rainfall_risk_score(
        self,
        daily_precip: float,
        cumulative_precip: float,
        intensity: float
    ) -> float:
        """
        Calculate rainfall risk score from precipitation metrics (scalar version for backward compatibility).
        
        Args:
            daily_precip: Daily precipitation in mm
            cumulative_precip: 7-day cumulative precipitation in mm
            intensity: Rainfall intensity in mm/hour
            
        Returns:
            Risk score from 0-100
        """
        # Use vectorized version with single values
        result = self._calculate_rainfall_risk_scores_vectorized(
            np.array([daily_precip]),
            np.array([cumulative_precip]),
            np.array([intensity])
        )
        return float(result[0])

    @profiler.profile_function("calculate_temperature_extreme_risk")
    def calculate_temperature_extreme_risk(
        self,
        temp_max: np.ndarray,
        temp_min: np.ndarray,
        dates: List[datetime],
        crop: str = "default",
        growth_stage_weight: Optional[float] = None
    ) -> List[TempExtremeRisk]:
        """
        Calculate temperature extreme risk scores (0-100) using vectorized operations.
        
        Risk is based on deviation from crop-specific optimal temperature ranges.
        Higher risk when temperatures exceed optimal range by more than ±5°C.
        
        Args:
            temp_max: Array of daily maximum temperatures in Celsius
            temp_min: Array of daily minimum temperatures in Celsius
            dates: List of datetime objects for each forecast day
            crop: Crop type (rice, wheat, cotton, or default)
            growth_stage_weight: Optional multiplier for growth stage sensitivity (1.0-2.0)
            
        Returns:
            List of TempExtremeRisk objects, one per day
        """
        # Get optimal temperature range for crop
        if crop not in self.temp_config:
            crop = "default"
        optimal_range = self.temp_config[crop]
        optimal_min = optimal_range["min"]
        optimal_max = optimal_range["max"]
        
        # Default growth stage weight
        if growth_stage_weight is None:
            growth_stage_weight = 1.0
        
        # Vectorized risk score calculation
        risk_scores = self._calculate_temperature_risk_scores_vectorized(
            temp_max, temp_min, optimal_min, optimal_max, growth_stage_weight
        )
        
        # Vectorized risk level determination
        risk_levels = np.where(risk_scores < 30, "low",
                              np.where(risk_scores < 60, "moderate", "high"))
        
        # Build result list
        risks = [
            TempExtremeRisk(
                date=date,
                risk_score=float(risk_score),
                temp_max_c=float(t_max),
                temp_min_c=float(t_min),
                optimal_min_c=optimal_min,
                optimal_max_c=optimal_max,
                risk_level=risk_level
            )
            for date, risk_score, t_max, t_min, risk_level
            in zip(dates, risk_scores, temp_max, temp_min, risk_levels)
        ]
        
        return risks
    
    def _calculate_temperature_risk_scores_vectorized(
        self,
        temp_max: np.ndarray,
        temp_min: np.ndarray,
        optimal_min: float,
        optimal_max: float,
        growth_stage_weight: float = 1.0
    ) -> np.ndarray:
        """
        Calculate temperature extreme risk scores using vectorized operations.
        
        Args:
            temp_max: Array of daily maximum temperatures in Celsius
            temp_min: Array of daily minimum temperatures in Celsius
            optimal_min: Optimal minimum temperature for crop
            optimal_max: Optimal maximum temperature for crop
            growth_stage_weight: Multiplier for growth stage sensitivity
            
        Returns:
            Array of risk scores from 0-100
        """
        deviation_threshold = self.temp_extreme_config["deviation_threshold"]
        extreme_heat = self.temp_extreme_config["extreme_heat_threshold"]
        extreme_cold = self.temp_extreme_config["extreme_cold_threshold"]
        
        # Calculate deviations from optimal range - vectorized
        max_temp_deviation = np.maximum(0.0, temp_max - optimal_max)
        min_temp_deviation = np.maximum(0.0, optimal_min - temp_min)
        
        # Risk from maximum temperature deviation (0-50 points) - vectorized
        max_risk = np.where(
            max_temp_deviation <= deviation_threshold,
            10.0 * (max_temp_deviation / deviation_threshold),
            10.0 + np.minimum(40.0, 4.0 * (max_temp_deviation - deviation_threshold))
        )
        
        # Risk from minimum temperature deviation (0-50 points) - vectorized
        min_risk = np.where(
            min_temp_deviation <= deviation_threshold,
            10.0 * (min_temp_deviation / deviation_threshold),
            10.0 + np.minimum(40.0, 4.0 * (min_temp_deviation - deviation_threshold))
        )
        
        # Extreme temperature penalties - vectorized
        extreme_penalty = np.zeros_like(temp_max)
        extreme_penalty += np.where(temp_max >= extreme_heat, 20.0, 0.0)
        extreme_penalty += np.where(temp_min <= extreme_cold, 20.0, 0.0)
        
        # Total risk with growth stage weighting - vectorized
        base_risk = max_risk + min_risk + extreme_penalty
        weighted_risk = base_risk * growth_stage_weight
        
        return np.minimum(100.0, weighted_risk)
    
    def _calculate_temperature_risk_score(
        self,
        temp_max: float,
        temp_min: float,
        optimal_min: float,
        optimal_max: float,
        growth_stage_weight: float = 1.0
    ) -> float:
        """
        Calculate temperature extreme risk score (scalar version for backward compatibility).
        
        Args:
            temp_max: Daily maximum temperature in Celsius
            temp_min: Daily minimum temperature in Celsius
            optimal_min: Optimal minimum temperature for crop
            optimal_max: Optimal maximum temperature for crop
            growth_stage_weight: Multiplier for growth stage sensitivity
            
        Returns:
            Risk score from 0-100
        """
        # Use vectorized version with single values
        result = self._calculate_temperature_risk_scores_vectorized(
            np.array([temp_max]),
            np.array([temp_min]),
            optimal_min,
            optimal_max,
            growth_stage_weight
        )
        return float(result[0])

    @profiler.profile_function("calculate_soil_moisture_proxy")
    def calculate_soil_moisture_proxy(
        self,
        precipitation: np.ndarray,
        temperature: np.ndarray,
        humidity: np.ndarray,
        dates: List[datetime],
        initial_moisture: Optional[float] = None
    ) -> List[SoilMoistureProxy]:
        """
        Estimate soil moisture using simplified water balance model with optimized calculations.
        
        Water balance: soil_moisture = previous_moisture + precipitation - ET - drainage
        
        Args:
            precipitation: Array of daily precipitation in mm
            temperature: Array of daily mean temperature in Celsius
            humidity: Array of daily mean relative humidity (0-100)
            dates: List of datetime objects for each forecast day
            initial_moisture: Optional initial soil moisture (0-100%). If None, uses config default
            
        Returns:
            List of SoilMoistureProxy objects, one per day
        """
        if initial_moisture is not None:
            self.soil_moisture_state = initial_moisture
        
        field_capacity = self.soil_config["field_capacity"]
        wilting_point = self.soil_config["wilting_point"]
        precip_efficiency = self.soil_config["precipitation_efficiency"]
        drainage_coef = self.soil_config["drainage_coefficient"]
        
        n_days = len(precipitation)
        
        # Pre-allocate arrays for results
        moisture_states = np.zeros(n_days)
        et_values = np.zeros(n_days)
        drainage_values = np.zeros(n_days)
        
        # Vectorized ET calculation
        et_values = self._calculate_evapotranspiration_vectorized(temperature, humidity)
        
        # Calculate effective precipitation
        effective_precip = precipitation * precip_efficiency
        
        # Iterative moisture calculation (cannot be fully vectorized due to state dependency)
        current_moisture = self.soil_moisture_state
        for i in range(n_days):
            # Update soil moisture
            current_moisture += effective_precip[i] - et_values[i]
            
            # Calculate drainage for excess water
            if current_moisture > field_capacity:
                excess = current_moisture - field_capacity
                drainage_values[i] = excess * drainage_coef
                current_moisture -= drainage_values[i]
            
            # Apply constraints
            current_moisture = max(wilting_point, min(field_capacity, current_moisture))
            moisture_states[i] = current_moisture
        
        # Update state
        self.soil_moisture_state = current_moisture
        
        # Vectorized moisture level determination
        moisture_levels = np.where(moisture_states < 30, "dry",
                                  np.where(moisture_states < 80, "optimal", "saturated"))
        
        # Build result list
        moisture_proxies = [
            SoilMoistureProxy(
                date=date,
                moisture_percent=float(moisture),
                precipitation_mm=float(precip),
                evapotranspiration_mm=float(et),
                drainage_mm=float(drainage),
                moisture_level=moisture_level
            )
            for date, moisture, precip, et, drainage, moisture_level
            in zip(dates, moisture_states, precipitation, et_values, drainage_values, moisture_levels)
        ]
        
        return moisture_proxies
    
    def _calculate_evapotranspiration_vectorized(
        self,
        temperature: np.ndarray,
        humidity: np.ndarray
    ) -> np.ndarray:
        """
        Calculate daily evapotranspiration from temperature and humidity using vectorized operations.
        
        Uses simplified Hargreaves method adjusted for humidity.
        
        Args:
            temperature: Array of daily mean temperatures in Celsius
            humidity: Array of daily mean relative humidity (0-100)
            
        Returns:
            Array of evapotranspiration values in mm/day
        """
        base_et = self.soil_config["evapotranspiration_base"]
        temp_coef = self.soil_config["et_temp_coefficient"]
        
        # Temperature effect (ET increases with temperature above 25°C) - vectorized
        temp_effect = 1.0 + temp_coef * (temperature - 25.0)
        temp_effect = np.maximum(0.1, temp_effect)  # Minimum 10% of base ET
        
        # Humidity effect (ET decreases with high humidity) - vectorized
        humidity_factor = 1.0 - (humidity / 200.0)  # Reduces ET by up to 50% at 100% humidity
        humidity_factor = np.clip(humidity_factor, 0.5, 1.0)
        
        et = base_et * temp_effect * humidity_factor
        
        return np.maximum(0.0, et)
    
    def _calculate_evapotranspiration(
        self,
        temperature: float,
        humidity: float
    ) -> float:
        """
        Calculate daily evapotranspiration from temperature and humidity (scalar version).
        
        Uses simplified Hargreaves method adjusted for humidity.
        
        Args:
            temperature: Daily mean temperature in Celsius
            humidity: Daily mean relative humidity (0-100)
            
        Returns:
            Evapotranspiration in mm/day
        """
        # Use vectorized version with single values
        result = self._calculate_evapotranspiration_vectorized(
            np.array([temperature]),
            np.array([humidity])
        )
        return float(result[0])
    
    def calculate_confidence_score(
        self,
        forecast_day: int,
        model_uncertainty: Optional[float] = None
    ) -> float:
        """
        Calculate confidence score for a forecast day.
        
        Confidence decreases with forecast horizon and increases with model certainty.
        
        Args:
            forecast_day: Day number in forecast (1-10)
            model_uncertainty: Optional model uncertainty metric (0-1). If None, ignored
            
        Returns:
            Confidence score from 0-1
        """
        base_confidence = self.confidence_config["base_confidence"]
        decay_rate = self.confidence_config["decay_rate"]
        min_confidence = self.confidence_config["min_confidence"]
        
        # Exponential decay with forecast day
        day_confidence = base_confidence * np.exp(-decay_rate * (forecast_day - 1))
        day_confidence = max(min_confidence, day_confidence)
        
        # Adjust for model uncertainty if provided
        if model_uncertainty is not None:
            uncertainty_factor = 1.0 - model_uncertainty
            day_confidence *= uncertainty_factor
        
        return float(np.clip(day_confidence, 0.0, 1.0))
    
    def reset_soil_moisture(self, initial_moisture: Optional[float] = None):
        """
        Reset soil moisture state to initial value.
        
        Args:
            initial_moisture: Optional initial moisture (0-100%). If None, uses config default
        """
        if initial_moisture is not None:
            self.soil_moisture_state = initial_moisture
        else:
            self.soil_moisture_state = self.soil_config["initial_moisture"]
