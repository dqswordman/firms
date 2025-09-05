# FIRMS UI Parity TODO

本清单用于跟踪与 NASA FIRMS Web Map 体验对齐的前端任务（MoSCoW 优先级）。

## Must
- 图层面板分组与开关（Fires / Overlays / Backgrounds / Analytics）
  - AC：分组折叠；即时生效；URL hash 持久化；无 hash 用 localStorage 恢复
- 时间控制条（底部）
  - AC：Today/24H/48H/7D/WEEK 快捷；月份刻度；当前日期高亮；区间选择（双滑块）；刻度密度自适应
- 鼠标坐标与比例尺
  - AC：顶部居中显示 Lat/Lon；左下比例尺；与当前投影一致
- Overlay 图层
  - AC：Country Outline、Graticule、Street Ref 可独立开关
- 一次性加载 + 客户端过滤
  - AC：区间内只请求一次；按 acq_date 本地过滤每日数据

## Should
- 底部工具栏按钮组
  - AC：Measure、Layers、Timeline、Share、Help（Location 已移除）
  - 状态：
    - [x] Timeline 打开 Trend
    - [x] Share 复制 URL（hash）
    - [x] LAYERS 聚焦右侧面板并高亮
    - [ ] Help 文案完善（英文/中文）
- Basemap 集
  - AC：OpenTopoMap、Blue Marble（GIBS）
- Popup 风格
  - AC：卡片式、突出 FRP/置信度/卫星/时间
- Cluster 悬停聚合信息
  - AC：显示 Count 与 Avg FRP

## Could
- 3D 视图（Cesium / Mapbox GL）
  - AC：2D/3D 可切换，状态保持
- 高级测量工具
  - AC：保存为 GeoJSON；多记录管理；撤销（Undo）
- 截图（Capture）
  - AC：导出当前视图为 PNG

## Measure（对齐 NASA）
- [x] Distance / Area 模式
- [x] 单位切换：km / mi / m；km² / mi² / ha
- [x] 分段里程标注与总里程显示；面积中心显示 Area
- [x] ESC 取消；Clear 清空；Pan 暂停绘制
- [ ] 撤销（Undo 上一个点）
- [ ] 多记录保存与导出 GeoJSON

## Legend 遮挡处理
- [x] 临时移除右侧 Legend 面板，避免遮挡 Analytics 下拉与 Select Popper
- [x] 统一 Select Portal 到 body（zIndex 20000）
- [ ] 后续用 Theme 全局化 zIndex，避免逐处设置

## 验收演示
- 默认深色主题；右侧分组面板可折叠；底部时间条（快捷/月份刻度/区间选择）；顶部显示坐标；左下比例尺
- 选择 THA + 合规日期范围：一次性加载；滑块本地过滤；Overlay 开关有效；切换底图；Trend 稳定显示

## 进度更新
- 2025-09-02
  - 完成：Measure 专业版（Distance/Area/Units/ESC/Clear/Pan/分段标注）；移除 Legend 面板；Select 统一 Portal + zIndex；LAYERS 聚焦高亮
  - 待办：Measure 撤销与多记录保存；Help 文案；zIndex 主题化
