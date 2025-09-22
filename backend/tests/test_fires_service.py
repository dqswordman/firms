import asyncio
import json

import pytest
from fastapi import Response

from app.services.fires import FireQueryContext, FireService
from app.clients.firms import FIRMSClient


@pytest.fixture(autouse=True)
def reset_settings():
    from app.core.config import settings

    original_key = getattr(settings, "firms_map_key", None)
    try:
        settings.firms_map_key = "mock-key"
        yield
    finally:
        settings.firms_map_key = original_key


@pytest.mark.asyncio
async def test_prepare_query_country_success(monkeypatch):
    service = FireService()

    async def fake_to_thread(func, *args, **kwargs):
        return {"VIIRS_SNPP_NRT": ("2024-01-01", "2024-01-10")}

    monkeypatch.setattr("app.services.fires.asyncio.to_thread", fake_to_thread)

    ctx = await service.prepare_query(
        response=Response(),
        country="USA",
        west=None,
        south=None,
        east=None,
        north=None,
        start_date="2024-01-05",
        end_date="2024-01-06",
        source_priority=None,
    )

    assert isinstance(ctx, FireQueryContext)
    assert ctx.selected_source == "VIIRS_SNPP_NRT"
    assert len(ctx.urls) > 0


@pytest.mark.asyncio
async def test_prepare_query_no_data(monkeypatch):
    service = FireService()

    async def fake_to_thread(func, *args, **kwargs):
        return {}

    monkeypatch.setattr("app.services.fires.asyncio.to_thread", fake_to_thread)

    response = Response()
    ctx = await service.prepare_query(
        response=response,
        country="USA",
        west=None,
        south=None,
        east=None,
        north=None,
        start_date="2024-01-05",
        end_date="2024-01-06",
        source_priority=None,
    )

    assert ctx is None
    assert response.headers["X-Data-Availability"] == "No data available for requested date range"


@pytest.mark.asyncio
async def test_fetch_deduplicates(monkeypatch):
    service = FireService()
    ctx = FireQueryContext(urls=["u1", "u2"], selected_source="SRC")

    async def fake_fetch_records(self, url, source, client):
        return [
            {"acq_date": "2024-01-01", "acq_time": "0000", "latitude": "1", "longitude": "1", "source": source},
            {"acq_date": "2024-01-01", "acq_time": "0000", "latitude": "1", "longitude": "1", "source": source},
            {"acq_date": "2024-01-02", "acq_time": "1200", "latitude": "2", "longitude": "2", "source": source},
        ]

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(FIRMSClient, "fetch_records", fake_fetch_records, raising=False)
    monkeypatch.setattr("app.services.fires.httpx.AsyncClient", DummyAsyncClient)

    records = await service.fetch(ctx)
    assert len(records) == 2


@pytest.mark.asyncio
async def test_stream_ndjson(monkeypatch):
    service = FireService()
    ctx = FireQueryContext(urls=["u"], selected_source="SRC")

    async def fake_stream_records(self, url, source, client):
        rows = [
            {"acq_date": "2024-01-01", "acq_time": "0000", "latitude": "1", "longitude": "1", "source": source},
            {"acq_date": "2024-01-01", "acq_time": "0000", "latitude": "1", "longitude": "1", "source": source},
            {"acq_date": "2024-01-01", "acq_time": "0100", "latitude": "1", "longitude": "2", "source": source},
        ]
        for row in rows:
            yield row

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(FIRMSClient, "stream_records", fake_stream_records, raising=False)
    monkeypatch.setattr("app.services.fires.httpx.AsyncClient", DummyAsyncClient)

    chunks = []
    async for chunk in service.stream_ndjson(ctx):
        chunks.append(chunk)

    assert len(chunks) == 2
    assert all(chunk.endswith(b"\n") for chunk in chunks)
    payload = [json.loads(chunk.decode("utf-8")) for chunk in chunks]
    assert payload[0]["geometry"]["type"] == "Point"


def test_compute_stats():
    service = FireService()
    data = [
        {"frp": "25", "daynight": "D", "confidence": "100", "satellite": "NPP"},
        {"frp": 10, "daynight": "N", "confidence": "50", "satellite": "T"},
        {"frp": 2, "daynight": "N", "confidence": "l", "satellite": "Q"},
    ]
    stats = service.compute_stats(data, frp_mid=5, frp_high=20)
    assert stats["totalPoints"] == 3
    assert stats["frpHighCount"] == 1
    assert stats["frpMidCount"] == 1
    assert stats["frpLowCount"] == 1
    assert stats["dayCount"] == 1
    assert stats["nightCount"] == 2
