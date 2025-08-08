# API 使用说明

## 环境变量
- `FIRMS_MAP_KEY`：NASA FIRMS MAP_KEY。
- 兼容读取旧的 `FIRMS_API_KEY`（将打印弃用警告）。

## /fires
查询火点数据。

### 查询参数
- `country`：国家 ISO3 代码，或使用 `west` `south` `east` `north` 指定区域。
- `start_date`、`end_date`：日期范围，最大 10 天。
- `source`：数据源，默认 `VIIRS_SNPP_NRT`。
  可选：`VIIRS_NOAA21_NRT`、`VIIRS_NOAA20_NRT`、`VIIRS_SNPP_NRT`、`VIIRS_NOAA20_SP`、`VIIRS_SNPP_SP`、`MODIS_NRT`、`MODIS_SP`、`LANDSAT_NRT`。

国家列表来源于 NASA FIRMS `/api/countries/`，后端会缓存 24 小时并用于校验 ISO‑3 代码。
当未提供 `west/south/east/north` 时，可根据合法的 `country` 自动派生外接盒作为兜底。

后端使用 NASA FIRMS v4 CSV 端点：
- Country：`/api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAY_RANGE}/{START_DATE}`
- Area：`/api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{DAY_RANGE}/{START_DATE}`

## URL 拼接规范与样例

### Country
`https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAY_RANGE}[/{START_DATE}]`

示例：
`https://firms.modaps.eosdis.nasa.gov/api/country/csv/KEY/MODIS_NRT/USA/5/2024-01-01`

### Area
`https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north|world}/{DAY_RANGE}[/{START_DATE}]`

示例：
`https://firms.modaps.eosdis.nasa.gov/api/area/csv/KEY/MODIS_NRT/world/3`

上述 `{START_DATE}` 可选，未提供时默认为当前日期向前追溯 `{DAY_RANGE}` 天。
