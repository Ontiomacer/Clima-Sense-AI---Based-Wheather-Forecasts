"""
Quick test script to verify the deprecated /api/ai-recommend endpoint
Returns HTTP 410 Gone with migration information
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_deprecated_endpoint():
    """Test that /api/ai-recommend returns 410 Gone"""
    print("\n" + "="*60)
    print("Testing Deprecated /api/ai-recommend Endpoint")
    print("="*60)
    
    test_data = {"prompt": "Suggest crops for high humidity"}
    
    print(f"\nSending request to: {BASE_URL}/api/ai-recommend")
    print(f"Request body: {json.dumps(test_data, indent=2)}")
    print("-" * 60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai-recommend",
            json=test_data,
            timeout=5
        )
        
        print(f"\n✅ Response Status Code: {response.status_code}")
        
        if response.status_code == 410:
            print("✅ Correctly returns HTTP 410 Gone")
            
            result = response.json()
            detail = result.get('detail', {})
            
            print(f"\nError: {detail.get('error', 'N/A')}")
            print(f"\nMessage: {detail.get('message', 'N/A')}")
            
            print("\n📍 Alternative Endpoints:")
            alternatives = detail.get('alternatives', {})
            
            if 'weather_forecast' in alternatives:
                wf = alternatives['weather_forecast']
                print(f"\n  1. {wf.get('endpoint', 'N/A')}")
                print(f"     {wf.get('description', 'N/A')}")
                print(f"     Example: {json.dumps(wf.get('example', {}), indent=6)}")
            
            if 'agricultural_analysis' in alternatives:
                aa = alternatives['agricultural_analysis']
                print(f"\n  2. {aa.get('endpoint', 'N/A')}")
                print(f"     {aa.get('description', 'N/A')}")
                print(f"     Example: {json.dumps(aa.get('example', {}), indent=6)}")
            
            print(f"\n📖 Migration Guide:")
            print(f"   {detail.get('migration_guide', 'N/A')}")
            
            print("\n" + "="*60)
            print("✅ TEST PASSED: Endpoint correctly deprecated")
            print("="*60)
            return True
        else:
            print(f"❌ Expected 410 Gone, got {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to backend!")
        print("Make sure the server is running on http://localhost:8000")
        print("Run: cd ai-backend && python main.py")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_deprecated_endpoint()
    exit(0 if success else 1)
