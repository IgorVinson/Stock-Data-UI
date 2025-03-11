import React from 'react';
import Plot from 'react-plotly.js';

const Chart = ({ data, layout, config, onFullscreen }) => {
  const defaultLayout = {
    autosize: true,
    margin: { l: 50, r: 20, t: 30, b: 50 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Segoe UI, Roboto, Arial, sans-serif' },
    modebar: { bgcolor: 'transparent' },
    ...layout,
  };

  const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToRemove: [],
    ...config,
  };

  return (
    <div className='chart-component'>
      <Plot
        data={data}
        layout={defaultLayout}
        config={defaultConfig}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
};

export default Chart;
