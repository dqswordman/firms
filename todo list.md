# FIRMS UI Parity TODO (English)

This list tracks UI work toward parity with NASA FIRMS (MoSCoW priority).

## Must
- Layer panel groups and toggles (Fires / Overlays / Backgrounds / Analytics)
  - AC: Collapsible groups; instant effect. [Updated: persistence disabled per request]
- Time slider (bottom)
  - AC: Quick ranges Today/24H/48H/7D/WEEK; month ticks; current-day highlight; range selection (dual handles); adaptive tick density
- Mouse coordinates and scale bar
  - AC: Coordinates centered at top; scale at bottom-left; consistent with projection
- One-shot range loading + client-side filtering
  - AC: Fetch once per selected range; filter per-day by `acq_date`

- Disable session restore [Done]
  - AC: On fresh load, do not restore previous query, layers, or viewport; do not read/write URL hash or localStorage.

## Should
- Bottom toolbar buttons
  - AC: Measure, Layers, Timeline, Share, Help (Location removed)
  - Status:
    - [x] Timeline opens Trend
    - [x] Share copies URL (hash)
    - [x] LAYERS focuses and highlights the right panel
    - [ ] Improve Help copy (EN)
- Basemap options
  - AC: OpenTopoMap, Blue Marble (GIBS)
- Popup style
  - AC: Card-like; emphasize FRP/Confidence/Satellite/Time
- Cluster hover details
  - AC: Show Count and Avg FRP

## Could
- 3D view (Cesium / Mapbox GL)
  - AC: 2D/3D toggle, persisted state
- Advanced measure tools
  - AC: Save as GeoJSON; manage multiple records; Undo (step back)
- Screenshot (Capture)
  - AC: Export current view to PNG

## Measure
- [x] Distance / Area modes
- [x] Units: km / mi / m; km² / mi² / ha
- [x] Segment labels + Total; Area label at center
- [x] ESC cancel; Clear removes all; Pan pauses drawing
- [ ] Undo last point
- [ ] Multi-record save and export GeoJSON

## Legend overlap handling
- [x] Temporarily remove right-side Legend to avoid Select popper overlap under Analytics
- [x] Portal all Select menus to body (zIndex 20000)
- [ ] Theme global zIndex to avoid per-component overrides

## Demo acceptance
- Dark theme; grouped right panel; bottom time slider (quick ranges / month ticks / range); top coordinates; bottom-left scale
- THA + valid range: one-shot fetch; client-side filtering; overlays toggles work; switch basemap; Trend renders stably

## Progress Updates
- 2025-09-02
  - Done: Measure Pro (Distance/Area/Units/ESC/Clear/Pan/segment labels); removed Legend; Select menus portal to body; LAYERS focus+highlight
  - TODO: Measure undo + multi-record save; Help copy; theme zIndex
- 2025-09-05
  - Done: Fixed settings-propagation render loop; dedicated measure-pane + SVG renderer for stable z-order; preview shows full-path running total; double-click persists result and clears live; CLEAR reliably removes all.
