"""
Quick test for /api/agri_analysis endpoint
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_agri_analysis():
    """Test the new agri_analysis endpoint"""
    print("\n" + "="*60)
    print("Testing /api/agri_analysis endpoint")
    print("="*60)
    
    # Test Case 1: Simple text without context
    print("\nTest Case 1: Drought stress detection")
    print("-" * 60)
    
    test_data = {
        "text": "My crops are wilting and the soil is very dry"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/agri_analysis",
            json=test_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success!")
            print(f"Model: {result['model']}")
            print(f"Category: {result['analysis']['category']}")
            print(f"Confidence: {result['analysis']['confidence']}")
            print(f"Recommendations ({len(result['analysis']['recommendations'])}):")
            for i, rec in enumerate(result['analysis']['recommendations'][:3], 1):
                print(f"  {i}. {rec}")
            print(f"Timestamp: {result['timestamp']}")
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend!")
        print("Make sure the server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test Case 2: With context
    print("\n\nTest Case 2: Nutrient deficiency with context")
    print("-" * 60)
    
    test_data = {
        "text": "Yellow leaves and stunted growth in my rice field",
        "context": {
            "crop": "rice",
            "region": "Pune, Maharashtra",
            "season": "monsoon"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/agri_analysis",
            json=test_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success!")
            print(f"Category: {result['analysis']['category']}")
            print(f"Confidence: {result['analysis']['confidence']}")
            print(f"Recommendations: {len(result['analysis']['recommendations'])} items")
            # Show last recommendation (should include context-specific info)
            if result['analysis']['recommendations']:
                print(f"Last recommendation: {result['analysis']['recommendations'][-1]}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print("\n" + "="*60)
    print("✅ All tests completed successfully!")
    print("="*60)
    return True

if __name__ == "__main__":
    test_agri_analysis()
