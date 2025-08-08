import pytest
from fastapi.testclient import TestClient
from main import app, compute_stats


def test_compute_stats_basic():
    data = [
        {"frp": "25", "daynight": "D", "confidence": "85", "satellite": "N"},
        {"frp": "10", "daynight": "N", "confidence": "50", "satellite": "T"},
        {"frp": "3", "daynight": "D", "confidence": "l", "satellite": "A"},
    ]
    stats = compute_stats(data)
    assert stats["totalPoints"] == 3
    assert stats["frpHighCount"] == 1
    assert stats["frpMidCount"] == 1
    assert stats["frpLowCount"] == 1
    assert stats["dayCount"] == 2
    assert stats["nightCount"] == 1
    assert stats["highConfidence"] == 1
    assert stats["mediumConfidence"] == 1
    assert stats["lowConfidence"] == 1
    assert stats["viirsCount"] == 1
    assert stats["terraCount"] == 1
    assert stats["aquaCount"] == 1
    assert pytest.approx(stats["avgFrp"], 1e-6) == (25 + 10 + 3) / 3
    assert stats["maxFrp"] == 25
    assert stats["sumFrp"] == 38


def test_stats_endpoint(monkeypatch):
    sample = [
        {"frp": "25", "daynight": "D", "confidence": "85", "satellite": "N"},
        {"frp": "10", "daynight": "N", "confidence": "50", "satellite": "T"},
        {"frp": "3", "daynight": "D", "confidence": "l", "satellite": "A"},
    ]

    async def fake_fetch(urls, selected_source):
        return sample

    def fake_prepare(*args, **kwargs):
        return (["u"], "src")

    monkeypatch.setattr("main._fetch_deduped_data", fake_fetch)
    monkeypatch.setattr("main._prepare_fire_query", fake_prepare)

    client = TestClient(app)
    resp = client.get("/fires/stats?country=USA&start_date=2024-01-01&end_date=2024-01-01")
    assert resp.status_code == 200
    body = resp.json()
    assert body["totalPoints"] == 3
    assert body["frpHighCount"] == 1
