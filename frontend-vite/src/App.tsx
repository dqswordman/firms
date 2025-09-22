import React from 'react';
import { MapView } from './features/map/MapView';

const App: React.FC = () => {
  return (
    <div className="app-root">
      <aside className="app-sidebar">
        <h1>FIRMS Wildfire Explorer vNext</h1>
        <p>
          Stage 3 rebuild���ڽ��У���ͼ������״̬�������⹤�ߵȽ���ģ��Ǩ�ơ���ǰʾ��ʹ
          ��Ĭ�ϵ� USA ��ѯ��չʾ������ͼ��
        </p>
        <p>
          ����������ʵʱ���ݡ�ͼ���л��������������壻�˲���������ز�ѯ��������顣
        </p>
      </aside>
      <main className="app-map-shell">
        <MapView />
      </main>
    </div>
  );
};

export default App;
