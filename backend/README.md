# Backend

- Uses NASA FIRMS v4 endpoints with `FIRMS_MAP_KEY`
- Country: `/api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAY_RANGE}[/{DATE}]`
- Area: `/api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{DAY_RANGE}[/{DATE}]`

Env:
- `FIRMS_MAP_KEY` required in production
- `ALLOWED_ORIGINS` for CORS
- `MAX_CONCURRENT_REQUESTS` concurrency for upstream 