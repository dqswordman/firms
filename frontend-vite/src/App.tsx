import React from 'react';
import { MapView } from './features/map/MapView';

const App: React.FC = () => {
  return (
    <div className="app-root">
      <aside className="app-sidebar">
        <h1>FIRMS Wildfire Explorer vNext</h1>
        <p>
          Stage 3 rebuild正在进行：地图容器、状态管理、量测工具等将按模块迁移。当前示例使
          用默认的 USA 查询并展示基础地图。
        </p>
        <p>
          后续将接入实时数据、图层切换、过滤与分析面板；此侧边栏将承载查询表单与控制组。
        </p>
      </aside>
      <main className="app-map-shell">
        <MapView />
      </main>
    </div>
  );
};

export default App;
