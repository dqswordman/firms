# 性能与规模

- 聚合：前端使用 supercluster 进行客户端点聚合，支持万级点位下的流畅交互。
- 压缩：后端启用 GZip 压缩；大结果集可使用 NDJSON 流式模式边下边解析。
- 并发：后端抓取上游 FIRMS 时按 `MAX_CONCURRENT_REQUESTS` 控制并发（默认 5）。
- 缓存：国家边界列表缓存 24 小时，以降低对上游的依赖。

建议：
- 趋势与统计尽量使用 JSON（更轻量），地图展示使用 GeoJSON。
- 日期范围不建议超过 10 天；NRT 与 SP 的可用范围差异较大，必要时指定 `sourcePriority`。

