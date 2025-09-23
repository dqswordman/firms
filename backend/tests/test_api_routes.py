import pytest
import httpx
from httpx import ASGITransport


@pytest.fixture(autouse=True)
def set_mock_map_key():
    from app.core.config import settings

    original = getattr(settings, "firms_map_key", None)
    settings.firms_map_key = "mock-key"
    try:
        yield
    finally:
        settings.firms_map_key = original


@pytest.mark.asyncio
async def test_health_route():
    from app.main import app

    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_fires_validation_error(monkeypatch):
    from app.main import app

    # Ensure availability path is not hit for validation-only failure
    async def fake_to_thread(func, *args, **kwargs):  # pragma: no cover - safety
        return {}

    monkeypatch.setattr("app.services.fires.asyncio.to_thread", fake_to_thread)

    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Missing both country and bbox
        resp = await client.get("/api/fires")
        assert resp.status_code == 400
        payload = resp.json()
        assert payload["detail"]["code"] == 400
        assert "Must provide either country code" in payload["detail"]["message"]


@pytest.mark.asyncio
async def test_fires_geojson_success(monkeypatch):
    from app.main import app

    async def fake_to_thread(func, *args, **kwargs):
        # Provide a broad availability window so requested dates match
        return {"VIIRS_SNPP_NRT": ("2024-01-01", "2024-01-31")}

    async def fake_fetch(ctx, max_concurrency=None):
        # Two sample points that should appear as two GeoJSON features
        return [
            {"acq_date": "2024-01-05", "acq_time": "0000", "latitude": 1, "longitude": 1, "source": ctx.selected_source},
            {"acq_date": "2024-01-06", "acq_time": "0100", "latitude": 2, "longitude": 2, "source": ctx.selected_source},
        ]

    monkeypatch.setattr("app.services.fires.asyncio.to_thread", fake_to_thread)
    # Patch the module-level service used by the router
    monkeypatch.setattr("app.api.routes.fires.service.fetch", fake_fetch)

    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/fires",
            params={
                "country": "USA",
                "start_date": "2024-01-05",
                "end_date": "2024-01-06",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["type"] == "FeatureCollection"
        assert len(body.get("features", [])) == 2


@pytest.mark.asyncio
async def test_fires_stats_success(monkeypatch):
    from app.main import app

    async def fake_to_thread(func, *args, **kwargs):
        return {"VIIRS_SNPP_NRT": ("2024-01-01", "2024-01-31")}

    async def fake_fetch(ctx, max_concurrency=None):
        return [
            {"frp": "25", "daynight": "D", "confidence": "100", "satellite": "N"},
            {"frp": 10, "daynight": "N", "confidence": "50", "satellite": "T"},
            {"frp": 2, "daynight": "N", "confidence": "l", "satellite": "Q"},
        ]

    monkeypatch.setattr("app.services.fires.asyncio.to_thread", fake_to_thread)
    monkeypatch.setattr("app.api.routes.fires.service.fetch", fake_fetch)

    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/fires/stats",
            params={
                "country": "USA",
                "start_date": "2024-01-05",
                "end_date": "2024-01-06",
            },
        )
        assert resp.status_code == 200
        stats = resp.json()
        assert stats["totalPoints"] == 3
        assert stats["frpHighCount"] == 1
        assert stats["dayCount"] == 1
        assert stats["nightCount"] == 2


    # legacy root routes removed; prefer /api/fires
