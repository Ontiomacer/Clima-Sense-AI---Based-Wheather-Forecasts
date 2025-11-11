"""
Test script for ClimaSense AI Backend endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("Testing /api/health")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_analyze_farm():
    """Test farm analysis endpoint"""
    print("\n" + "="*60)
    print("Testing /api/analyze-farm")
    print("="*60)
    
    test_cases = [
        {"text": "soil is dry and temperature is rising"},
        {"text": "crops showing yellow leaves and stunted growth"},
        {"text": "heavy rainfall causing waterlogging in fields"},
        {"text": "insects eating the leaves of my plants"},
    ]
    
    for i, test_data in enumerate(test_cases, 1):
        print(f"\nTest Case {i}: {test_data['text']}")
        print("-" * 60)
        
        response = requests.post(
            f"{BASE_URL}/api/analyze-farm",
            json=test_data
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Model: {result['model']}")
            print(f"Prediction: {result['prediction']}")
            print(f"Confidence: {result['confidence']}")
            print(f"Timestamp: {result['timestamp']}")
        else:
            print(f"Error: {response.text}")
    
    return True

def test_agri_analysis():
    """Test agricultural analysis endpoint with recommendations"""
    print("\n" + "="*60)
    print("Testing /api/agri_analysis")
    print("="*60)
    
    test_cases = [
        {
            "text": "My crops are showing yellow leaves and stunted growth",
            "context": {
                "crop": "rice",
                "region": "Pune, Maharashtra",
                "season": "monsoon"
            }
        },
        {
            "text": "soil is very dry and plants are wilting",
            "context": {
                "crop": "wheat",
                "region": "Maharashtra"
            }
        },
        {
            "text": "heavy rainfall causing standing water in fields",
            "context": None
        },
        {
            "text": "insects eating the leaves of my tomato plants",
            "context": {
                "crop": "tomato",
                "season": "summer"
            }
        },
    ]
    
    for i, test_data in enumerate(test_cases, 1):
        print(f"\nTest Case {i}: {test_data['text']}")
        print("-" * 60)
        
        response = requests.post(
            f"{BASE_URL}/api/agri_analysis",
            json=test_data
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Model: {result['model']}")
            print(f"Category: {result['analysis']['category']}")
            print(f"Confidence: {result['analysis']['confidence']}")
            print(f"Recommendations ({len(result['analysis']['recommendations'])}):")
            for j, rec in enumerate(result['analysis']['recommendations'][:3], 1):
                print(f"  {j}. {rec}")
            if len(result['analysis']['recommendations']) > 3:
                print(f"  ... and {len(result['analysis']['recommendations']) - 3} more")
            print(f"Timestamp: {result['timestamp']}")
        else:
            print(f"Error: {response.text}")
    
    return True

def test_ai_recommend():
    """Test AI recommendation endpoint (DEPRECATED - should return 410)"""
    print("\n" + "="*60)
    print("Testing /api/ai-recommend (DEPRECATED)")
    print("="*60)
    
    test_data = {"prompt": "Suggest crops suitable for high humidity and low sunlight."}
    
    print(f"\nTest: {test_data['prompt']}")
    print("-" * 60)
    
    response = requests.post(
        f"{BASE_URL}/api/ai-recommend",
        json=test_data
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 410:
        result = response.json()
        print("✅ Endpoint correctly returns 410 Gone")
        print(f"Error: {result.get('detail', {}).get('error', 'N/A')}")
        print(f"Message: {result.get('detail', {}).get('message', 'N/A')}")
        print("\nAlternative Endpoints:")
        alternatives = result.get('detail', {}).get('alternatives', {})
        for key, alt in alternatives.items():
            print(f"  - {alt.get('endpoint', 'N/A')}: {alt.get('description', 'N/A')}")
        print(f"\nMigration Guide: {result.get('detail', {}).get('migration_guide', 'N/A')}")
    else:
        print(f"❌ Expected 410 Gone, got {response.status_code}")
        print(f"Response: {response.text}")
    
    return response.status_code == 410

def test_graphcast_forecast():
    """Test GraphCast weather forecast endpoint"""
    print("\n" + "="*60)
    print("Testing /api/graphcast_forecast")
    print("="*60)
    
    # Test Case 1: Valid request for Pune
    print("\nTest Case 1: Valid forecast request (Pune)")
    print("-" * 60)
    
    test_data = {
        "latitude": 18.5204,
        "longitude": 73.8567,
        "forecast_days": 10
    }
    
    response = requests.post(
        f"{BASE_URL}/api/graphcast_forecast",
        json=test_data
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Location: {result['location']['region']}")
        print(f"Forecast Days: {len(result['forecast'])}")
        print(f"Model Version: {result['metadata']['model_version']}")
        print(f"Cache Hit: {result['metadata']['cache_hit']}")
        print(f"Inference Time: {result['metadata']['inference_time_ms']}ms")
        
        # Display first day forecast
        if result['forecast']:
            first_day = result['forecast'][0]
            print(f"\nFirst Day Forecast ({first_day['date']}):")
            print(f"  Rain Risk: {first_day['rain_risk']:.1f}/100")
            print(f"  Temp Extreme: {first_day['temp_extreme']:.1f}/100")
            print(f"  Soil Moisture: {first_day['soil_moisture_proxy']:.1f}%")
            print(f"  Confidence: {first_day['confidence_score']:.2f}")
            print(f"  Precipitation: {first_day['raw_data']['precipitation_mm']:.1f}mm")
            print(f"  Temp Max: {first_day['raw_data']['temp_max_c']:.1f}°C")
    else:
        print(f"Error: {response.text}")
    
    # Test Case 2: Invalid coordinates (outside Maharashtra)
    print("\n\nTest Case 2: Invalid coordinates (outside Maharashtra)")
    print("-" * 60)
    
    invalid_data = {
        "latitude": 28.6139,  # New Delhi
        "longitude": 77.2090,
        "forecast_days": 10
    }
    
    response = requests.post(
        f"{BASE_URL}/api/graphcast_forecast",
        json=invalid_data
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Test Case 3: Test caching behavior (second request)
    print("\n\nTest Case 3: Cached forecast request (same location)")
    print("-" * 60)
    
    response = requests.post(
        f"{BASE_URL}/api/graphcast_forecast",
        json=test_data
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Cache Hit: {result['metadata']['cache_hit']}")
        print(f"Response Time: {result['metadata']['inference_time_ms']}ms")
        print("✅ Cache working correctly!" if result['metadata']['cache_hit'] else "⚠️ Cache miss")
    else:
        print(f"Error: {response.text}")
    
    # Test Case 4: Different forecast days
    print("\n\nTest Case 4: Shorter forecast (5 days)")
    print("-" * 60)
    
    short_forecast_data = {
        "latitude": 19.0760,  # Mumbai
        "longitude": 72.8777,
        "forecast_days": 5
    }
    
    response = requests.post(
        f"{BASE_URL}/api/graphcast_forecast",
        json=short_forecast_data
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Location: {result['location']['region']}")
        print(f"Forecast Days: {len(result['forecast'])}")
        print(f"Cache Hit: {result['metadata']['cache_hit']}")
    else:
        print(f"Error: {response.text}")
    
    return True

def test_root():
    """Test root endpoint"""
    print("\n" + "="*60)
    print("Testing / (root)")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

if __name__ == "__main__":
    print("\n" + "="*60)
    print("ClimaSense AI Backend - Endpoint Tests")
    print("="*60)
    print(f"Testing server at: {BASE_URL}")
    print("Make sure the backend is running!")
    print("="*60)
    
    try:
        # Test all endpoints
        test_root()
        test_health()
        test_analyze_farm()
        test_agri_analysis()
        test_ai_recommend()
        test_graphcast_forecast()
        
        print("\n" + "="*60)
        print("✅ All tests completed!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to backend!")
        print("Make sure the server is running on http://localhost:8000")
        print("Run: python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
