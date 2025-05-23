import requests
import json
from datetime import datetime

def test_multiple_date_ranges():
    base_url = "http://localhost:8000/fires"
    
    # Test different date ranges
    date_ranges = [
        {"name": "May 1-2", "start": "2025-05-01", "end": "2025-05-02"},
        {"name": "May 10-11", "start": "2025-05-10", "end": "2025-05-11"},
        {"name": "May 20-21", "start": "2025-05-20", "end": "2025-05-21"}
    ]
    
    print("Testing query results for different date ranges...")
    print("-" * 50)
    
    for date_range in date_ranges:
        params = {
            "country": "USA",
            "start_date": date_range["start"],
            "end_date": date_range["end"]
        }
        
        print(f"\nTesting {date_range['name']} date range:")
        print(f"Parameters: {params}")
        
        try:
            response = requests.get(base_url, params=params)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Number of records: {len(data)}")
                
                if len(data) > 0:
                    print("Sample data:")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
                else:
                    print("No data returned")
            else:
                print(f"Request failed: {response.text}")
                
        except Exception as e:
            print(f"Request error: {str(e)}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_multiple_date_ranges() 