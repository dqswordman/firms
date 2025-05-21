import requests
import json
from datetime import datetime, timedelta

def test_historical_data():
    base_url = "http://localhost:8000/fires"
    
    # 获取当前日期
    today = datetime.utcnow().date()
    
    # 测试不同历史时期
    date_ranges = [
        {
            "name": "最近数据（NRT）",
            "start": (today - timedelta(days=3)).strftime("%Y-%m-%d"),
            "end": (today - timedelta(days=2)).strftime("%Y-%m-%d")
        },
        {
            "name": "近期数据（SP）",
            "start": (today - timedelta(days=15)).strftime("%Y-%m-%d"),
            "end": (today - timedelta(days=14)).strftime("%Y-%m-%d")
        },
        {
            "name": "2023年数据",
            "start": "2023-05-01",
            "end": "2023-05-02"
        },
        {
            "name": "2022年数据",
            "start": "2022-05-01",
            "end": "2022-05-02"
        },
        {
            "name": "2021年数据",
            "start": "2021-05-01",
            "end": "2021-05-02"
        },
        {
            "name": "2020年数据",
            "start": "2020-05-01",
            "end": "2020-05-02"
        }
    ]
    
    print("正在测试历史数据查询能力...")
    print("-" * 50)
    
    for date_range in date_ranges:
        # 测试国家查询
        country_params = {
            "country": "USA",
            "start_date": date_range["start"],
            "end_date": date_range["end"]
        }
        
        # 测试坐标范围查询
        bbox_params = {
            "west": -125.0,
            "south": 30.0,
            "east": -120.0,
            "north": 35.0,
            "start_date": date_range["start"],
            "end_date": date_range["end"]
        }
        
        print(f"\n测试 {date_range['name']}: {date_range['start']} 到 {date_range['end']}")
        
        # 测试国家查询
        print("\n1. 国家查询测试:")
        print(f"参数: {country_params}")
        try:
            response = requests.get(base_url, params=country_params)
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"返回数据条数: {len(data)}")
                if len(data) > 0:
                    print("示例数据 (第一条):")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
            else:
                print(f"请求失败: {response.text}")
        except Exception as e:
            print(f"请求异常: {str(e)}")
        
        # 测试坐标范围查询
        print("\n2. 坐标范围查询测试:")
        print(f"参数: {bbox_params}")
        try:
            response = requests.get(base_url, params=bbox_params)
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"返回数据条数: {len(data)}")
                if len(data) > 0:
                    print("示例数据 (第一条):")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
            else:
                print(f"请求失败: {response.text}")
        except Exception as e:
            print(f"请求异常: {str(e)}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_historical_data() 