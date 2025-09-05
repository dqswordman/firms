# API 使用说明

## 环境变量
- `FIRMS_MAP_KEY`：NASA FIRMS MAP_KEY。若设置了过时的 `FIRMS_API_KEY` 将兼容使用并记录告警。

## GET /fires
按国家或区域查询火点数据。

### 查询参数
- `country`：国家 ISO3 代码；或使用 `west` `south` `east` `north` 指定区域（两者二选一）
- `start_date`、`end_date`：日期范围（最多 10 天），结束日期不能晚于今天
- `sourcePriority`：逗号分隔的数据源优先级（可选）。默认按后端内置顺序择优：
  `VIIRS_SNPP_NRT,VIIRS_NOAA21_NRT,VIIRS_NOAA20_NRT,MODIS_NRT,VIIRS_NOAA20_SP,VIIRS_SNPP_SP,MODIS_SP`
- `format`：返回格式，`json` 或 `geojson`，默认为 `geojson`

### NDJSON 流式模式
当请求头包含 `Accept: application/x-ndjson` 时，接口逐条以 NDJSON 格式返回每个 GeoJSON `Feature`，并开启 gzip 压缩，适合大结果集场景。

国家代码仅做 ISO3 形式校验（3 位大写字母），不再依赖远端国家列表；`country` 查询将映射为对应国家的外接矩形并调用 `area` 端点（内置常见国家的外接矩形，如 USA/CHN/IND 等）。若未覆盖到的国家会返回 400，建议改用 bbox 方式。

后端使用 NASA FIRMS v4 CSV 端点：
- Country：`/api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAY_RANGE}[/{START_DATE}]`
- Area：`/api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{DAY_RANGE}[/{START_DATE}]`

### 返回示例（GeoJSON）
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-120.45, 34.56]},
      "properties": {
        "brightness": 310.5,
        "bright_ti4": "310.5",
        "frp": 12.3,
        "satellite": "N",
        "instrument": "VIIRS",
        "daynight": "D",
        "source": "VIIRS_SNPP_NRT",
        "country_id": "USA",
        "confidence": 85,
        "confidence_text": "85",
        "acq_date": "2024-03-01",
        "acq_time": "1300",
        "acq_datetime": "2024-03-01T13:00:00Z"
      }
    }
  ]
}
```

## GET /fires/stats
统计火点聚合数据，入参与 `/fires` 相同，新增 FRP 档位阈值可配置。

### 查询参数
- 与 `/fires` 相同：`country` 或 `west/south/east/north`、`start_date`、`end_date`、`sourcePriority`
- `frpHigh`：FRP 高档位阈值，默认 20
- `frpMid`：FRP 中档位阈值，默认 5

### 返回字段
`totalPoints`、`avgFrp`、`maxFrp`、`sumFrp`、`dayCount`、`nightCount`、`highConfidence`、`mediumConfidence`、`lowConfidence`、`viirsCount`、`terraCount`、`aquaCount`、`frpHighCount`、`frpMidCount`、`frpLowCount`

### 示例
```json
{
  "totalPoints": 3,
  "avgFrp": 12.67,
  "maxFrp": 25.0,
  "sumFrp": 38.0,
  "dayCount": 2,
  "nightCount": 1,
  "highConfidence": 1,
  "mediumConfidence": 1,
  "lowConfidence": 1,
  "viirsCount": 1,
  "terraCount": 1,
  "aquaCount": 1,
  "frpHighCount": 1,
  "frpMidCount": 1,
  "frpLowCount": 1
}
```

## URL 拼接规范
### Country
`https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAY_RANGE}[/{START_DATE}]`

### Area
`https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north|world}/{DAY_RANGE}[/{START_DATE}]`

`{START_DATE}` 可选，未提供时默认为当前日期向前追溯 `{DAY_RANGE}` 天。

## 选源逻辑与优先级
调用 `/fires` 前会通过 `/api/data_availability` 检查各数据集的可用日期范围。按 `sourcePriority` 列表依次匹配请求的 `[start_date, end_date]`，优先选择 NRT 数据，当日期不在 NRT 范围内时自动回退至对应 SP 数据。若所有数据源均不覆盖请求区间，将返回空数组，并在响应头 `X-Data-Availability` 中标明原因。

## 错误
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
