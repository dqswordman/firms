import requests
import json
from pprint import pprint
from datetime import datetime

def debug_response():
    url = "http://localhost:8000/fires"
    
    # 使用与前端一致的参数
    params = {
        "country": "USA",
        "start_date": "2025-05-20",
        "end_date": "2025-05-21"
    }
    
    print(f"Testing with parameters: {params}")
    
    try:
        response = requests.get(url, params=params)
        print("Status Code:", response.status_code)
        print("Content-Type:", response.headers.get('Content-Type'))
        print("Content length:", len(response.content))

        if response.status_code == 200:
            try:
                data = response.json()
                print("\nResponse is valid JSON")
                print("Response Data Length:", len(data))
                
                # 检查数据结构是否符合前端 FirePoint 接口
                if len(data) > 0:
                    first_item = data[0]
                    print("\nFirst item keys:", list(first_item.keys()))
                    
                    required_keys = [
                        "latitude", "longitude", "bright_ti4", "bright_ti5", 
                        "frp", "confidence", "acq_date", "acq_time", 
                        "satellite", "country_id", "daynight", "instrument", 
                        "scan", "track", "version"
                    ]
                    
                    missing_keys = [key for key in required_keys if key not in first_item]
                    if missing_keys:
                        print("\nWARNING: Missing required keys:", missing_keys)
                    else:
                        print("\nAll required keys present")
                    
                    # 检查 acq_date 格式
                    if "acq_date" in first_item:
                        print("\nacq_date format:", first_item["acq_date"])
                        try:
                            datetime.strptime(first_item["acq_date"], "%Y-%m-%d")
                            print("acq_date format is valid")
                        except ValueError:
                            print("WARNING: acq_date format is invalid!")
                    
                    # 输出完整的第一条记录
                    print("\nFirst record details:")
                    pprint(first_item)
                else:
                    print("\nNo data returned")
            except json.JSONDecodeError:
                print("\nWARNING: Response is not valid JSON!")
                print("Raw response (first 1000 chars):")
                print(response.text[:1000])
        else:
            print("\nError Response:")
            print(response.text)
        
    except requests.exceptions.RequestException as e:
        print("Error:", str(e))

if __name__ == "__main__":
    debug_response() 