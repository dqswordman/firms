# 数据流架构变更

前端地图现在直接消费 GeoJSON `FeatureCollection` 作为火点数据源。`useFiresQuery` 钩子在请求后端时通过 `format` 参数选择数据格式，默认返回 GeoJSON；当选择旧版 `json` 格式时会在前端转换为 `FeatureCollection` 以保持统一的数据面向。

`FireMap` 统一传递 `FeatureCollection` 给 `FireHeatmap` 与 `FireCluster` 图层。图层可以在控制面板中独立开关，热力图支持通过 `weightBy` 选项在 `frp` 与 `brightness` 间切换，并提供阈值滑杆过滤低权重火点。

统计、趋势及雷达图等组件仍基于属性数组 (`FirePoint[]`) 工作，`FireMap` 从 `FeatureCollection` 中提取属性后传递给这些组件，确保交互流程与旧版保持一致。

整体数据流如下：

```
SearchForm -> useFiresQuery (format=geojson|json) -> FireMap
  ├─ FireHeatmap (FeatureCollection, weightBy, threshold)
  ├─ FireCluster (FeatureCollection)
  └─ Charts (FirePoint[])
```

通过上述调整，前端在保持旧数据格式兼容的同时，完成了对 GeoJSON 数据结构与可配置图层的适配。

