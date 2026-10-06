import React, { useState } from 'react';
import LogisticsMap from './LogisticsMap';
import { formatDuration, formatISTTime, validateEventChronology } from '../utils/formatters';
import { INITIAL_ACTIVITY_FEED } from '../data/mockData';

/* ── Inline SVG Sparkline ── */
function Sparkline({ data, color = '#005a9c', height = 40, width = 120 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((data[data.length - 1] - min) / range) * (height - 8) - 4} r="3" fill={color} />
    </svg>
  );
}

/* ── Mini Bar Chart with Issue 15 (Every bar has visible label + value) ── */
function MiniBar({ values, labels, colors }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '70px', paddingTop: '10px' }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
          {/* Issue 15: Value always explicitly positioned and visible */}
          <div style={{ fontSize: '0.72rem', color: '#1e293b', fontWeight: '800', lineHeight: 1 }}>{v}</div>
          <div style={{
            width: '100%',
            height: `${Math.max(6, (v / max) * 44)}px`,
            background: colors[i] || '#005a9c',
            borderRadius: '3px 3px 0 0',
            minHeight: '6px'
          }} />
          <div style={{ fontSize: '0.62rem', color: '#64748b', whiteSpace: 'nowrap', textAlign: 'center', fontWeight: '600' }}>
            {labels[i]}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Forecast sparklines data ── */
const INVENTORY_TREND = [82, 79, 76, 74, 71, 68, 66, 64];
const SHORTAGE_TREND = [2, 2, 3, 3, 3, 4, 3, 3];
const CONVOY_TREND = [1, 2, 2, 3, 2, 2, 3, 3];
const DELIVERY_SUCCESS = [92, 94, 91, 95, 94, 93, 96, 94];

