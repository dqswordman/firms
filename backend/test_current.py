import requests
import json
from datetime import datetime, timedelta


def test_current_fires():
    url = "http://localhost:8000/fires"

    # Use the current date
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)

    # Format dates as YYYY-MM-DD
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
            if isinstance(data, dict):
                records = data.get('features') or data.get('items') or []
            else:
                records = data

            print("\nResponse Data Length:", len(records))
            if records:
                print("\nFirst few records:")
                preview = list(records) if not isinstance(records, list) else records
                print(json.dumps(preview[:3], indent=2, default=str))
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
