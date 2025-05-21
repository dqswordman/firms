import requests
import json
from datetime import datetime

def test_multiple_date_ranges():
    base_url = "http://localhost:8000/fires"
    
    # 测试不同日期范围
    date_ranges = [
        {"name": "5月1日-2日", "start": "2025-05-01", "end": "2025-05-02"},
        {"name": "5月10日-11日", "start": "2025-05-10", "end": "2025-05-11"},
        {"name": "5月20日-21日", "start": "2025-05-20", "end": "2025-05-21"}
    ]
    
    print("正在测试不同日期范围的查询结果...")
    print("-" * 50)
    
    for date_range in date_ranges:
        params = {
            "country": "USA",
            "start_date": date_range["start"],
            "end_date": date_range["end"]
        }
        
        print(f"\n测试 {date_range['name']} 日期范围:")
        print(f"参数: {params}")
        
        try:
            response = requests.get(base_url, params=params)
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"返回数据条数: {len(data)}")
                
                if len(data) > 0:
                    print("示例数据:")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
                else:
                    print("没有返回数据")
            else:
                print(f"请求失败: {response.text}")
                
        except Exception as e:
            print(f"请求异常: {str(e)}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_multiple_date_ranges() 