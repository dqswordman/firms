from fastapi.testclient import TestClient
from main import app


def test_fallback_to_sp(monkeypatch):
    client = TestClient(app)

    def fake_check(map_key, sensor):
        return {
            "VIIRS_SNPP_NRT": ("2024-01-01", "2024-01-10"),
            "VIIRS_SNPP_SP": ("2023-01-01", "2024-12-31"),
        }

    result = [
        {
            "latitude": "0",
            "longitude": "0",
            "bright_ti4": "0",
            "acq_date": "2024-02-01",
            "acq_time": "0000",
        }
    ]

    called = {}

    def fake_fetch(url):
        called["url"] = url
        return result

    monkeypatch.setattr("main.check_data_availability", fake_check)
    monkeypatch.setattr("main._fetch_firms_data", fake_fetch)

    resp = client.get(
        "/fires",
        params={
            "west": 0,
            "south": 0,
            "east": 1,
            "north": 1,
            "start_date": "2024-02-01",
            "end_date": "2024-02-02",
            "sourcePriority": "VIIRS_SNPP_NRT,VIIRS_SNPP_SP",
        },
    )

    assert resp.status_code == 200
    assert "VIIRS_SNPP_SP" in called["url"]
    assert resp.json() == result


def test_no_source_available(monkeypatch):
    client = TestClient(app)

    def fake_check(map_key, sensor):
        return {
            "VIIRS_SNPP_NRT": ("2024-01-01", "2024-01-10"),
            "VIIRS_SNPP_SP": ("2023-01-01", "2023-12-31"),
        }

    def fake_fetch(url):
        raise AssertionError("should not be called")

    monkeypatch.setattr("main.check_data_availability", fake_check)
    monkeypatch.setattr("main._fetch_firms_data", fake_fetch)

    resp = client.get(
        "/fires",
        params={
            "west": 0,
            "south": 0,
            "east": 1,
            "north": 1,
            "start_date": "2024-02-01",
            "end_date": "2024-02-02",
            "sourcePriority": "VIIRS_SNPP_NRT,VIIRS_SNPP_SP",
        },
    )

    assert resp.status_code == 200
    assert resp.json() == []
    assert (
        resp.headers.get("X-Data-Availability")
        == "No data available for requested date range"
    )
