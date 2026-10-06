import React, { useState, useEffect, useRef } from 'react';

const DEMO_STEPS = [
  {
    stepNumber: 1,
    phase: "BEFORE",
    title: "1. Baseline Operational Grid",
    desc: "Northern Sector supply grid operating under nominal conditions. 10 forward locations monitored.",
    duration: 5000,
    actionKey: "BASELINE"
  },
  {
    stepNumber: 2,
    phase: "BEFORE",
    title: "2. Strategic Inventory Health Assessment",
    desc: "Assessing forward store reserves. Forward Post Kilo initial Arctic Diesel buffer at 320L.",
    duration: 5000,
    actionKey: "INVENTORY_CHECK"
  },
  {
    stepNumber: 3,
    phase: "EVENT",
    title: "3. Increased Consumption Physics Triggered",
    desc: "Sub-zero meteorological freeze (-4.2°C) accelerates generator & shelter heating burn rate by +28% (94L/day).",
    duration: 5000,
    actionKey: "CONSUMPTION_SURGE"
  },
  {
    stepNumber: 4,
    phase: "AI DETECTION",
    title: "4. Predicted Stockout Flagged (< 3.4 Days)",
    desc: "FORGE ML engine computes depletion horizon: FP-Kilo reserves will breach zero in 3.4 days. Risk elevated to CRITICAL.",
    duration: 5500,
    actionKey: "STOCKOUT_PREDICTED"
  },
  {
    stepNumber: 5,
    phase: "EVENT",
    title: "5. Meteorological Storm Threat Activated",
    desc: "Doppler radar flags 42mm precipitation & sleet along Mountain Pass Echo (Route A corridor).",
    duration: 5500,
    actionKey: "WEATHER_SURGE"
  },
  {
    stepNumber: 6,
    phase: "AI DETECTION",
    title: "6. Multi-Factor Route Risk Recalculated",
    desc: "Route A risk score skyrockets to 85% (Mud-slide hazard, +3.5h delay). All-Weather Route B computed at 88/100 safety index.",
    duration: 5500,
    actionKey: "ROUTE_RECALC"
  },
  {
    stepNumber: 7,
    phase: "RECOMMENDATION",
    title: "7. Proactive AI Recommendation Generated",
    desc: "AI Advisor generates Recommendation REC-01: 'Authorize 1,200L Arctic Diesel replenishment via Route B immediately'.",
    duration: 5500,
    actionKey: "REC_GENERATED"
  },
  {
    stepNumber: 8,
    phase: "RECOMMENDATION",
    title: "8. Logistics Commander Approves Recommendation",
    desc: "Col. Ranjit Sharma authorizes Directive REC-01. State transitions to APPROVED. Proactive convoy queued.",
    duration: 5500,
    actionKey: "REC_APPROVED"
  },
  {
    stepNumber: 9,
    phase: "ACTION",
    title: "9. Replenishment Shipment Created",
    desc: "Convoy CONVOY-NORTH-703 generated with 1,200L Arctic Diesel payload from Central Staging Depot Alpha.",
    duration: 5000,
    actionKey: "SHIPMENT_CREATED"
  },
  {
    stepNumber: 10,
    phase: "ACTION",
    title: "10. Heavy Transport Vehicle Assigned",
    desc: "Vehicle ARMY-HT-017 (Tata LPTA 713 TC 4x4) assigned under driver Havildar Rajesh Kumar.",
    duration: 5000,
    actionKey: "VEHICLE_ASSIGNED"
  },
  {
    stepNumber: 11,
    phase: "ACTION",
    title: "11. Mission Route Package Synced to Driver",
    desc: "Driver downloads encrypted Mission Route Package with offline GIS waypoints and weather avoidance vectors.",
    duration: 5500,
    actionKey: "PACKAGE_DOWNLOADED"
  },
  {
    stepNumber: 12,
    phase: "ACTION",
    title: "12. Convoy Dispatched via Valley Axis",
    desc: "CONVOY-NORTH-703 departs CSD-01 on Route B. Telemetry ETA: 4h 48m across 205km corridor.",
    duration: 5500,
    actionKey: "CONVOY_DISPATCHED"
  },
  {
    stepNumber: 13,
    phase: "OFFLINE OPERATION",
    title: "13. High-Mountain Defile Signal Blackout",
    desc: "Convoy enters narrow mountain pass. Satellite and cellular connectivity drop to zero (OFFLINE).",
    duration: 5500,
    actionKey: "CONNECTIVITY_LOSS"
  },
  {
    stepNumber: 14,
    phase: "OFFLINE OPERATION",
    title: "14. Autonomous Driver HUD PWA Mode",
    desc: "Driver cockpit switches seamlessly to local cached vector maps and resilient local event journal.",
    duration: 5500,
    actionKey: "OFFLINE_MODE"
  },
  {
    stepNumber: 15,
    phase: "OFFLINE OPERATION",
    title: "15. Offline Delay & Checkpoint Event Recorded",
    desc: "Driver logs checkpoint clearance and temporary +30m mud-slush detour into encrypted flash storage queue.",
    duration: 5500,
    actionKey: "OFFLINE_EVENT_LOGGED"
  },
  {
    stepNumber: 16,
    phase: "SYNC",
    title: "16. Satellite Uplink Restored",
    desc: "Convoy emerges from gorge into Forward Base communications cone. Signal restored to ONLINE.",
    duration: 5000,
    actionKey: "CONNECTIVITY_RESTORED"
  },
  {
    stepNumber: 17,
    phase: "SYNC",
    title: "17. Store-and-Forward Telemetry Synchronized",
    desc: "Cached driver events automatically transmit to Command Grid. Activity feed & vehicle coordinates updated.",
    duration: 5500,
    actionKey: "EVENTS_SYNCED"
  },
  {
    stepNumber: 18,
    phase: "DELIVERY",
    title: "18. Convoy Arrives & Delivers 1,200L Fuel",
    desc: "ARMY-HT-017 reaches Forward Post Kilo Base Depot. Receipt verified. Shipment status marked DELIVERED.",
    duration: 5500,
    actionKey: "DELIVERY_COMPLETED"
  },
  {
    stepNumber: 19,
    phase: "AFTER",
    title: "19. Forward Post Inventory Replenished",
    desc: "FP-Kilo Arctic Diesel balance surges from 320L to 1,520L (16.2 Days of Supply).",
    duration: 5500,
    actionKey: "INVENTORY_RESTORED"
  },
  {
    stepNumber: 20,
    phase: "AFTER",
    title: "20. Predictive Risk Engine Recalculates",
    desc: "Location risk score at Forward Post Kilo plummets from 86% (CRITICAL) to 18% (HEALTHY).",
    duration: 5500,
    actionKey: "RISK_REDUCED"
  },
  {
    stepNumber: 21,
    phase: "AFTER",
    title: "21. Complete Mission Success & Grid Resiliency",
    desc: "Zero-stockout forward resilience proven. FORGE predictive logistics closed-loop demonstration complete!",
    duration: 6000,
    actionKey: "DEMO_COMPLETE"
  }
];