export default function CommandDashboard({
  kpis,
  locations = [],
  vehicles = [],
  routes = [],
  recommendations = [],
  shipments = [],
  stockouts = [],
  activityFeed = INITIAL_ACTIVITY_FEED,
  onNavigate,
  onSelectLocation,
  onApproveRecommendation,
  onRunDemo
}) {
  const [convoyTab, setConvoyTab] = useState('ACTIVE'); // 'ACTIVE' vs 'COMPLETED'
  const [stockoutTab, setStockoutTab] = useState('IMMINENT'); // 'IMMINENT' (<=5d) vs 'WATCHLIST' (>5d)

  // Issue 1: Dynamically filter Imminent Stockouts (days_remaining <= 5.0)
  // Boundary tests: 5.0 -> included, 5.1 -> excluded (in watchlist), 4.0 -> included, 6.0 -> excluded (in watchlist)
  const imminentStockouts = stockouts.filter(s => Number(s.days_remaining) <= 5.0);
  const watchlistStockouts = stockouts.filter(s => Number(s.days_remaining) > 5.0);

  // Issue 7: Active Convoys only includes non-delivered/non-cancelled
  const activeShipments = shipments.filter(s => ['PLANNED', 'LOADING', 'DISPATCHED', 'EN_ROUTE', 'DELAYED'].includes(s.status));
  const completedShipments = shipments.filter(s => ['DELIVERED', 'CANCELLED'].includes(s.status));

  // Issue 3: Validated chronological activity feed
  const validatedFeed = validateEventChronology(activityFeed);

  return (
    <div className="container dashboard-container">
      {/* AI LOGISTICS BRIEF BAR */}
      <div className="ai-brief-bar">
        <div className="ai-brief-icon">⚡</div>
        <div className="ai-brief-content" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <h4>STRATEGIC AI LOGISTICS BRIEF — NORTHERN SYNTHETIC SECTOR</h4>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#005a9c', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
              LIVE SATELLITE & TELEMETRY GRID
            </span>
          </div>
          <p>{kpis.ai_brief || "CRITICAL: Forward Post Kilo Arctic Diesel reserves at 3.4 days. CONVOY-NORTH-703 (ARMY-HT-017) en route via Route B (Southern Valley Axis) with ETA 4h 48m. CONVOY-NORTH-702 delayed +3.5h at Pass Echo. 42mm precipitation advisory active on Route A. Route B designated Primary Axis."}</p>
        </div>
      </div>

      {/* TOP KPI CARDS (Issue 13: Mobile Responsive Grid) */}
      <div className="kpi-grid">
        <div className="service-card" onClick={() => onNavigate('LOCATIONS')} style={{ cursor: 'pointer' }}>
          <div className="kpi-header">
            <span className="title">Forward Locations</span>
            <span className="kpi-icon">📍</span>
          </div>
          <div className="kpi-value">{kpis.total_locations || locations.length || 10}</div>
          <div className="kpi-sub">Northern Logistics Frontier</div>
          <Sparkline data={[8, 9, 9, 10, 10, 10, 10]} color="#005a9c" />
        </div>

        <div className="service-card" onClick={() => onNavigate('INVENTORY')} style={{ cursor: 'pointer' }}>
          <div className="kpi-header">
            <span className="title">Inventory Stores</span>
            <span className="kpi-icon">📦</span>
          </div>
          <div className="kpi-value">{kpis.total_inventory_items || 21}</div>
          <div className="kpi-sub">8 Standard Categories</div>
          <Sparkline data={[20, 21, 21, 21, 21, 21, 21]} color="#005a9c" />
        </div>

        <div className="service-card border-success" onClick={() => onNavigate('INVENTORY')} style={{ cursor: 'pointer' }}>
          <div className="kpi-header">
            <span className="title">Inventory Health</span>
            <span className="kpi-icon">🛡️</span>
          </div>
          <div className="kpi-value" style={{ color: '#2e7d32' }}>{kpis.inventory_health_pct || 76.2}%</div>
          <div className="kpi-sub">Stores with &ge; 5d reserve</div>
          <Sparkline data={INVENTORY_TREND} color="#16a34a" />
        </div>

        <div className="service-card border-critical" onClick={() => onNavigate('LOCATIONS')} style={{ cursor: 'pointer' }}>
          <div className="kpi-header">
            <span className="title">At-Risk Posts</span>
            <span className="kpi-icon">⚠️</span>
          </div>
          <div className="kpi-value" style={{ color: '#d9381e' }}>{kpis.at_risk_locations_count || 3}</div>
          <div className="kpi-sub">High-altitude & weather affected</div>
          <Sparkline data={[1, 1, 2, 2, 3, 3, 3]} color="#d9381e" />
        </div>

        <div className="service-card border-warning" onClick={() => onNavigate('STOCKOUT')} style={{ cursor: 'pointer' }}>
          <div className="kpi-header">
            <span className="title">Imminent Shortages</span>
            <span className="kpi-icon">📉</span>
          </div>
          <div className="kpi-value" style={{ color: '#e65100' }}>{imminentStockouts.length || 3}</div>
          <div className="kpi-sub">Within &le; 5-Day Horizon</div>
          <Sparkline data={SHORTAGE_TREND} color="#e65100" />
        </div>

        <div className="service-card" onClick={() => onNavigate('SHIPMENTS')} style={{ cursor: 'pointer' }}>
          <div className="kpi-header">
            <span className="title">Active Convoys</span>
            <span className="kpi-icon">🚚</span>
          </div>
          <div className="kpi-value">{activeShipments.length}</div>
          <div className="kpi-sub">2 En Route, 1 Delayed</div>
          <Sparkline data={CONVOY_TREND} color="#005a9c" />
        </div>

        <div className="service-card border-warning" onClick={() => onNavigate('WEATHER')} style={{ cursor: 'pointer' }}>
          <div className="kpi-header">
            <span className="title">Weather Alerts</span>
            <span className="kpi-icon">🌧️</span>
          </div>
          <div className="kpi-value" style={{ color: '#d97706' }}>{kpis.weather_alerts_count || 3}</div>
          <div className="kpi-sub">Pass Echo 42mm precipitation</div>
          <Sparkline data={[1, 1, 2, 3, 3, 3, 3]} color="#d97706" />
        </div>
      </div>

      {/* CHARTS ROW (Issue 15 & Issue 16: Visible bar values & Controlled Stores (CS) expansion) */}
      <div className="dashboard-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Issue 16: Supply Health by Category with full explanation */}
        <div className="service-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--primary-navy)', marginBottom: '8px' }}>
            📊 Supply Health by Category
          </div>
          <MiniBar
            values={[88, 92, 34, 95, 78, 85, 72, 60]}
            labels={['Food', 'Water', 'Fuel', 'Med', 'Maint', 'Shelter', 'Comms', 'CS*']}
            colors={['#16a34a','#16a34a','#d9381e','#16a34a','#2e7d32','#16a34a','#d97706','#005a9c']}
          />
          <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <span>% items &ge; 5d supply</span>
            <span title="Controlled Stores (Level-1 / Non-Sensitive Stores)" style={{ fontWeight: '600', color: '#005a9c' }}>
              *CS = Controlled Stores (CS)
            </span>
          </div>
        </div>

        {/* Delivery Success Rate Trend */}
        <div className="service-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--primary-navy)', marginBottom: '4px' }}>
            ✅ Convoy Delivery Success Rate
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>94.2%</div>
          <Sparkline data={DELIVERY_SUCCESS} color="#16a34a" width={220} height={46} />
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>8-day rolling logistics window</div>
        </div>

        {/* Issue 5: Critical Stockout Countdown with Clear Post Names and Deduplication */}
        <div className="service-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--primary-navy)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⏱️ Stockout Countdown</span>
            <span style={{ fontSize: '0.7rem', color: '#d9381e', fontWeight: '700' }}>&le; 5-Day Horizon</span>
          </div>
          {imminentStockouts.slice(0, 3).map((s) => {
            const key = s.record_id || `${s.location_id || s.location_code}_${s.item_id}`;
            const isCrit = s.days_remaining <= 3.5;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#1e293b', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    [{s.location_code || 'FP-Kilo'}] {s.item_name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Stock: {s.current_stock} {s.unit} • Burn: {s.effective_daily_demand || 94}/d
                  </div>
                </div>
                <div style={{
                  background: '#e2e8f0', borderRadius: '3px', height: '6px', width: '55px', overflow: 'hidden', flexShrink: 0
                }}>
                  <div style={{
                    width: `${Math.min(100, (s.days_remaining / 10) * 100)}%`,
                    height: '100%',
                    background: isCrit ? '#d9381e' : '#e65100'
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: isCrit ? '#d9381e' : '#e65100', width: '36px', textAlign: 'right' }}>
                  {s.days_remaining}d
                </div>
              </div>
            );
          })}
        </div>

        {/* Issue 15: Fleet Status Distribution (All bars show visible counts) */}
        <div className="service-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--primary-navy)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>🚛 Fleet Status Distribution</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>8 Total Vehicles</span>
          </div>
          <MiniBar
            values={[3, 2, 1, 1, 1]}
            labels={['Available', 'En Route', 'Delayed', 'Loading', 'Maint']}
            colors={['#16a34a', '#005a9c', '#d9381e', '#d97706', '#64748b']}
          />
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
            Available (3) • En Route (2) • Delayed (1) • Loading (1) • Maint (1)
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: GIS MAP & PROACTIVE RECOMMENDATIONS */}
      <div className="section-grid-2">
        <div>
          <div className="section-title">
            <span>Live GIS Tactical Logistics Map</span>
            <button className="btn-secondary btn-sm" onClick={() => onNavigate('MAP')}>
              Expand Tactical Map ↗
            </button>
          </div>
          <LogisticsMap
            locations={locations}
            vehicles={vehicles}
            routes={routes}
            onSelectLocation={onSelectLocation}
            height="470px"
          />
        </div>

        {/* Issue 4 & Issue 21: AI Recommendations with Structured "WHY?" and Correct Status */}
        <div>
          <div className="section-title">
            <span>AI Proactive Recommendations</span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {recommendations.length} Active Directives
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recommendations.slice(0, 3).map((rec) => {
              const isApproved = rec.status === 'APPROVED';
              const isCrit = rec.priority === 'CRITICAL';
              return (
                <div
                  key={rec.id}
                  className="service-card"
                  style={{
                    borderTopColor: isCrit ? '#d9381e' : '#e65100',
                    padding: '16px',
                    borderTopWidth: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className={`badge ${isCrit ? 'badge-critical' : 'badge-medium'}`}>
                      {rec.priority}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Confidence: <strong>{rec.confidence_pct}%</strong>
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.96rem', color: 'var(--primary-navy)', marginBottom: '8px', fontWeight: '700' }}>
                    {rec.title}
                  </h4>

                  {/* Issue 21: Structured "WHY?" Explanation Section */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#002f56', textTransform: 'uppercase', marginBottom: '4px' }}>
                      🎯 WHY THIS RECOMMENDATION?
                    </div>
                    {rec.reasoning_factors && rec.reasoning_factors.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: '#334155', lineHeight: '1.45' }}>
                        {rec.reasoning_factors.map((f, i) => (
                          <li key={i} style={{ marginBottom: '2px' }}>{f}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155' }}>{rec.reasoning}</p>
                    )}
                  </div>

                  {/* Action Item */}
                  <div style={{
                    background: '#eff6ff',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    borderLeft: '3px solid #005a9c',
                    fontSize: '0.8rem',
                    marginBottom: '12px',
                    color: '#1e293b'
                  }}>
                    <strong>ACTION:</strong> {rec.action_suggested}
                  </div>

                  {/* Issue 4: Dynamic Single Recommendation Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Status: <strong style={{ color: isApproved ? '#16a34a' : '#d97706' }}>
                        {isApproved ? 'APPROVED ✓' : 'PENDING APPROVAL'}
                      </strong>
                      {isApproved && rec.approved_at && (
                        <div style={{ fontSize: '0.68rem', color: '#16a34a' }}>
                          Approved: {rec.approved_at}
                        </div>
                      )}
                    </div>

                    {/* Show button ONLY if pending */}
                    {!isApproved ? (
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => onApproveRecommendation(rec.id)}
                      >
                        ✓ Approve & Dispatch
                      </button>
                    ) : (
                      <span className="badge badge-healthy" style={{ fontSize: '0.72rem' }}>
                        Approved by Commander
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: STOCKOUT WARNINGS & CONVOY MOVEMENTS */}
      <div className="section-grid-equal" style={{ marginTop: '20px' }}>
        {/* Issue 1 & Issue 5: Imminent Stockout Warnings (<= 5 Days) vs Watchlist */}
        <div className="table-container">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', color: 'var(--primary-navy)', fontSize: '0.92rem' }}>
                🚨 Imminent Stockout Warnings (&le; 5 Days)
              </span>
              <span className="badge badge-critical" style={{ fontSize: '0.68rem' }}>
                {imminentStockouts.length} Critical
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn-secondary btn-sm ${stockoutTab === 'IMMINENT' ? 'active' : ''}`}
                onClick={() => setStockoutTab('IMMINENT')}
              >
                &le; 5 Days ({imminentStockouts.length})
              </button>
              <button
                className={`btn-secondary btn-sm ${stockoutTab === 'WATCHLIST' ? 'active' : ''}`}
                onClick={() => setStockoutTab('WATCHLIST')}
              >
                Watchlist &gt; 5d ({watchlistStockouts.length})
              </button>
            </div>
          </div>

          <div className="responsive-table-wrap">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Location / Post</th>
                  <th>Item Description</th>
                  <th>Current Stock</th>
                  <th>Days Remaining</th>
                  <th>Risk Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(stockoutTab === 'IMMINENT' ? imminentStockouts : watchlistStockouts).map((s) => {
                  const key = s.record_id || `${s.location_id || s.location_code}_${s.item_id}`;
                  const isCrit = s.days_remaining <= 3.5;
                  return (
                    <tr key={key} style={{ backgroundColor: isCrit ? '#fff5f5' : 'transparent' }}>
                      <td>
                        <strong>{s.location_code || s.location_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.location_name}</div>
                      </td>
                      <td>
                        <strong>{s.item_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.category}</div>
                      </td>
                      <td><strong>{s.current_stock}</strong> {s.unit}</td>
                      <td>
                        <span style={{
                          fontWeight: '800',
                          color: isCrit ? '#d9381e' : (s.days_remaining <= 5.0 ? '#e65100' : '#16a34a')
                        }}>
                          {s.days_remaining} Days
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          s.risk_level === 'CRITICAL' ? 'badge-critical' :
                          s.risk_level === 'HIGH' ? 'badge-medium' : 'badge-low'
                        }`}>
                          {s.risk_level}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => onNavigate('SHIPMENTS')}
                        >
                          Plan Resupply
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issue 7 & Issue 8: Active Convoy Movements (Excludes Delivered) + Mobile Cards */}
        <div className="table-container">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', color: 'var(--primary-navy)', fontSize: '0.92rem' }}>
                🚚 Active Convoy Movements
              </span>
              <span className="badge badge-online" style={{ fontSize: '0.68rem' }}>
                {activeShipments.length} Active
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn-secondary btn-sm ${convoyTab === 'ACTIVE' ? 'active' : ''}`}
                onClick={() => setConvoyTab('ACTIVE')}
              >
                Active ({activeShipments.length})
              </button>
              <button
                className={`btn-secondary btn-sm ${convoyTab === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setConvoyTab('COMPLETED')}
              >
                Completed ({completedShipments.length})
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="desktop-convoy-table responsive-table-wrap">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Convoy #</th>
                  <th>Route & Target</th>
                  <th>Driver & Vehicle</th>
                  <th>ETA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(convoyTab === 'ACTIVE' ? activeShipments : completedShipments).map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.tracking_number}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.category}</div>
                    </td>
                    <td>
                      <div>To: <strong>{s.destination_name}</strong></div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.route_name}</div>
                    </td>
                    <td>
                      <div>{s.driver_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.vehicle_number}</div>
                    </td>
                    {/* Issue 2: Canonical formatted duration */}
                    <td>
                      <strong style={{ color: '#005a9c' }}>
                        {s.eta_formatted || formatDuration(s.eta_hours)}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${
                        s.status === 'DELIVERED' ? 'badge-healthy' :
                        s.status === 'DELAYED' ? 'badge-critical' :
                        s.status === 'EN_ROUTE' ? 'badge-online' : 'badge-low'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Issue 8: Mobile Convoy Cards (All key fields visible, no horizontal clipping) */}
          <div className="mobile-convoy-cards" style={{ display: 'none', padding: '12px' }}>
            {(convoyTab === 'ACTIVE' ? activeShipments : completedShipments).map((s) => (
              <div
                key={s.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '10px',
                  borderLeft: `4px solid ${s.status === 'DELAYED' ? '#d9381e' : (s.status === 'DELIVERED' ? '#16a34a' : '#005a9c')}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#002f56' }}>{s.tracking_number}</strong>
                  <span className={`badge ${
                    s.status === 'DELIVERED' ? 'badge-healthy' :
                    s.status === 'DELAYED' ? 'badge-critical' : 'badge-online'
                  }`}>
                    {s.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.45' }}>
                  <div><strong>Route:</strong> {s.origin_name ? s.origin_name.split(' ')[0] : 'CSD-01'} &rarr; {s.destination_name}</div>
                  <div><strong>Driver:</strong> {s.driver_name} ({s.vehicle_number})</div>
                  <div><strong>ETA:</strong> <strong style={{ color: '#005a9c' }}>{s.eta_formatted || formatDuration(s.eta_hours)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LIVE ACTIVITY FEED (Issue 3: Strictly Verified Chronology) */}
      <div className="table-container" style={{ marginTop: '24px' }}>
        <div className="table-toolbar">
          <span style={{ fontWeight: '700', color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
            🔴 Live Operational Activity Feed (Chronologically Verified)
          </span>
          <button className="btn-secondary btn-sm" onClick={() => onNavigate('AUDIT')}>
            Full Audit Logs ↗
          </button>
        </div>
        <div style={{ padding: '4px 0' }}>
          {validatedFeed.map((a, i) => (
            <div key={a.eventId || i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '10px 16px',
              borderBottom: i < validatedFeed.length - 1 ? '1px solid #f1f5f9' : 'none',
              background: i % 2 === 0 ? '#fff' : '#fafafa'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: a.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                flexShrink: 0,
                color: '#fff'
              }}>
                {a.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.4' }}>{a.text}</div>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: '600' }}>
                {a.time || formatISTTime(a.raw_timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
