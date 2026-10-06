import React, { useState, useEffect } from 'react';
import { INITIAL_STOCKOUTS } from '../data/mockData';

export default function StockoutPredictor({ stockouts: propStockouts, onNavigate }) {
  const [stockouts, setStockouts] = useState(propStockouts || INITIAL_STOCKOUTS);
  const [loading, setLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState('ALL');

  useEffect(() => {
    if (propStockouts && propStockouts.length > 0) {
      setStockouts(propStockouts);
    } else {
      fetch('/api/stockout-predictions')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setStockouts(data);
          }
        })
        .catch((err) => {
          console.warn("Using built-in canonical stockout dataset", err);
        });
    }
  }, [propStockouts]);

  // Issue 1 & Issue 5: Dynamic filtering and post name display
  const filtered = stockouts.filter((s) => {
    if (filterLevel === 'IMMINENT') return Number(s.days_remaining) <= 5.0;
    if (filterLevel === 'WATCHLIST') return Number(s.days_remaining) > 5.0;
    if (filterLevel === 'ALL') return true;
    return s.risk_level === filterLevel;
  });

  return (
    <div className="container">
      <div className="section-title">
        <span>AI Stockout Prediction & Lead-Time Vulnerability Engine</span>
        <button className="btn-primary btn-sm" onClick={() => onNavigate('SHIPMENTS')}>
          + Plan Urgent Resupply Convoy
        </button>
      </div>

      {/* STRATEGIC RATIONALE BANNER */}
      <div className="service-card" style={{ marginBottom: '20px', borderTopColor: '#d9381e' }}>
        <h4 style={{ color: 'var(--primary-navy)', marginBottom: '4px', fontWeight: '700' }}>
          "PREDICT BEFORE YOU TRANSPORT" — Forward Supply Line Protection
        </h4>
        <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: '1.5' }}>
          Traditional supply chains respond only after inventory reaches zero. FORGE applies predictive consumption physics,
          compensating for mountain road degradation, snowstorm closures, and convoy transit hours to calculate the exact
          depletion window before the shortage materializes.
        </p>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontWeight: '700', color: 'var(--primary-navy)' }}>
            Predicted Stockout Registry ({filtered.length} Monitored Stores)
          </div>

          <div className="filter-group">
            <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Filter View:</label>
            <select
              className="filter-select"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="ALL">All Stores</option>
              <option value="IMMINENT">Imminent Warnings (&le; 5 Days)</option>
              <option value="WATCHLIST">Watchlist Horizon (&gt; 5 Days)</option>
              <option value="CRITICAL">CRITICAL (&le; 3.5 Days)</option>
              <option value="HIGH">HIGH (&le; 5.0 Days)</option>
              <option value="MEDIUM">MEDIUM (&le; 8.0 Days)</option>
            </select>
          </div>
        </div>

        <div className="responsive-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Location / Post</th>
                <th>Store Item</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Daily Burn Rate</th>
                <th>Days Remaining</th>
                <th>Stockout Date</th>
                <th>Weather Risk</th>
                <th>Severity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isCrit = item.days_remaining <= 3.5 || item.risk_level === 'CRITICAL';
                const isHigh = item.days_remaining <= 5.0 || item.risk_level === 'HIGH';
                const key = item.record_id || `${item.location_id || item.location_code}_${item.item_id}`;

                return (
                  <tr key={key} style={{ backgroundColor: isCrit ? '#fff5f5' : 'transparent' }}>
                    <td>
                      <strong>{item.location_code || item.location_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.location_name}</div>
                    </td>
                    <td>
                      <strong>{item.item_name}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td><strong>{item.current_stock}</strong> {item.unit}</td>
                    <td>{item.effective_daily_demand} {item.unit}/day</td>
                    <td>
                      <span style={{
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        color: isCrit ? '#d9381e' : (isHigh ? '#e65100' : '#16a34a')
                      }}>
                        {item.days_remaining} Days
                      </span>
                    </td>
                    <td>
                      <strong>{item.stockout_date}</strong>
                    </td>
                    <td style={{ fontSize: '0.76rem', color: '#475569' }}>
                      {item.weather_adjustment_risk}
                    </td>
                    <td>
                      <span className={`badge ${
                        isCrit ? 'badge-critical' :
                        isHigh ? 'badge-medium' :
                        item.risk_level === 'MEDIUM' ? 'badge-low' : 'badge-healthy'
                      }`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => onNavigate('SHIPMENTS')}
                      >
                        Resupply 🚚
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
