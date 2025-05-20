import requests
import json

def test_fires_endpoint():
    url = "http://localhost:8000/fires"
    params = {
        "country": "USA",
        "start_date": "2024-03-18",
        "end_date": "2024-03-20"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        # Pretty print the JSON response
        print("Status Code:", response.status_code)
        print("\nResponse Data:")
        print(json.dumps(response.json(), indent=2))
        
    except requests.exceptions.RequestException as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_fires_endpoint() 