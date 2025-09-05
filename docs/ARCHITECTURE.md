# 架构说明

前端使用 React + TypeScript 构建，地图采用 Leaflet（react-leaflet），点聚合使用 supercluster，图表使用 Chart.js。样式使用 Tailwind CSS。数据请求使用 TanStack Query 统一管理，并支持预取相邻日期以优化时间滑块体验。

后端使用 FastAPI，对接 NASA FIRMS v4 CSV 接口，负责：
- 参数校验（ISO3 国家与 BBOX 坐标、日期范围 ≤ 10 天、结束日期不超过今天）
- 数据源可用性检查（`/api/data_availability`）并按优先级选择合适的数据集
- 跨日期段（最多 10 天一段）拆分请求，异步并发抓取与去重
- 输出 JSON 或 GeoJSON，支持 NDJSON 流式输出

数据流：

SearchForm（查询条件） → useFiresQuery（按天请求） → FireMap（FeatureCollection）
  ├─ FireHeatmap（热力图，支持 FRP/亮度，阈值过滤）
  ├─ FireCluster（聚合点）
  ├─ TimeSlider（按天切换，预取前后一天）
  └─ Charts（统计与趋势）

其中趋势组件在展示时，会按整个日期范围额外请求一次 JSON 数据用于绘制日级趋势。

