import React, { useState, useEffect } from 'react';
import './App.css';

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

    // Validate inputs
    if (!ticker) {
      setError('Please enter a ticker symbol');
      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze stock data');
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectStock = stock => {
    setTicker(stock.symbol);
    setShowSuggestions(false);
  };

  return (
    <div className='App'>
      <header className='App-header'>
        <h1>Stock Data Analysis and Signal Generator</h1>
      </header>

      <main className='container'>
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
                      <li key={stock.symbol} onClick={() => selectStock(stock)}>
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

          <button type='submit' className='submit-button' disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Stock'}
          </button>
        </form>

        {loading && (
          <div className='loading-container'>
            <div className='spinner'></div>
            <p>Analyzing stock data... This may take a moment.</p>
          </div>
        )}

        {error && (
          <div className='error-message'>
            <p>Error: {error}</p>
          </div>
        )}

        {results && (
          <div className='results-container'>
            <h2>Analysis Results for {ticker}</h2>

            <div className='summary-card'>
              <h3>Performance Summary</h3>
              <div className='summary-grid'>
                <div className='summary-item'>
                  <span className='label'>Period:</span>
                  <span className='value'>
                    {results.summary.period_start} to{' '}
                    {results.summary.period_end}
                  </span>
                </div>
                <div className='summary-item'>
                  <span className='label'>Total Trades:</span>
                  <span className='value'>{results.summary.total_trades}</span>
                </div>
                <div className='summary-item'>
                  <span className='label'>Buy Signals:</span>
                  <span className='value'>{results.summary.buy_signals}</span>
                </div>
                <div className='summary-item'>
                  <span className='label'>Sell Signals:</span>
                  <span className='value'>{results.summary.sell_signals}</span>
                </div>
                <div className='summary-item'>
                  <span className='label'>Market Return:</span>
                  <span className='value'>
                    {results.summary.market_return}%
                  </span>
                </div>
                <div className='summary-item'>
                  <span className='label'>Strategy Return:</span>
                  <span className='value'>
                    {results.summary.strategy_return}%
                  </span>
                </div>
                <div className='summary-item'>
                  <span className='label'>Annual Market Return:</span>
                  <span className='value'>
                    {results.summary.market_annual_return}%
                  </span>
                </div>
                <div className='summary-item'>
                  <span className='label'>Annual Strategy Return:</span>
                  <span className='value'>
                    {results.summary.strategy_annual_return}%
                  </span>
                </div>
                <div className='summary-item'>
                  <span className='label'>Sharpe Ratio:</span>
                  <span className='value'>{results.summary.sharpe_ratio}</span>
                </div>
              </div>
            </div>

            <div className='charts-container'>
              <div className='chart-card'>
                <h3>Price and Signals</h3>
                <img
                  src={`data:image/png;base64,${results.signals_plot}`}
                  alt='Stock Price and Signals'
                  className='chart-image'
                />
              </div>

              <div className='chart-card'>
                <h3>Cumulative Returns</h3>
                <img
                  src={`data:image/png;base64,${results.returns_plot}`}
                  alt='Cumulative Returns'
                  className='chart-image'
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>Stock Data Analysis Tool - &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;
