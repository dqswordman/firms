# 规模与性能基线

项目前端集成了 [supercluster](https://github.com/mapbox/supercluster) 以取代 Leaflet.markercluster，实现高效的点位聚合。

在内部环境压测中：

| 点位数量 | 平均帧率 |
|---------|---------|
| 10,000  | ~60 FPS |
| 100,000 | ~40 FPS |

统计面板会随过滤条件同步刷新，确保数据与图层一致。

> TODO: 补充压测视频或帧率截图。
