import requests
import json
from datetime import datetime, timedelta

def test_historical_data():
    base_url = "http://localhost:8000/fires"
    
    # Get current date
    today = datetime.utcnow().date()
    
    # Test different historical periods
    date_ranges = [
        {
            "name": "Recent Data (NRT)",
            "start": (today - timedelta(days=3)).strftime("%Y-%m-%d"),
            "end": (today - timedelta(days=2)).strftime("%Y-%m-%d")
        },
        {
            "name": "Recent Data (SP)",
            "start": (today - timedelta(days=15)).strftime("%Y-%m-%d"),
            "end": (today - timedelta(days=14)).strftime("%Y-%m-%d")
        },
        {
            "name": "2023 Data",
            "start": "2023-05-01",
            "end": "2023-05-02"
        },
        {
            "name": "2022 Data",
            "start": "2022-05-01",
            "end": "2022-05-02"
        },
        {
            "name": "2021 Data",
            "start": "2021-05-01",
            "end": "2021-05-02"
        },
        {
            "name": "2020 Data",
            "start": "2020-05-01",
            "end": "2020-05-02"
        }
    ]
    
    print("Testing historical data query capabilities...")
    print("-" * 50)
    
    for date_range in date_ranges:
        # Test country query
        country_params = {
            "country": "USA",
            "start_date": date_range["start"],
            "end_date": date_range["end"]
        }
        
        # Test coordinate range query
        bbox_params = {
            "west": -125.0,
            "south": 30.0,
            "east": -120.0,
            "north": 35.0,
            "start_date": date_range["start"],
            "end_date": date_range["end"]
        }
        
        print(f"\nTesting {date_range['name']}: {date_range['start']} to {date_range['end']}")
        
        # Test country query
        print("\n1. Country Query Test:")
        print(f"Parameters: {country_params}")
        try:
            response = requests.get(base_url, params=country_params)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Number of records: {len(data)}")
                if len(data) > 0:
                    print("Sample data (first record):")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
            else:
                print(f"Request failed: {response.text}")
        except Exception as e:
            print(f"Request error: {str(e)}")
        
        # Test coordinate range query
        print("\n2. Coordinate Range Query Test:")
        print(f"Parameters: {bbox_params}")
        try:
            response = requests.get(base_url, params=bbox_params)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Number of records: {len(data)}")
                if len(data) > 0:
                    print("Sample data (first record):")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
            else:
                print(f"Request failed: {response.text}")
        except Exception as e:
            print(f"Request error: {str(e)}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_historical_data() 