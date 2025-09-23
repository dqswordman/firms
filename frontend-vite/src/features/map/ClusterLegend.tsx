import React from 'react';

export const ClusterLegend: React.FC = () => {
  return (
    <div className="cluster-legend">
      <span className="cluster-legend__title">Cluster size (fires)</span>
      <div className="cluster-legend__items">
        <span className="cluster-legend__chip cluster-legend__chip--small">&lt; 100</span>
        <span className="cluster-legend__chip cluster-legend__chip--medium">100 - 499</span>
        <span className="cluster-legend__chip cluster-legend__chip--large">500+</span>
      </div>
    </div>
  );
};
