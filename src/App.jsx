import React, { useState, useEffect } from 'react';
import './App.css';
import { Dialog, IconButton, Zoom } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CloseIcon from '@mui/icons-material/Close';
import Chart from './components/Chart';
import Plot from 'react-plotly.js';

function App() {
  // State variables
  const [ticker, setTicker] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shortWindow, setShortWindow] = useState(50);
  const [longWindow, setLongWindow] = useState(200);
  const [popularStocks, setPopularStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Set default dates when component mounts
  useEffect(() => {
    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    setEndDate(formatDate(today));
    setStartDate(formatDate(twoYearsAgo));

    // Fetch popular stocks for autocomplete
    fetchPopularStocks();
  }, []);

  // Helper function to format date as YYYY-MM-DD
  const formatDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch popular stocks for autocomplete
  const fetchPopularStocks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stocks');
      if (response.ok) {
        const data = await response.json();
        setPopularStocks(data);
      }
    } catch (err) {
      console.error('Error fetching popular stocks:', err);
    }
  };

  // Filter stocks based on user input for autocomplete
  const filteredStocks = popularStocks.filter(
    stock =>
      stock.symbol.toLowerCase().includes(ticker.toLowerCase()) ||
      stock.name.toLowerCase().includes(ticker.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          startDate,
          endDate,
          shortWindow,
          longWindow,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze stock data');
      }

      // Get the response as text first
      const responseText = await response.text();

      // Try to parse the JSON, replacing NaN with null
      const sanitizedText = responseText.replace(/NaN/g, 'null');
      const data = JSON.parse(sanitizedText);

      setResults(data);
    } catch (err) {
      console.error('Error:', err);
      setError(
        err.message || 'An error occurred while analyzing the stock data'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectStock = stock => {
    setTicker(stock.symbol);
    setShowSuggestions(false);
  };

  // Function to open chart in fullscreen
  const openFullscreen = chartData => {
    setFullscreenChart(chartData);
    setZoomLevel(1);
  };

  // Function to close fullscreen
  const closeFullscreen = () => {
    setFullscreenChart(null);
  };

  // Function to handle zoom
  const handleZoom = direction => {
    if (direction === 'in') {
      setZoomLevel(prev => Math.min(prev + 0.2, 3));
    } else {
      setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
    }
  };

  // Function to convert API response to chart data
  const getChartDataFromResults = () => {
    if (!results) return [];

    // Safely access arrays and handle missing data
    const dates = results.dates || [];
    const prices = results.prices || [];
    const shortMa = results.short_ma || [];
    const longMa = results.long_ma || [];
    const marketReturns = results.market_returns || [];
    const strategyReturns = results.strategy_returns || [];

    // Buy and sell signals
    const buySignalDates = results.buy_signals?.dates || [];
    const buySignalPrices = results.buy_signals?.prices || [];
    const sellSignalDates = results.sell_signals?.dates || [];
    const sellSignalPrices = results.sell_signals?.prices || [];

    return [
      {
        title: 'Price and Moving Averages',
        data: [
          {
            x: dates,
            y: prices,
            type: 'scatter',
            mode: 'lines',
            name: 'Price',
            line: { color: '#2196f3', width: 2 },
          },
          {
            x: dates,
            y: shortMa,
            type: 'scatter',
            mode: 'lines',
            name: 'Short-term MA',
            line: { color: '#4caf50', width: 1.5, dash: 'dot' },
          },
          {
            x: dates,
            y: longMa,
            type: 'scatter',
            mode: 'lines',
            name: 'Long-term MA',
            line: { color: '#ff9800', width: 1.5, dash: 'dot' },
          },
          {
            x: buySignalDates,
            y: buySignalPrices,
            type: 'scatter',
            mode: 'markers',
            name: 'Buy Signal',
            marker: { color: '#4caf50', size: 10, symbol: 'triangle-up' },
          },
          {
            x: sellSignalDates,
            y: sellSignalPrices,
            type: 'scatter',
            mode: 'markers',
            name: 'Sell Signal',
            marker: { color: '#f44336', size: 10, symbol: 'triangle-down' },
          },
        ],
        layout: {
          title: 'Price and Moving Averages',
          xaxis: { title: 'Date' },
          yaxis: { title: 'Price ($)' },
          legend: { orientation: 'h', y: -0.2 },
          hovermode: 'closest',
        },
      },
      {
        title: 'Cumulative Returns',
        data: [
          {
            x: dates,
            y: marketReturns.map(val => (isNaN(val) ? null : val * 100)),
            type: 'scatter',
            mode: 'lines',
            name: 'Market Return',
            line: { color: '#2196f3', width: 2 },
          },
          {
            x: dates,
            y: strategyReturns.map(val => (isNaN(val) ? null : val * 100)),
            type: 'scatter',
            mode: 'lines',
            name: 'Strategy Return',
            line: { color: '#f44336', width: 2 },
          },
        ],
        layout: {
          title: 'Cumulative Returns (%)',
          xaxis: { title: 'Date' },
          yaxis: { title: 'Return (%)' },
          legend: { orientation: 'h', y: -0.2 },
          hovermode: 'closest',
        },
      },
    ];
  };

  return (
    <div className='app-container'>
      {/* Main Content */}
      <div className='main-content full-width'>
        <header className='main-header'>
          <h1>Stock Data Analysis</h1>
        </header>

        <div className='dashboard'>
          {/* Analysis Form Card */}
          <div className='card analysis-form-card'>
            <h2 className='card-title'>Stock Analysis</h2>
            <form onSubmit={handleSubmit} className='analysis-form'>
              <div className='form-group'>
                <label htmlFor='ticker'>Stock Ticker Symbol:</label>
                <div className='autocomplete-container'>
                  <input
                    type='text'
                    id='ticker'
                    value={ticker}
                    onChange={e => {
                      setTicker(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder='Enter ticker symbol (e.g., AAPL, MSFT)'
                  />
                  {showSuggestions && ticker.length > 0 && (
                    <ul className='suggestions-list'>
                      {filteredStocks.length > 0 ? (
                        filteredStocks.map(stock => (
                          <li
                            key={stock.symbol}
                            onClick={() => selectStock(stock)}
                          >
                            <strong>{stock.symbol}</strong> - {stock.name}
                          </li>
                        ))
                      ) : (
                        <li>No matching stocks found</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor='startDate'>Start Date:</label>
                  <input
                    type='date'
                    id='startDate'
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor='endDate'>End Date:</label>
                  <input
                    type='date'
                    id='endDate'
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor='shortWindow'>Short-term MA Window:</label>
                  <input
                    type='number'
                    id='shortWindow'
                    value={shortWindow}
                    onChange={e => setShortWindow(parseInt(e.target.value, 10))}
                    min='5'
                    max='100'
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor='longWindow'>Long-term MA Window:</label>
                  <input
                    type='number'
                    id='longWindow'
                    value={longWindow}
                    onChange={e => setLongWindow(parseInt(e.target.value, 10))}
                    min='20'
                    max='500'
                  />
                </div>
              </div>

              <button
                type='submit'
                className='submit-button'
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze Stock'}
              </button>
            </form>
          </div>

          {loading && (
            <div className='card loading-card'>
              <div className='spinner'></div>
              <p>Analyzing stock data... This may take a moment.</p>
            </div>
          )}

          {error && (
            <div className='card error-card'>
              <p>Error: {error}</p>
            </div>
          )}

          {results && (
            <>
              {/* Stats Cards */}
              <div className='stats-cards'>
                <div className='card stat-card'>
                  <div className='stat-icon'>📈</div>
                  <div className='stat-content'>
                    <h3>Market Return</h3>
                    <p className='stat-value'>
                      {results.summary.market_return.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className='card stat-card'>
                  <div className='stat-icon'>💹</div>
                  <div className='stat-content'>
                    <h3>Strategy Return</h3>
                    <p className='stat-value'>
                      {results.summary.strategy_return.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className='card stat-card'>
                  <div className='stat-icon'>🔄</div>
                  <div className='stat-content'>
                    <h3>Total Trades</h3>
                    <p className='stat-value'>{results.summary.total_trades}</p>
                  </div>
                </div>

                <div className='card stat-card'>
                  <div className='stat-icon'>⚖️</div>
                  <div className='stat-content'>
                    <h3>Sharpe Ratio</h3>
                    <p className='stat-value'>
                      {results.summary.sharpe_ratio.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className='card summary-card'>
                <h2 className='card-title'>Performance Summary for {ticker}</h2>
                <div className='summary-grid'>
                  <div className='summary-item'>
                    <span className='summary-label'>Period:</span>
                    <span className='summary-value'>
                      {results.summary.period_start} to{' '}
                      {results.summary.period_end}
                    </span>
                  </div>
                  <div className='summary-item'>
                    <span className='summary-label'>Annual Market Return:</span>
                    <span className='summary-value'>
                      {results.summary.market_annual_return.toFixed(2)}%
                    </span>
                  </div>
                  <div className='summary-item'>
                    <span className='summary-label'>
                      Annual Strategy Return:
                    </span>
                    <span className='summary-value'>
                      {results.summary.strategy_annual_return.toFixed(2)}%
                    </span>
                  </div>
                  <div className='summary-item'>
                    <span className='summary-label'>Buy Signals:</span>
                    <span className='summary-value'>
                      {results.summary.buy_signals}
                    </span>
                  </div>
                  <div className='summary-item'>
                    <span className='summary-label'>Sell Signals:</span>
                    <span className='summary-value'>
                      {results.summary.sell_signals}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts Gallery */}
              <div className='charts-gallery'>
                {getChartDataFromResults().map((chart, index) => (
                  <div className='card chart-card' key={index}>
                    <div className='chart-header'>
                      <h3>{chart.title}</h3>
                      <IconButton
                        className='chart-fullscreen-button'
                        onClick={() => openFullscreen(chart)}
                      >
                        <FullscreenIcon />
                      </IconButton>
                    </div>
                    <div className='chart-wrapper'>
                      <Chart
                        data={chart.data}
                        layout={chart.layout}
                        config={{ responsive: true, displayModeBar: true }}
                        onFullscreen={() => openFullscreen(chart)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog
        fullScreen
        open={fullscreenChart !== null}
        onClose={closeFullscreen}
        TransitionComponent={Zoom}
      >
        <div className='fullscreen-chart-container'>
          <div className='fullscreen-controls'>
            <IconButton onClick={() => handleZoom('in')}>
              <ZoomInIcon />
            </IconButton>
            <IconButton onClick={() => handleZoom('out')}>
              <ZoomOutIcon />
            </IconButton>
            <IconButton onClick={closeFullscreen}>
              <CloseIcon />
            </IconButton>
          </div>
          <div
            className='fullscreen-chart'
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {fullscreenChart && (
              <Chart
                data={fullscreenChart.data}
                layout={fullscreenChart.layout}
                config={{ responsive: true, displayModeBar: true }}
              />
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default App;