export default function DemoScenarioModal({
  onClose,
  onNavigate,
  onRefresh,
  onApplyDemoStep
}) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 1x or 2x
  const [progressPct, setProgressPct] = useState(0);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const activeStep = DEMO_STEPS[currentStepIdx];

  // Execute step action on live state
  const executeStep = (stepIdx) => {
    const step = DEMO_STEPS[stepIdx];
    if (onApplyDemoStep) {
      onApplyDemoStep(step.actionKey);
    }
  };

  // Step advancement timer
  useEffect(() => {
    executeStep(currentStepIdx);

    if (!isPlaying) {
      clearInterval(progressIntervalRef.current);
      clearTimeout(timerRef.current);
      return;
    }

    const stepDuration = activeStep.duration / speed;
    const intervalMs = 50;
    let elapsed = 0;
    setProgressPct(0);

    progressIntervalRef.current = setInterval(() => {
      elapsed += intervalMs;
      setProgressPct(Math.min(100, (elapsed / stepDuration) * 100));
    }, intervalMs);

    timerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current);
      if (currentStepIdx < DEMO_STEPS.length - 1) {
        setCurrentStepIdx((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, stepDuration);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressIntervalRef.current);
    };
  }, [currentStepIdx, isPlaying, speed]);

  const handleNext = () => {
    if (currentStepIdx < DEMO_STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setIsPlaying(true);
    setProgressPct(0);
    if (onApplyDemoStep) onApplyDemoStep("RESET");
  };

  // Phase color badges
  const phaseColors = {
    BEFORE: { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
    EVENT: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    "AI DETECTION": { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
    RECOMMENDATION: { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe' },
    ACTION: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
    "OFFLINE OPERATION": { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
    SYNC: { bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4' },
    DELIVERY: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    AFTER: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' }
  };

  const currentPhaseStyle = phaseColors[activeStep.phase] || phaseColors.BEFORE;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-dialog" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header" style={{ background: 'var(--primary-navy)', color: '#ffffff' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem' }}>
                FORGE End-to-End Automated Demo Scenario (2-Minute Evaluation)
              </h3>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
              Problem Statement ID: 26251 • Predictive Forward Logistics Decision Engine
            </div>
          </div>
          <button className="modal-close-btn" style={{ color: '#ffffff' }} onClick={onClose}>✕</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Visual Lifecycle Progression Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
            fontSize: '0.72rem',
            fontWeight: '700',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            {['BEFORE', 'EVENT', 'AI DETECTION', 'RECOMMENDATION', 'ACTION', 'OFFLINE', 'SYNC', 'DELIVERY', 'AFTER'].map((p, i) => {
              const isActive = activeStep.phase.includes(p) || (p === 'OFFLINE' && activeStep.phase.includes('OFFLINE'));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: isActive ? '#005a9c' : '#e2e8f0',
                    color: isActive ? '#ffffff' : '#64748b',
                    transition: 'all 0.3s'
                  }}>
                    {p}
                  </span>
                  {i < 8 && <span style={{ color: '#cbd5e1' }}>&rarr;</span>}
                </div>
              );
            })}
          </div>

          {/* Current Step Card */}
          <div style={{
            background: '#ffffff',
            border: `2px solid ${currentPhaseStyle.border}`,
            borderLeft: `6px solid ${currentPhaseStyle.color}`,
            borderRadius: '6px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                background: currentPhaseStyle.bg,
                color: currentPhaseStyle.color,
                border: `1px solid ${currentPhaseStyle.border}`,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '800',
                letterSpacing: '0.5px'
              }}>
                PHASE: {activeStep.phase}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
                Step {activeStep.stepNumber} of {DEMO_STEPS.length}
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-navy)', margin: '4px 0 10px 0', fontWeight: '800' }}>
              {activeStep.title}
            </h3>

            <p style={{ fontSize: '0.94rem', color: '#334155', lineHeight: '1.55', margin: 0 }}>
              {activeStep.desc}
            </p>
          </div>

          {/* Step Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
              <span>Step Timer ({isPlaying ? 'Advancing Automatically' : 'Paused'})</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${progressPct}%`,
                height: '100%',
                background: '#005a9c',
                transition: 'width 0.05s linear'
              }} />
            </div>
          </div>

          {/* Timeline Step Dots */}
          <div style={{ display: 'flex', gap: '3px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {DEMO_STEPS.map((s, idx) => (
              <div
                key={idx}
                onClick={() => { setCurrentStepIdx(idx); }}
                title={`Step ${idx + 1}: ${s.title}`}
                style={{
                  flex: 1,
                  minWidth: '14px',
                  height: '8px',
                  borderRadius: '2px',
                  background: currentStepIdx === idx ? '#d9381e' : (currentStepIdx > idx ? '#16a34a' : '#cbd5e1'),
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          {/* Left Controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn-primary"
              style={{ background: isPlaying ? '#d97706' : '#16a34a', padding: '6px 14px', fontSize: '0.85rem' }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸ Pause Demo' : '▶ Resume Auto Demo'}
            </button>
            <button className="btn-secondary btn-sm" onClick={handleReset}>
              🔄 Reset Demo
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setSpeed(speed === 1 ? 2 : 1)}
              title="Toggle Playback Speed"
            >
              ⚡ Speed: {speed}x
            </button>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary btn-sm" onClick={handlePrev} disabled={currentStepIdx === 0}>
              &lt; Previous
            </button>
            <button className="btn-secondary btn-sm" onClick={handleNext} disabled={currentStepIdx === DEMO_STEPS.length - 1}>
              Next &gt;
            </button>
            <button className="btn-secondary btn-sm" onClick={onClose}>
              Close & View Live Grid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
