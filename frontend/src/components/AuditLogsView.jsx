import React, { useState, useEffect } from 'react';
import { formatISTDateTime } from '../utils/formatters';

const EXTRA_LOGS = [
  { id: 101, timestamp: new Date(Date.now() - 300000).toISOString(), user_name: 'Col. Ranjit Sharma', user_role: 'COMMANDER', action: 'APPROVE_RECOMMENDATION', entity_type: 'Recommendation', entity_id: 1, details: 'Approved urgent fuel resupply for Forward Post Kilo. CONVOY-NORTH-703 authorized.' },
  { id: 102, timestamp: new Date(Date.now() - 620000).toISOString(), user_name: 'Capt. Priya Nair', user_role: 'LOGISTICS_OFFICER', action: 'CREATE_SHIPMENT', entity_type: 'Shipment', entity_id: 4, details: 'New convoy planned — 800L Arctic Diesel → FP-KILO via Route B.' },
  { id: 103, timestamp: new Date(Date.now() - 1800000).toISOString(), user_name: 'Hav. Rajesh Kumar', user_role: 'TRUCK_DRIVER', action: 'CHECKPOINT_CLEARED', entity_type: 'Shipment', entity_id: 3, details: 'CONVOY-NORTH-703 cleared Valley Transit Checkpost Charlie. Canonical ETA FP-KILO: 4h 48m.' },
  { id: 104, timestamp: new Date(Date.now() - 2700000).toISOString(), user_name: 'Capt. Priya Nair', user_role: 'LOGISTICS_OFFICER', action: 'DISPATCH_CONVOY', entity_type: 'Shipment', entity_id: 3, details: 'Dispatched ARMY-HT-017 carrying 1200L Diesel on Route B (Valley All-Weather Axis).' },
  { id: 105, timestamp: new Date(Date.now() - 4500000).toISOString(), user_name: 'L/Nk. Mohan Das', user_role: 'FORWARD_OPERATOR', action: 'RECORD_CONSUMPTION', entity_type: 'InventoryItem', entity_id: 5, details: 'Logged 94L diesel consumed at Forward Post Kilo. Current balance: 320L (3.4 Days).' },
  { id: 106, timestamp: new Date(Date.now() - 7200000).toISOString(), user_name: 'AI-FORGE', user_role: 'SYSTEM', action: 'GENERATE_RECOMMENDATION', entity_type: 'AIRecommendation', entity_id: 1, details: 'Critical shortage detected: FP-KILO fuel reserves at 3.4 days. Auto-generated URGENT resupply recommendation.' },
  { id: 107, timestamp: new Date(Date.now() - 9000000).toISOString(), user_name: 'Capt. Priya Nair', user_role: 'LOGISTICS_OFFICER', action: 'ROUTE_COMPARISON', entity_type: 'Route', entity_id: 1, details: 'Route optimization run: CSD-01 → FP-KILO. Route B selected (score 88/100). Route A flagged hazardous.' },
  { id: 108, timestamp: new Date(Date.now() - 12000000).toISOString(), user_name: 'Hav. Dev Singh', user_role: 'TRUCK_DRIVER', action: 'REPORT_DELAY', entity_type: 'Shipment', entity_id: 2, details: 'CONVOY-NORTH-702 delayed +3.5h: Road A slush/mud obstruction at Pass Echo km 68. Route deviation required.' },
  { id: 109, timestamp: new Date(Date.now() - 18000000).toISOString(), user_name: 'Col. Ranjit Sharma', user_role: 'COMMANDER', action: 'WEATHER_ALERT_ACKNOWLEDGED', entity_type: 'WeatherAlert', entity_id: 1, details: 'Commander acknowledged: Pass Echo 42mm precipitation alert. All Route A convoys rerouted to Route B.' },
  { id: 110, timestamp: new Date(Date.now() - 86400000).toISOString(), user_name: 'Capt. Priya Nair', user_role: 'LOGISTICS_OFFICER', action: 'SIMULATION_EXECUTED', entity_type: 'Simulation', entity_id: 1, details: 'What-If simulation: Blizzard scenario +100% demand. Projected 3-day coverage collapse. Pre-position buffers recommended.' },
];

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/audit')
      .then((res) => res.json())
      .then((data) => {
        const merged = [...EXTRA_LOGS, ...(Array.isArray(data) ? data : [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(merged);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Using bundled audit logs", err);
        setLogs([...EXTRA_LOGS].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setLoading(false);
      });
  }, []);

  const filtered = logs.filter(l => {
    const matchRole = filterRole === 'ALL' || l.user_role === filterRole;
    const matchSearch = !searchTerm || l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.user_name && l.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchRole && matchSearch;
  });

  const roleColors = {
    COMMANDER: 'badge-critical',
    LOGISTICS_OFFICER: 'badge-online',
    TRUCK_DRIVER: 'badge-medium',
    FORWARD_OPERATOR: 'badge-healthy',
    SYSTEM: 'badge-low'
  };

  const actionIcon = (action) => {
    if (action.includes('APPROVE')) return '✅';
    if (action.includes('CREATE') || action.includes('DISPATCH')) return '🚀';
    if (action.includes('CHECKPOINT')) return '📍';
    if (action.includes('DELAY') || action.includes('OBSTRUCTION')) return '⚠️';
    if (action.includes('CONSUME') || action.includes('RECORD')) return '📊';
    if (action.includes('RECOMMEND') || action.includes('SIMULATION')) return '🤖';
    if (action.includes('ROUTE') || action.includes('WEATHER')) return '🗺️';
    return '📋';
  };

  return (
    <div className="container">
      <div className="section-title">
        <span>Operational Audit Logs & Security Trails</span>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>
          Immutable Telemetry & Dispatch Audit Registry (24-Hour IST)
        </span>
      </div>

      {/* SUMMARY KPI STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Events', value: logs.length, color: '#002f56' },
          { label: 'Today', value: logs.filter(l => (Date.now() - new Date(l.timestamp)) < 86400000).length, color: '#005a9c' },
          { label: 'Commander Actions', value: logs.filter(l => l.user_role === 'COMMANDER').length, color: '#d9381e' },
          { label: 'AI System Events', value: logs.filter(l => l.user_role === 'SYSTEM').length, color: '#7c3aed' },
          { label: 'Driver Events', value: logs.filter(l => l.user_role === 'TRUCK_DRIVER').length, color: '#d97706' },
        ].map((k, i) => (
          <div key={i} className="service-card" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search action, officer, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Filter Role:</label>
            <select
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="COMMANDER">Commander</option>
              <option value="LOGISTICS_OFFICER">Logistics Officer</option>
              <option value="TRUCK_DRIVER">Truck Driver</option>
              <option value="FORWARD_OPERATOR">Forward Operator</option>
              <option value="SYSTEM">AI Engine / System</option>
            </select>
          </div>
        </div>

        <div className="responsive-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>IST Timestamp</th>
                <th>Officer / User</th>
                <th>Role</th>
                <th>Action Type</th>
                <th>Entity Target</th>
                <th>Audit Trail Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td><strong>LOG-#{l.id}</strong></td>
                  {/* Issue 6: Standardized 24-hour IST Timestamp */}
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                    {formatISTDateTime(l.timestamp)}
                  </td>
                  <td><strong>{l.user_name || 'System Operator'}</strong></td>
                  <td>
                    <span className={`badge ${roleColors[l.user_role] || 'badge-low'}`}>
                      {l.user_role}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '0.8rem' }}>
                      <span>{actionIcon(l.action)}</span>
                      <span>{l.action}</span>
                    </span>
                  </td>
                  <td><span style={{ fontSize: '0.78rem' }}>{l.entity_type} #{l.entity_id}</span></td>
                  <td style={{ fontSize: '0.8rem', color: '#334155' }}>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
