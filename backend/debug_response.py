import requests
import json
from pprint import pprint
from datetime import datetime

def debug_response():
    url = "http://localhost:8000/api/fires"

    # Use parameters consistent with the frontend
    params = {
        "country": "USA",
        "start_date": "2025-09-17",
        "end_date": "2025-09-23",
        "format": "geojson",
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
                # Expect GeoJSON FeatureCollection
                print("Type:", data.get("type"))
                features = data.get("features") or []
                print("Features:", len(features))
                if features:
                    first = features[0]
                    print("\nFirst feature keys:", list(first.keys()))
                    props = first.get("properties", {})
                    print("Sample properties keys:", list(props.keys())[:12])
                else:
                    print("No features in range.")
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
