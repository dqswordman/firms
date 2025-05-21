import requests
import json
from datetime import datetime, timedelta

def test_current_fires():
    url = "http://localhost:8000/fires"
    
    # 使用当前日期
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    # 格式化日期为 YYYY-MM-DD
    end_date = today.strftime("%Y-%m-%d")
    start_date = yesterday.strftime("%Y-%m-%d")
    
    params = {
        "country": "USA",
        "start_date": start_date,
        "end_date": end_date
    }
    
    print(f"Testing with parameters: {params}")
    
    try:
        response = requests.get(url, params=params)
        print("Status Code:", response.status_code)
        print("Headers:", dict(response.headers))
        
        if response.status_code == 200:
            data = response.json()
            print("\nResponse Data Length:", len(data))
            if len(data) > 0:
                print("\nFirst few records:")
                print(json.dumps(data[:3], indent=2))
            else:
                print("\nNo data returned")
                print("\nRaw response content (first 500 chars):")
                print(response.text[:500])
        else:
            print("\nError Response:")
            print(response.text)
        
    except requests.exceptions.RequestException as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_current_fires() 