from utils.geojson import to_geojson


def test_to_geojson_transforms_records():
    records = [
        {
            "latitude": "10",
            "longitude": "20",
            "bright_ti4": "300",
            "frp": "1",
            "acq_date": "2024-01-01",
            "acq_time": "1200",
            "satellite": "S",
            "instrument": "I",
            "daynight": "D",
            "source": "SRC",
            "country_id": "USA",
            "confidence": "high",
        },
        {
            "latitude": "11",
            "longitude": "21",
            "bright_ti5": "290",
            "frp": "2",
            "acq_date": "2024-01-02",
            "acq_time": "0100",
            "satellite": "S",
            "instrument": "I",
            "daynight": "N",
            "source": "SRC",
            "country_id": "CAN",
            "confidence": "42",
        },
    ]

    geojson = to_geojson(records)
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 2

    f1 = geojson["features"][0]
    assert f1["geometry"]["coordinates"] == [20.0, 10.0]
    p1 = f1["properties"]
    assert p1["brightness"] == 300.0
    assert p1["confidence"] == 100
    assert p1["confidence_text"] == "high"
    assert p1["acq_datetime"] == "2024-01-01T12:00:00Z"

    f2 = geojson["features"][1]
    assert f2["properties"]["brightness"] == 290.0
    assert f2["properties"]["confidence"] == 42
    assert f2["properties"]["confidence_text"] == "42"
    assert f2["properties"]["acq_datetime"] == "2024-01-02T01:00:00Z"
