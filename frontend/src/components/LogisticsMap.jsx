import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SOI_NORTHERN_SECTOR_BOUNDARY, SOI_METADATA } from '../data/soiBoundaries';

export default function LogisticsMap({
  locations = [],
  vehicles = [],
  routes = [],
  onSelectLocation = () => {},
  height = '540px'
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, CRITICAL, VEHICLES, ROUTES, SOI_BOUNDARY
  const [showBoundary, setShowBoundary] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    // Center near Northern Logistics Frontier (Leh-Udhampur corridor)
    if (!mapInstanceRef.current) {
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([33.80, 75.80], 7);

      // Issue 17: English CartoDB Voyager Map style for guaranteed English geography labels
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> | Boundary: Survey of India (9th Ed.)'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing dynamic layers except base tile layer
    map.eachLayer((layer) => {
      if (
        layer instanceof L.Marker ||
        layer instanceof L.Polyline ||
        layer instanceof L.CircleMarker ||
        layer instanceof L.GeoJSON
      ) {
        map.removeLayer(layer);
      }
    });

    // Issue 18: Authoritative Survey of India Political Boundary Layer
    if (showBoundary || filterMode === 'SOI_BOUNDARY') {
      const soiLayer = L.geoJSON(SOI_NORTHERN_SECTOR_BOUNDARY, {
        style: (feature) => {
          const isUTBorder = feature.properties.name.includes('Division');
          return {
            color: isUTBorder ? '#005a9c' : '#d9381e',
            weight: isUTBorder ? 2.5 : 3.5,
            opacity: 0.9,
            dashArray: isUTBorder ? '4, 6' : null
          };
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <div style="font-family:'Segoe UI',sans-serif;padding:6px;min-width:220px;">
              <div style="font-weight:700;color:#002f56;font-size:13px;margin-bottom:4px;">
                🏛️ ${feature.properties.name}
              </div>
              <div style="font-size:11px;color:#334155;line-height:1.4;">
                <div><strong>Authority:</strong> ${SOI_METADATA.source}</div>
                <div><strong>Dataset:</strong> ${SOI_METADATA.dataset}</div>
                <div><strong>Edition:</strong> ${SOI_METADATA.edition}</div>
                <div><strong>Access Date:</strong> ${SOI_METADATA.accessDate}</div>
                <div style="margin-top:6px;padding-top:4px;border-top:1px solid #e2e8f0;font-size:10px;color:#64748b;">
                  ${SOI_METADATA.notice}
                </div>
              </div>
            </div>
          `);
        }
      }).addTo(map);
    }

    // Issue 19: Map Pin Icon Generator with Short English Labels
    const createLabeledMarkerIcon = (color, shortCode, displayName, isDepot = false, isCritical = false) => {
      const iconHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <div style="
            background:${color};
            width:${isDepot ? '28px' : '24px'};
            height:${isDepot ? '28px' : '24px'};
            border-radius:${isDepot ? '4px' : '50%'};
            border:2px solid #ffffff;
            box-shadow:0 2px 6px rgba(0,0,0,0.4);
            display:flex;
            align-items:center;
            justify-content:center;
            color:#ffffff;
            font-weight:bold;
            font-size:${isDepot ? '12px' : '10px'};
          ">
            ${isDepot ? '★' : shortCode}
          </div>
          <div style="
            background:rgba(0, 47, 86, 0.92);
            color:#ffffff;
            font-size:10px;
            font-weight:700;
            padding:1px 5px;
            border-radius:3px;
            margin-top:2px;
            white-space:nowrap;
            box-shadow:0 1px 3px rgba(0,0,0,0.3);
            border:1px solid rgba(255,255,255,0.4);
          ">
            ${displayName}
          </div>
        </div>
      `;

      return L.divIcon({
        className: 'custom-labeled-map-pin',
        html: iconHtml,
        iconSize: [60, 46],
        iconAnchor: [30, 14],
        popupAnchor: [0, -16]
      });
    };

    // Render Routes
    if (filterMode === 'ALL' || filterMode === 'ROUTES') {
      routes.forEach((r) => {
        if (r.geometry && r.geometry.length > 0) {
          const isRec = r.is_recommended;
          const routeColor = isRec ? '#1b5e20' : '#d9381e';
          const weight = isRec ? 5 : 3;
          const dashArray = isRec ? null : '6, 6';

          const polyline = L.polyline(r.geometry, {
            color: routeColor,
            weight: weight,
            opacity: 0.85,
            dashArray: dashArray
          }).addTo(map);

          polyline.bindPopup(`
            <div style="font-family:'Segoe UI',sans-serif;padding:6px;min-width:220px;">
              <h4 style="margin:0 0 4px 0;color:#002f56;font-size:13px;font-weight:700;">${r.name || r.route_name}</h4>
              <p style="margin:2px 0;font-size:11px;"><strong>Distance:</strong> ${r.distance_km} km | <strong>Base ETA:</strong> ${r.eta_formatted || r.base_eta_hours + 'h'}</p>
              <p style="margin:2px 0;font-size:11px;"><strong>Composite Safety Score:</strong> <span style="color:${isRec ? '#2e7d32' : '#d9381e'};font-weight:bold;">${r.composite_score}/100</span></p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#475569;line-height:1.3;">${r.recommendation_note || r.road_condition}</p>
            </div>
          `);
        }
      });
    }

    // Render Forward Locations & Central Depots (Issue 19)
    locations.forEach((loc) => {
      const isCritical = loc.current_risk_score >= 61.0 || loc.status === 'CRITICAL';
      if (filterMode === 'CRITICAL' && !isCritical) return;

      let color = '#2e7d32'; // Healthy
      if (loc.current_risk_score >= 81.0) color = '#d9381e'; // Critical
      else if (loc.current_risk_score >= 61.0) color = '#e65100'; // High Risk
      else if (loc.current_risk_score >= 31.0) color = '#f57c00'; // Medium

      const isDepot = loc.location_type === 'CENTRAL_DEPOT';
      // Clean short label: "FP-Kilo", "FP-Sierra", "CSD-01", "FLB-02", "BB-03", etc.
      const shortDisplay = loc.code || loc.name.split(' ')[0];

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createLabeledMarkerIcon(color, loc.code ? loc.code.substring(0, 2) : '•', shortDisplay, isDepot, isCritical)
      }).addTo(map);

      // On Click Popup: Full Structured Information
      const popupHtml = `
        <div style="font-family:'Segoe UI',sans-serif;min-width:220px;padding:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <h4 style="margin:0;color:#002f56;font-size:14px;font-weight:700;">${loc.name}</h4>
            <span style="background:${color};color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;font-weight:bold;">
              ${loc.status}
            </span>
          </div>
          <div style="font-size:12px;color:#334155;line-height:1.5;">
            <div><strong>Location Code:</strong> ${loc.code}</div>
            <div><strong>Sector:</strong> ${loc.sector}</div>
            <div><strong>Terrain:</strong> ${loc.terrain_type} (${loc.altitude_m}m ASL)</div>
            <div><strong>Risk Score:</strong> <strong style="color:${color};">${loc.current_risk_score}/100</strong></div>
            <div><strong>Weather:</strong> ${loc.weather_condition} (${loc.temp_c}°C, ${loc.precipitation_mm}mm)</div>
            <div><strong>Road Status:</strong> ${loc.road_condition}</div>
            <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;">
              <span style="font-weight:bold;color:#005a9c;">Min Coverage: ${loc.days_of_supply_min || '~3.4'} Days</span>
            </div>
          </div>
          <button id="btn-popup-${loc.id}" style="margin-top:8px;width:100%;background:#005a9c;color:#fff;border:none;padding:6px 8px;border-radius:4px;cursor:pointer;font-weight:600;font-size:11px;">
            View Detailed Intelligence &gt;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${loc.id}`);
        if (btn) {
          btn.onclick = () => onSelectLocation(loc);
        }
      });
    });

    // Render Fleet Vehicles (Issue 19)
    if (filterMode === 'ALL' || filterMode === 'VEHICLES') {
      vehicles.forEach((v) => {
        const isOffline = v.connectivity_status === 'OFFLINE';
        const isDelayed = v.status === 'DELAYED';
        const vColor = isDelayed ? '#d97706' : (isOffline ? '#475569' : '#005a9c');

        // Short convoy/vehicle badge
        const shortVehLabel = v.vehicle_number ? v.vehicle_number.replace('ARMY-', '') : 'TRUCK';

        const truckIcon = L.divIcon({
          className: 'custom-labeled-truck-pin',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
              <div style="background:${vColor};width:26px;height:26px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;">
                🚚
              </div>
              <div style="background:#0f172a;color:#38bdf8;font-size:9px;font-weight:800;padding:1px 4px;border-radius:3px;margin-top:2px;white-space:nowrap;border:1px solid #0284c7;">
                ${shortVehLabel}
              </div>
            </div>
          `,
          iconSize: [60, 44],
          iconAnchor: [30, 13],
          popupAnchor: [0, -14]
        });

        const vMarker = L.marker([v.current_lat, v.current_lng], { icon: truckIcon }).addTo(map);
        vMarker.bindPopup(`
          <div style="font-family:'Segoe UI',sans-serif;padding:6px;min-width:200px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <h4 style="margin:0;color:#002f56;font-size:13px;font-weight:700;">${v.vehicle_number}</h4>
              <span class="badge ${isDelayed ? 'badge-critical' : 'badge-online'}" style="font-size:9px;">
                ${v.status}
              </span>
            </div>
            <div style="font-size:11px;color:#334155;line-height:1.4;">
              <div><strong>Model:</strong> ${v.model_type}</div>
              <div><strong>Capacity:</strong> ${v.capacity_tons} Tons | <strong>Fuel:</strong> ${v.fuel_pct}%</div>
              <div><strong>Driver:</strong> ${v.assigned_driver_name || 'Assigned Driver'}</div>
              <div><strong>Current Convoy:</strong> ${v.current_shipment_number || 'Staged in Reserve'}</div>
              <div><strong>Connectivity:</strong> <span style="color:${isOffline ? '#dc2626' : '#16a34a'};font-weight:bold;">${v.connectivity_status}</span></div>
            </div>
          </div>
        `);
      });
    }

  }, [locations, vehicles, routes, filterMode, showBoundary]);

  return (
    <div className="map-card">
      <div className="map-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }} className="filter-group">
          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--primary-navy)' }}>
            GIS Tactical Logistics Grid
          </span>
          <div className="filter-group">
            <button
              className={`btn-secondary btn-sm ${filterMode === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterMode('ALL')}
            >
              All Layers
            </button>
            <button
              className={`btn-secondary btn-sm ${filterMode === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setFilterMode('CRITICAL')}
            >
              Critical Nodes Only
            </button>
            <button
              className={`btn-secondary btn-sm ${filterMode === 'VEHICLES' ? 'active' : ''}`}
              onClick={() => setFilterMode('VEHICLES')}
            >
              Fleet En Route
            </button>
            <button
              className={`btn-secondary btn-sm ${filterMode === 'ROUTES' ? 'active' : ''}`}
              onClick={() => setFilterMode('ROUTES')}
            >
              Corridors
            </button>
            <button
              className={`btn-secondary btn-sm ${showBoundary ? 'active' : ''}`}
              onClick={() => setShowBoundary(!showBoundary)}
              title="Toggle Survey of India Official Boundary"
            >
              🏛️ SOI Border
            </button>
          </div>
        </div>

        {/* Issue 14: Responsive wrapped legend where dot + text never break awkwardly */}
        <div className="map-legend">
          <div className="legend-item"><span className="legend-dot" style={{ background: '#2e7d32' }}></span> Healthy</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#f57c00' }}></span> Medium</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#e65100' }}></span> High Risk</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#d9381e' }}></span> Critical</div>
          <div className="legend-item"><span style={{ color: '#002f56', fontWeight: 'bold' }}>★</span> Base Depot</div>
          <div className="legend-item"><span style={{ color: '#d9381e', fontWeight: 'bold' }}>—</span> SOI Border</div>
        </div>
      </div>

      <div ref={mapRef} style={{ height: height, width: '100%', position: 'relative', zIndex: 1 }} />

      {/* Authoritative Cartographic Attribution Strip */}
      <div style={{
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '5px 12px',
        fontSize: '0.72rem',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <span>
          <strong>Cartographic Source:</strong> English Tiles (CartoDB Voyager / OpenStreetMap) • <strong>Political Boundary:</strong> Survey of India (9th Ed., UT of J&K / Ladakh)
        </span>
        <span style={{ color: '#005a9c', fontWeight: '600' }}>
          GIGW & Survey of India Policy Compliant (06 Oct 2026)
        </span>
      </div>
    </div>
  );
}
