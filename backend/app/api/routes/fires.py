from fastapi import APIRouter, Query, Request, Response
from fastapi.responses import StreamingResponse

from ...services.fires import FireService
from ...core.config import settings

router = APIRouter(prefix="/fires", tags=["fires"])
service = FireService()


@router.get("")
async def get_fires(
    request: Request,
    response: Response,
    country: str | None = Query(default=None),
    west: float | None = Query(default=None),
    south: float | None = Query(default=None),
    east: float | None = Query(default=None),
    north: float | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    source_priority: str | None = Query(default=None, alias="sourcePriority"),
    format: str = Query(default="geojson", pattern=r"^(json|geojson)$"),
    max_concurrency: int = Query(default=None, alias="maxConcurrency", ge=1, le=20),
):
    ctx = await service.prepare_query(
        response=response,
        country=country,
        west=west,
        south=south,
        east=east,
        north=north,
        start_date=start_date,
        end_date=end_date,
        source_priority=source_priority,
    )

    if ctx is None:
        return service.empty_response(format)

    if "application/x-ndjson" in request.headers.get("accept", ""):
        async def stream():
            async for chunk in service.stream_ndjson(ctx):
                yield chunk

        return StreamingResponse(stream(), media_type="application/x-ndjson")

    data = await service.fetch(ctx, max_concurrency=max_concurrency)
    if format == "geojson":
        return service.to_geojson(data)
    return data


@router.get("/stats")
async def get_fires_stats(
    response: Response,
    country: str | None = Query(default=None),
    west: float | None = Query(default=None),
    south: float | None = Query(default=None),
    east: float | None = Query(default=None),
    north: float | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    source_priority: str | None = Query(default=None, alias="sourcePriority"),
    frp_high: float = Query(default=20, alias="frpHigh"),
    frp_mid: float = Query(default=5, alias="frpMid"),
    max_concurrency: int = Query(default=None, alias="maxConcurrency", ge=1, le=20),
):
    ctx = await service.prepare_query(
        response=response,
        country=country,
        west=west,
        south=south,
        east=east,
        north=north,
        start_date=start_date,
        end_date=end_date,
        source_priority=source_priority,
    )

    data = []
    if ctx is not None:
        data = await service.fetch(ctx, max_concurrency=max_concurrency)
    return service.compute_stats(data, frp_mid=frp_mid, frp_high=frp_high)


@router.get("/debug/compose", tags=["debug"])
async def debug_compose(
    response: Response,
    country: str | None = Query(default=None),
    west: float | None = Query(default=None),
    south: float | None = Query(default=None),
    east: float | None = Query(default=None),
    north: float | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    source_priority: str | None = Query(default=None, alias="sourcePriority"),
):
    ctx = await service.prepare_query(
        response=response,
        country=country,
        west=west,
        south=south,
        east=east,
        north=north,
        start_date=start_date,
        end_date=end_date,
        source_priority=source_priority,
    )
    if ctx is None:
        return {"selected_source": None, "urls": [], "note": "No data for requested date range"}
    key = settings.map_key
    masked = [u.replace(key, "<MAP_KEY>") for u in ctx.urls]
    return {"selected_source": ctx.selected_source, "urls": masked}
