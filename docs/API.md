# API 使用说明

## 环境变量
- `FIRMS_MAP_KEY`：NASA FIRMS MAP_KEY。
- 兼容读取旧的 `FIRMS_API_KEY`（将打印弃用警告）。

## /fires
查询火点数据。

### 查询参数
- `country`：国家 ISO3 代码，或使用 `west` `south` `east` `north` 指定区域。
- `start_date`、`end_date`：日期范围，最大 10 天。
- `sourcePriority`：逗号分隔的数据源优先级，按顺序选用可用数据集。
  默认顺序：`VIIRS_NOAA21_NRT,VIIRS_NOAA20_NRT,VIIRS_SNPP_NRT,MODIS_NRT,VIIRS_NOAA21_SP,VIIRS_NOAA20_SP,VIIRS_SNPP_SP,MODIS_SP`。
- `format`：返回格式，`json` 或 `geojson`，默认为 `json`。

### NDJSON 流式模式

当请求头包含 `Accept: application/x-ndjson` 时，接口会逐条以 NDJSON 格式返回每个 GeoJSON `Feature`，并开启 gzip 压缩。该模式可边解析边下载，适合全球或多天的大结果集场景。

国家列表来源于 NASA FIRMS `/api/countries/`，后端会缓存 24 小时并用于校验 ISO‑3 代码。
当未提供 `west/south/east/north` 时，可根据合法的 `country` 自动派生外接盒作为兜底。

后端使用 NASA FIRMS v4 CSV 端点：
- Country：`/api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAY_RANGE}/{START_DATE}`
- Area：`/api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{DAY_RANGE}/{START_DATE}`

### 返回示例

#### JSON

```json
[
  {
    "latitude": "34.56",
    "longitude": "-120.45",
    "bright_ti4": "310.5",
    "acq_date": "2024-03-01",
    "acq_time": "1300",
    "confidence": "85",
    "satellite": "N",
    "instrument": "VIIRS",
    "daynight": "D",
    "source": "VIIRS_SNPP_NRT",
    "frp": "12.3",
    "country_id": "USA"
  }
]
```

#### GeoJSON

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-120.45, 34.56]},
      "properties": {
        "brightness": 310.5,
        "frp": 12.3,
        "satellite": "N",
        "instrument": "VIIRS",
        "daynight": "D",
        "source": "VIIRS_SNPP_NRT",
        "country_id": "USA",
        "confidence": 85,
        "confidence_text": "85",
        "acq_datetime": "2024-03-01T13:00:00Z"
      }
    }
  ]
}
```

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

## 选源逻辑与优先级

调用 `/fires` 前会通过 `/api/data_availability` 检查各数据集的可用日期范围。
按 `sourcePriority` 列表依次匹配请求的 `[start_date, end_date]`，优先选择 NRT 数据，当所选日期不在 NRT 范围内时自动回退至对应 SP 数据。
若所有数据源均不覆盖请求区间，将返回空数组，并在响应头 `X-Data-Availability` 中标明原因。

## 错误码

接口统一返回 `{code, message, details}` 结构的错误信息。常见错误码如下：

| code | 含义 |
| --- | --- |
| 400 | 参数错误 |
| 502 | 下游服务错误 |
| 503 | 配额或限流 |
| 504 | 下游超时 |

### 错误示例

```json
{
  "code": 400,
  "message": "Invalid ISO-3 country code",
  "details": null
}
```
