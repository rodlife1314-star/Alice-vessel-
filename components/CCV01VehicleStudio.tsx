'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CCVOperatingState,
  CCVModeGeometry,
  StabilityEnvelopeLevel,
  CCVPilotCommands,
  CCVTelemetry,
  CCV_OPERATING_STATE_INFO,
  CCV_CONCENTRIC_LAYERS,
  calculateCCVTelemetry,
} from '@/lib/ccv01-vehicle-engine';
import {
  Rocket,
  Shield,
  Zap,
  Activity,
  Compass,
  Sliders,
  Radio,
  Layers,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Navigation,
  Crosshair,
  Gauge,
  Cpu,
  CheckCircle2,
  Anchor,
  Wind,
  Info,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface CCV01VehicleStudioProps {
  onNavigateToWorkbench?: () => void;
  onOpenAiSynthesis?: () => void;
}

export default function CCV01VehicleStudio({
  onNavigateToWorkbench,
  onOpenAiSynthesis,
}: CCV01VehicleStudioProps) {
  // Operational state
  const [operatingState, setOperatingState] = useState<CCVOperatingState>('cruise');
  const [geometryMode, setGeometryMode] = useState<CCVModeGeometry>('G6');
  const [cutawayMode, setCutawayMode] = useState<boolean>(true);
  const [showAxesOverlay, setShowAxesOverlay] = useState<boolean>(true);
  const [showFieldLobes, setShowFieldLobes] = useState<boolean>(true);
  const [selectedLayerId, setSelectedLayerId] = useState<'spine' | 'field_core' | 'adaptive_lattice' | 'protective_hull'>('spine');

  // Pilot commands
  const [destVectorAngle, setDestVectorAngle] = useState<number>(0);
  const [couplingAuthority, setCouplingAuthority] = useState<number>(0.92);
  const [stabilityEnvelope, setStabilityEnvelope] = useState<StabilityEnvelopeLevel>('tight');

  // Auxiliary system states
  const [rcsTestFiring, setRcsTestFiring] = useState<boolean>(false);
  const [emergencyArmed, setEmergencyArmed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animation loop time
  const [animTime, setAnimTime] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let last = performance.now();
    const loop = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setAnimTime(prev => prev + dt);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const pilotCommands: CCVPilotCommands = useMemo(() => ({
    destinationVectorAngleDeg: destVectorAngle,
    couplingAuthorityFraction: couplingAuthority,
    stabilityEnvelope,
  }), [destVectorAngle, couplingAuthority, stabilityEnvelope]);

  const telemetry: CCVTelemetry = useMemo(() => {
    return calculateCCVTelemetry(operatingState, geometryMode, pilotCommands, 377.0, animTime);
  }, [operatingState, geometryMode, pilotCommands, animTime]);

  // Handle Quick State Shifts
  const handleSelectState = (st: CCVOperatingState) => {
    setOperatingState(st);
    setGeometryMode(CCV_OPERATING_STATE_INFO[st].defaultGeometry);
    if (st === 'vector' && Math.abs(destVectorAngle) < 5) {
      setDestVectorAngle(22); // Default vectoring steer
    } else if (st === 'cruise') {
      setDestVectorAngle(0);
    }
  };

  const handleRunFlightComputerOptimization = () => {
    // Flight computer solver: calculates optimal a*(t) = arg max J
    if (operatingState === 'vector') {
      setGeometryMode('G3');
      setCouplingAuthority(0.85);
      setStabilityEnvelope('nominal');
    } else if (operatingState === 'cruise') {
      setGeometryMode('G6');
      setDestVectorAngle(0);
      setCouplingAuthority(0.96);
      setStabilityEnvelope('tight');
    } else if (operatingState === 'release') {
      setGeometryMode('G_inf');
      setCouplingAuthority(0.2);
    }
    setToastMessage('Flight Computer: Optimal mode coefficients a*(t) and lattice phasing applied.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedLayerDef = CCV_CONCENTRIC_LAYERS.find(l => l.id === selectedLayerId)!;

  // SVG Geometry Dimensions
  const svgWidth = 840;
  const svgHeight = 440;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  // Vector angles in radians
  const massAngleRad = Math.atan2(telemetry.axes.massAxis[0], telemetry.axes.massAxis[1]);
  const fieldAngleRad = Math.atan2(telemetry.axes.fieldAxis[0], telemetry.axes.fieldAxis[1]);

  // 2D Rotation transformation matrices for SVG
  const hullTransform = `rotate(${(-massAngleRad * 180) / Math.PI}, ${cx}, ${cy})`;
  const fieldTransform = `rotate(${(-fieldAngleRad * 180) / Math.PI}, ${cx}, ${cy})`;

  return (
    <div id="ccv01-vehicle-studio" className="w-full flex flex-col gap-4 font-sans pb-12">
      {/* Top Banner / Doctrine Manifest */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-sky-500/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded font-bold">
                  Vehicle Product Concept 01
                </span>
                <span className="text-xs font-mono text-slate-400">Axisymmetric Spindle Architecture</span>
              </div>
              <h2 className="text-lg font-bold font-mono text-white tracking-tight flex items-center gap-2">
                <span>CCV-01 — Corridor Coupling Vehicle</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAiSynthesis && (
              <button
                id="btn-ccv-ai-synthesis"
                onClick={onOpenAiSynthesis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Engineering Audit</span>
              </button>
            )}
            {onNavigateToWorkbench && (
              <button
                id="btn-ccv-goto-workbench"
                onClick={onNavigateToWorkbench}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Field Workbench</span>
              </button>
            )}
          </div>
        </div>

        {/* Governing Doctrine Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs font-mono">
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-850">
            <span className="text-amber-400 font-bold block mb-0.5">THE GOVERNING RULE:</span>
            <span className="text-slate-300 text-[11px]">
              &ldquo;The hull carries the people; the entire vessel couples to the corridor.&rdquo;
            </span>
            <span className="text-slate-500 text-[10px] block mt-1">
              Not a rocket with a thruster bolted on. A field-coupling vehicle with a simple physical hull and a reconfigurable electromagnetic lattice.
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-850">
            <span className="text-cyan-400 font-bold block mb-0.5">THE GEOMETRIC PARADOX RESOLVED:</span>
            <span className="text-slate-300 text-[11px]">
              &ldquo;The geometry is not the ship&apos;s shape. The geometry is the electromagnetic state the ship occupies.&rdquo;
            </span>
            <span className="text-slate-500 text-[10px] block mt-1">
              Transitions <span className="text-sky-300">G₃ → G₆ → G_∞</span> are modal coefficients a_k(t) of the adaptive lattice, not folding mechanical plates.
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Visualizer Stage + Flight Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left 8 Cols: Interactive Spindle & Mode Geometry Stage */}
        <div className="xl:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          {/* Stage Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-slate-200">
                Coupling Visualizer Stage
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Scale: 1:1 Section (L=48m, D=10.4m)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                id="btn-toggle-cutaway"
                onClick={() => setCutawayMode(!cutawayMode)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  cutawayMode
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cutawayMode ? 'Cutaway View (Spine Exposed)' : 'Solid Hull View'}
              </button>

              <button
                id="btn-toggle-field-lobes"
                onClick={() => setShowFieldLobes(!showFieldLobes)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  showFieldLobes
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {showFieldLobes ? 'Field Mode Lobes: ON' : 'Field Mode Lobes: OFF'}
              </button>

              <button
                id="btn-toggle-axes"
                onClick={() => setShowAxesOverlay(!showAxesOverlay)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  showAxesOverlay
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {showAxesOverlay ? '3-Axes Overlay: ON' : '3-Axes: OFF'}
              </button>
            </div>
          </div>

          {/* SVG Vehicle Stage */}
          <div className="relative w-full h-[440px] bg-slate-950 rounded-lg border border-slate-850 overflow-hidden flex items-center justify-center select-none">
            <svg
              id="ccv-schematic-svg"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full"
            >
              <defs>
                {/* Glow Filters */}
                <filter id="fieldGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="corridorGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Corridor Beam Gradient */}
                <linearGradient id="corridorBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.0" />
                  <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.12" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>

                {/* Spindle Hull Gradient */}
                <linearGradient id="hullGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="25%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="75%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                {/* Spine Quiet Core Gradient */}
                <linearGradient id="spineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                </linearGradient>

                {/* Field Mode Lobes Gradient */}
                <radialGradient id="lobeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#0284c7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              {/* Background Grid */}
              <g id="svg-grid" opacity="0.15">
                {Array.from({ length: 17 }).map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * 50}
                    y1={0}
                    x2={i * 50}
                    y2={svgHeight}
                    stroke="#475569"
                    strokeWidth="0.5"
                  />
                ))}
                {Array.from({ length: 9 }).map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1={0}
                    y1={i * 50}
                    x2={svgWidth}
                    y2={i * 50}
                    stroke="#475569"
                    strokeWidth="0.5"
                  />
                ))}
              </g>

              {/* External Transport Corridor Thread / Rail */}
              <g id="corridor-thread">
                <rect
                  x={cx - 140}
                  y={0}
                  width={280}
                  height={svgHeight}
                  fill="url(#corridorBeam)"
                />
                {/* Central Corridor Axis \hat{\Psi}_R */}
                <line
                  x1={cx}
                  y1={0}
                  x2={cx}
                  y2={svgHeight}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.8"
                />
                <text
                  x={cx + 12}
                  y={24}
                  fill="#f59e0b"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  CORRIDOR RAIL AXIS Ψ_R (Z_R={telemetry.corridorImpedanceOhm}Ω)
                </text>
              </g>

              {/* Electromagnetic Field Mode Envelope (\Psi_{vessel}) */}
              {/* NOTE: Field Axis tilts independently of hull! */}
              {showFieldLobes && (
                <g id="field-lobes-group" transform={fieldTransform}>
                  {/* Mode G3: 3 dominant field lobes */}
                  {geometryMode === 'G3' && (
                    <g id="mode-g3-lobes">
                      {[0, 120, 240].map((deg, i) => {
                        const rad = (deg * Math.PI) / 180 + animTime * 0.8;
                        const lx = cx + Math.cos(rad) * 160;
                        const ly = cy + Math.sin(rad) * 160;
                        return (
                          <g key={`g3-lobe-${i}`}>
                            <circle
                              cx={lx}
                              cy={ly}
                              r={85}
                              fill="url(#lobeGlow)"
                              filter="url(#fieldGlow)"
                            />
                            <line
                              x1={cx}
                              y1={cy}
                              x2={lx}
                              y2={ly}
                              stroke="#38bdf8"
                              strokeWidth="1.2"
                              strokeDasharray="3 3"
                              opacity="0.6"
                            />
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* Mode G6: 6 hexagonal lobes (Reference Parity State) */}
                  {geometryMode === 'G6' && (
                    <g id="mode-g6-lobes">
                      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                        const rad = (deg * Math.PI) / 180 + animTime * 0.5;
                        const lx = cx + Math.cos(rad) * 155;
                        const ly = cy + Math.sin(rad) * 155;
                        return (
                          <g key={`g6-lobe-${i}`}>
                            <circle
                              cx={lx}
                              cy={ly}
                              r={62}
                              fill="url(#lobeGlow)"
                              filter="url(#fieldGlow)"
                            />
                            <circle
                              cx={lx}
                              cy={ly}
                              r={5}
                              fill="#38bdf8"
                              opacity="0.8"
                            />
                          </g>
                        );
                      })}
                      {/* Outer Coupling Perimeter Polygon */}
                      <polygon
                        points={[0, 60, 120, 180, 240, 300]
                          .map(deg => {
                            const rad = (deg * Math.PI) / 180 + animTime * 0.5;
                            return `${(cx + Math.cos(rad) * 155).toFixed(1)},${(cy + Math.sin(rad) * 155).toFixed(1)}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                        opacity="0.7"
                      />
                    </g>
                  )}

                  {/* Mode G_inf: Continuous Annular Bessel Ring */}
                  {geometryMode === 'G_inf' && (
                    <g id="mode-ginf-lobes">
                      <circle
                        cx={cx}
                        cy={cy}
                        r={160}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="18"
                        opacity="0.3"
                        filter="url(#fieldGlow)"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={160}
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth="1.5"
                        strokeDasharray="6 3"
                        opacity="0.8"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={120}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.5"
                      />
                    </g>
                  )}

                  {/* Field Axis Indicator \hat{\Psi}_V */}
                  <line
                    x1={cx}
                    y1={cy - 190}
                    x2={cx}
                    y2={cy + 190}
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    filter="url(#fieldGlow)"
                  />
                  <polygon
                    points={`${cx},${cy - 200} ${cx - 6},${cy - 188} ${cx + 6},${cy - 188}`}
                    fill="#06b6d4"
                  />
                  <text
                    x={cx + 10}
                    y={cy - 185}
                    fill="#06b6d4"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    FIELD AXIS Ψ_V ({telemetry.axes.angleFieldToCorridorDeg.toFixed(1)}°)
                  </text>
                </g>
              )}

              {/* Physical Vessel Hull & Machinery (Rotates with Mass Axis \hat{m}) */}
              <g id="physical-vessel-group" transform={hullTransform}>
                {/* 1. Outer Annular Emitter Ribs (Separated from Hull) */}
                {[-120, -70, -20, 30, 80, 130].map((offsetY, idx) => {
                  const ry = cy + offsetY;
                  const ribWidth = 180 - Math.abs(offsetY) * 0.65;
                  return (
                    <g key={`rib-${idx}`}>
                      <ellipse
                        cx={cx}
                        cy={ry}
                        rx={ribWidth / 2}
                        ry={8}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={telemetry.isLocked ? '2' : '1'}
                        opacity={telemetry.isLocked ? 0.9 : 0.4}
                      />
                      {/* Emitter Nodes on Ribs */}
                      <circle cx={cx - ribWidth / 2} cy={ry} r={2.5} fill="#38bdf8" />
                      <circle cx={cx + ribWidth / 2} cy={ry} r={2.5} fill="#38bdf8" />
                    </g>
                  );
                })}

                {/* 2. Protective Hull: Dark Axisymmetric Spindle/Ellipsoid */}
                {/* Spindle outline: width 110, height 360 */}
                <path
                  d={`
                    M ${cx} ${cy - 180}
                    C ${cx + 70} ${cy - 100}, ${cx + 70} ${cy + 100}, ${cx} ${cy + 180}
                    C ${cx - 70} ${cy + 100}, ${cx - 70} ${cy - 100}, ${cx} ${cy - 180}
                    Z
                  `}
                  fill={cutawayMode ? 'rgba(15, 23, 42, 0.85)' : 'url(#hullGradient)'}
                  stroke="#475569"
                  strokeWidth="1.8"
                />

                {/* Hull Panel Lines */}
                <path
                  d={`M ${cx - 45} ${cy - 80} L ${cx - 45} ${cy + 80}`}
                  stroke="#334155"
                  strokeWidth="0.8"
                />
                <path
                  d={`M ${cx + 45} ${cy - 80} L ${cx + 45} ${cy + 80}`}
                  stroke="#334155"
                  strokeWidth="0.8"
                />

                {/* Cutaway Interior Layers */}
                {cutawayMode && (
                  <g id="vessel-interior-cutaway">
                    {/* Layer 3: Adaptive EM Lattice (Surrounds Field Core) */}
                    <path
                      d={`
                        M ${cx} ${cy - 150}
                        C ${cx + 46} ${cy - 70}, ${cx + 46} ${cy + 70}, ${cx} ${cy + 150}
                        C ${cx - 46} ${cy + 70}, ${cx - 46} ${cy - 70}, ${cx} ${cy - 150}
                        Z
                      `}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />

                    {/* Layer 2: Field Core (Excitation Resonator) */}
                    <path
                      d={`
                        M ${cx} ${cy - 130}
                        C ${cx + 32} ${cy - 60}, ${cx + 32} ${cy + 60}, ${cx} ${cy + 130}
                        C ${cx - 32} ${cy + 60}, ${cx - 32} ${cy - 60}, ${cx} ${cy - 130}
                        Z
                      `}
                      fill="rgba(2, 132, 199, 0.12)"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />

                    {/* Layer 1: Central Structural Spine (Crew/Payload Core) */}
                    {/* Situated at electromagnetic neutral centre where E \approx 0 */}
                    <rect
                      x={cx - 16}
                      y={cy - 100}
                      width={32}
                      height={200}
                      rx={8}
                      fill="url(#spineGradient)"
                      stroke="#e0f2fe"
                      strokeWidth="1.5"
                      filter="url(#fieldGlow)"
                    />

                    {/* Interior Spine Compartments */}
                    {/* Cockpit / Flight Deck (Top of Spine) */}
                    <rect
                      x={cx - 12}
                      y={cy - 90}
                      width={24}
                      height={26}
                      rx={4}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                    />
                    <text x={cx} y={cy - 73} fill="#bae6fd" fontSize="7" fontFamily="monospace" textAnchor="middle">
                      CREW
                    </text>

                    {/* Flight Computer & Avionics */}
                    <rect
                      x={cx - 12}
                      y={cy - 56}
                      width={24}
                      height={22}
                      rx={3}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                    />
                    <text x={cx} y={cy - 42} fill="#bae6fd" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                      AVIONICS
                    </text>

                    {/* EM Neutral Centre Label */}
                    <rect
                      x={cx - 14}
                      y={cy - 24}
                      width={28}
                      height={48}
                      rx={3}
                      fill="#0369a1"
                      stroke="#e0f2fe"
                      strokeWidth="1"
                    />
                    <text x={cx} y={cy - 8} fill="#ffffff" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      EM NEUTRAL
                    </text>
                    <text x={cx} y={cy + 2} fill="#ffffff" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      CENTRE
                    </text>
                    <text x={cx} y={cy + 14} fill="#a7f3d0" fontSize="5.5" fontFamily="monospace" textAnchor="middle">
                      |E|=0.002V/m
                    </text>

                    {/* Cryo Life Support & Payload Bay */}
                    <rect
                      x={cx - 12}
                      y={cy + 32}
                      width={24}
                      height={32}
                      rx={3}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                    />
                    <text x={cx} y={cy + 52} fill="#bae6fd" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                      PAYLOAD
                    </text>

                    {/* Conventional Fuel Cells & Power Bus */}
                    <rect
                      x={cx - 12}
                      y={cy + 70}
                      width={24}
                      height={20}
                      rx={3}
                      fill="#0f172a"
                      stroke="#f59e0b"
                      strokeWidth="0.8"
                    />
                    <text x={cx} y={cy + 83} fill="#fde68a" fontSize="6" fontFamily="monospace" textAnchor="middle">
                      POWER
                    </text>
                  </g>
                )}

                {/* Auxiliary Systems: Bow and Stern RCS Quads */}
                <g id="rcs-quads">
                  {/* Bow RCS */}
                  <polygon
                    points={`${cx - 30},${cy - 150} ${cx - 38},${cy - 153} ${cx - 30},${cy - 156}`}
                    fill={rcsTestFiring ? '#f43f5e' : '#64748b'}
                  />
                  <polygon
                    points={`${cx + 30},${cy - 150} ${cx + 38},${cy - 153} ${cx + 30},${cy - 156}`}
                    fill={rcsTestFiring ? '#f43f5e' : '#64748b'}
                  />
                  {/* Stern RCS */}
                  <polygon
                    points={`${cx - 34},${cy + 140} ${cx - 42},${cy + 143} ${cx - 34},${cy + 146}`}
                    fill={rcsTestFiring ? '#f43f5e' : '#64748b'}
                  />
                  <polygon
                    points={`${cx + 34},${cy + 140} ${cx + 42},${cy + 143} ${cx + 34},${cy + 146}`}
                    fill={rcsTestFiring ? '#f43f5e' : '#64748b'}
                  />
                </g>

                {/* Emergency Abort Engine Nozzle at Stern */}
                <polygon
                  points={`${cx - 14},${cy + 180} ${cx + 14},${cy + 180} ${cx + 10},${cy + 195} ${cx - 10},${cy + 195}`}
                  fill="#334155"
                  stroke="#64748b"
                  strokeWidth="1"
                />

                {/* Mass Axis Indicator \hat{m} */}
                {showAxesOverlay && (
                  <g id="mass-axis-marker">
                    <line
                      x1={cx}
                      y1={cy - 215}
                      x2={cx}
                      y2={cy + 215}
                      stroke="#f8fafc"
                      strokeWidth="1.8"
                      strokeDasharray="5 3"
                    />
                    <polygon
                      points={`${cx},${cy - 225} ${cx - 5},${cy - 215} ${cx + 5},${cy - 215}`}
                      fill="#f8fafc"
                    />
                    <text
                      x={cx - 110}
                      y={cy - 210}
                      fill="#f8fafc"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      MASS AXIS m̂ (HULL)
                    </text>
                  </g>
                )}
              </g>

              {/* Real-time Poynting Vector Flow Streamlines (A_in -> Coupling -> A_out) */}
              <g id="poynting-flux-streamlines" opacity="0.75">
                {[-28, -14, 0, 14, 28].map((offset, idx) => {
                  const animShift = (animTime * 140 + idx * 40) % svgHeight;
                  return (
                    <circle
                      key={`flux-particle-${idx}`}
                      cx={cx + offset}
                      cy={animShift}
                      r={2}
                      fill="#38bdf8"
                      filter="url(#fieldGlow)"
                    />
                  );
                })}
              </g>

              {/* Entrance Aperture A_in and Exit Aperture A_out Markers */}
              <g id="aperture-labels" fontFamily="monospace" fontSize="9" fontWeight="bold">
                <rect x={cx - 50} y={10} width={100} height={18} rx={3} fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                <text x={cx} y={22} fill="#10b981" textAnchor="middle">ENTRANCE A_in</text>

                <rect x={cx - 50} y={svgHeight - 28} width={100} height={18} rx={3} fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                <text x={cx} y={svgHeight - 16} fill="#38bdf8" textAnchor="middle">EXIT A_out</text>
              </g>
            </svg>

            {/* Live Vectoring HUD Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-lg font-mono text-[11px] space-y-1 shadow-lg">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800 pb-1">
                Kinematic 3-Axes Telemetry
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Corridor Axis (Ψ_R):</span>
                <span className="text-amber-400 font-bold">0.0° (Ref Rail)</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Field Axis (Ψ_V):</span>
                <span className="text-cyan-400 font-bold">{telemetry.axes.angleFieldToCorridorDeg.toFixed(1)}°</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Mass Axis (m̂):</span>
                <span className="text-slate-200 font-bold">
                  {((Math.atan2(telemetry.axes.massAxis[0], telemetry.axes.massAxis[1]) * 180) / Math.PI).toFixed(1)}°
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                <span className="text-slate-400">Field-to-Hull Tilt:</span>
                <span className="text-emerald-400 font-bold">
                  Δθ = {telemetry.axes.angleMassToFieldDeg.toFixed(1)}°
                </span>
              </div>
            </div>

            {/* Toast notice */}
            {toastMessage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sky-950/95 border border-sky-400 text-sky-200 px-4 py-2 rounded-lg font-mono text-xs shadow-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Explanatory Footer */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                Observe: During vectoring, the <strong className="text-cyan-300">cyan field axis (Ψ_V)</strong> tilts to steer momentum, while the <strong className="text-slate-200">white physical hull (m̂)</strong> stays forward!
              </span>
            </span>
            <span className="text-emerald-400 font-bold whitespace-nowrap ml-3">
              Coupling: {(telemetry.couplingCoeff * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Right 4 Cols: Operating States & Pilot Controls */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* SIX OPERATING STATES SELECTOR (Replaces Throttle) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-tight">
                  Six Operating States (Not Throttle)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                Active: {operatingState.toUpperCase()}
              </span>
            </div>

            {/* 6 State Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {(['acquire', 'match', 'lock', 'cruise', 'vector', 'release'] as CCVOperatingState[]).map(st => {
                const isCurrent = operatingState === st;
                const info = CCV_OPERATING_STATE_INFO[st];
                return (
                  <button
                    key={st}
                    id={`btn-state-${st}`}
                    onClick={() => handleSelectState(st)}
                    className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-950/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold capitalize">{info.label}</span>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 truncate">
                      {info.defaultGeometry} Mode
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected State Physics Card */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-amber-400 font-bold">Formula:</span>
                <span className="text-slate-300 font-semibold">{CCV_OPERATING_STATE_INFO[operatingState].equation}</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                {CCV_OPERATING_STATE_INFO[operatingState].summary}
              </p>
              <div className="text-slate-500 text-[9.5px] border-t border-slate-850 pt-1">
                <strong className="text-slate-400">Action:</strong> {CCV_OPERATING_STATE_INFO[operatingState].actionRequired}
              </div>
            </div>

            {/* Geometry Mode Toggle for Active State */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-tight block mb-1.5">
                Lattice Mode State: Ψ_vessel = Σ a_k(t) ψ_k(r)
              </label>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                {(['G3', 'G6', 'G_inf'] as CCVModeGeometry[]).map(m => (
                  <button
                    key={m}
                    id={`btn-mode-geom-${m}`}
                    onClick={() => setGeometryMode(m)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      geometryMode === m
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m === 'G3' ? 'G₃ (Vector)' : m === 'G6' ? 'G₆ (Parity)' : 'G_∞ (Bessel)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PILOT COMMAND DECK: Destination + Authority + Envelope */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-tight">
                  Pilot Command Deck
                </h3>
              </div>
              <button
                id="btn-flight-computer-solve"
                onClick={handleRunFlightComputerOptimization}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-mono font-medium transition-colors"
                title="Solve for optimal mode coefficients a*(t) = arg max J"
              >
                <Cpu className="w-3 h-3" />
                <span>Auto-Solve a*(t)</span>
              </button>
            </div>

            {/* 1. Destination Vector Slider */}
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Destination Vector (θ_D):</span>
                <span className="text-sky-300 font-bold">
                  {destVectorAngle > 0 ? `+${destVectorAngle}° Right` : destVectorAngle < 0 ? `${destVectorAngle}° Left` : '0° Bore-Sight'}
                </span>
              </div>
              <input
                id="slider-dest-vector"
                type="range"
                min="-45"
                max="45"
                step="1"
                value={destVectorAngle}
                onChange={e => {
                  setDestVectorAngle(parseInt(e.target.value, 10));
                  if (operatingState !== 'vector' && Math.abs(parseInt(e.target.value, 10)) > 5) {
                    setOperatingState('vector');
                  }
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                <span>-45° Port</span>
                <span>0° Cruise</span>
                <span>+45° Starboard</span>
              </div>
            </div>

            {/* 2. Coupling Authority Slider */}
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Coupling Authority Gain:</span>
                <span className="text-emerald-400 font-bold">
                  {(couplingAuthority * 100).toFixed(0)}%
                </span>
              </div>
              <input
                id="slider-coupling-authority"
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={couplingAuthority}
                onChange={e => setCouplingAuthority(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                Controls reactive impedance coupling across aperture A_in into the medium.
              </span>
            </div>

            {/* 3. Stability Envelope Selector */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-tight block mb-1">
                Stability Envelope (Torque Margin)
              </label>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                {(['tight', 'nominal', 'wide'] as StabilityEnvelopeLevel[]).map(lvl => (
                  <button
                    key={lvl}
                    id={`btn-stability-${lvl}`}
                    onClick={() => setStabilityEnvelope(lvl)}
                    className={`py-1 rounded border text-center transition-all ${
                      stabilityEnvelope === lvl
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="capitalize">{lvl}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row: 4 Concentric Layers Inspector + Real-time Telemetry + Auxiliary Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Cols: Cross-Sectional Architecture (Quiet Human Core + Violent EM Exterior) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-tight">
                Section: Quiet Human Core ⊂ Violent Exterior
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              142 dB Isolation
            </span>
          </div>

          {/* 4 Layers Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 font-mono text-[10px]">
            {CCV_CONCENTRIC_LAYERS.map(lay => {
              const isSel = selectedLayerId === lay.id;
              return (
                <button
                  key={lay.id}
                  id={`btn-layer-${lay.id}`}
                  onClick={() => setSelectedLayerId(lay.id)}
                  className={`p-1.5 rounded border text-center transition-all ${
                    isSel
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lay.id === 'spine' ? '1. Spine Core' : lay.id === 'field_core' ? '2. Field Core' : lay.id === 'adaptive_lattice' ? '3. Lattice' : '4. Outer Hull'}
                </button>
              );
            })}
          </div>

          {/* Layer Detail Card */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-bold">{selectedLayerDef.name}</span>
              <span className="text-sky-400 font-bold">R = {selectedLayerDef.radiusMeters}m</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {selectedLayerDef.description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[9.5px]">Field Intensity |E|:</span>
                <span className={selectedLayerDef.id === 'spine' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedLayerDef.fieldIntensityScaled < 1
                    ? `${(selectedLayerDef.fieldIntensityScaled * 1000).toFixed(0)} mV/m (Zero-Flux)`
                    : `${selectedLayerDef.fieldIntensityScaled} kV/m`}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[9.5px]">Shielding Attenuation:</span>
                <span className="text-sky-300 font-bold">
                  {selectedLayerDef.safetyMarginDb > 0 ? `${selectedLayerDef.safetyMarginDb} dB Atten.` : 'Exterior Shell'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block mb-1">Subsystem Hardware:</span>
              <div className="flex flex-wrap gap-1">
                {selectedLayerDef.components.map((comp, idx) => (
                  <span
                    key={idx}
                    className="text-[9.5px] bg-slate-900 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center 4 Cols: Live Telemetry & Dynamics */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-tight">
                Live Dynamics & Forces
              </h3>
            </div>
            <span className="text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 rounded">
              v = {telemetry.corridorVelocityKmS.toFixed(0)} km/s
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-slate-500 block text-[10px]">Longitudinal Thrust F_||:</span>
              <span className="text-emerald-400 font-bold text-sm">
                {(telemetry.longitudinalThrustKn / 1000).toFixed(2)} MN
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">Along corridor axis</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-slate-500 block text-[10px]">Transverse Force F_⊥:</span>
              <span className="text-amber-400 font-bold text-sm">
                {(telemetry.transverseForceKn / 1000).toFixed(2)} MN
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">Maneuvering vector</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-slate-500 block text-[10px]">Induced Torque τ:</span>
              <span className="text-sky-300 font-bold text-sm">
                {telemetry.inducedTorqueKnm.toFixed(1)} kN·m
              </span>
              <span className="text-[9.5px] text-emerald-400 block mt-0.5">Low torque bias</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-slate-500 block text-[10px]">Poynting Flux (S):</span>
              <span className="text-purple-300 font-bold text-sm">
                {telemetry.poyntingPowerFluxMw.toFixed(1)} MW
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">Coupling throughput</span>
            </div>
          </div>

          {/* Impedance & Lock Diagnostics */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vessel Impedance Z_V:</span>
              <span className="text-slate-200 font-bold">{telemetry.vesselImpedanceOhm.toFixed(1)} Ω</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Corridor Medium Z_R:</span>
              <span className="text-amber-400 font-bold">{telemetry.corridorImpedanceOhm.toFixed(1)} Ω</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-850">
              <span className="text-slate-400">Coupling Lock C_pair:</span>
              <span className={`font-bold ${telemetry.isLocked ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry.couplingCoeff.toFixed(2)} / {telemetry.criticalCouplingThreshold.toFixed(2)} ({telemetry.isLocked ? 'LOCKED' : 'SLIPPAGE'})
              </span>
            </div>
          </div>
        </div>

        {/* Right 3 Cols: Auxiliary Propulsion & Safety */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-tight">
                Auxiliary Systems
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Non-Corridor Drive</span>
          </div>

          {/* RCS Attitude Control */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">RCS Attitude Control:</span>
              <span className={`text-[10px] px-1.5 rounded uppercase font-bold ${
                rcsTestFiring ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {rcsTestFiring ? 'FIRING' : telemetry.auxiliary.rcsStatus}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Propellant:</span>
              <span className="text-emerald-400 font-bold">{telemetry.auxiliary.rcsFuelPct}%</span>
            </div>
            <button
              id="btn-test-rcs"
              onClick={() => {
                setRcsTestFiring(true);
                setTimeout(() => setRcsTestFiring(false), 1200);
              }}
              className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
            >
              Pulse Bow/Stern RCS Quads
            </button>
          </div>

          {/* Independent Emergency Propulsion */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">Emergency Abort Drive:</span>
              <span className={`text-[10px] px-1.5 rounded uppercase font-bold ${
                emergencyArmed ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-slate-800 text-slate-300'
              }`}>
                {emergencyArmed ? 'ARMED' : 'STANDBY'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Available Δv:</span>
              <span className="text-sky-300 font-bold">{telemetry.auxiliary.emergencyDeltaVMps} m/s</span>
            </div>
            <button
              id="btn-arm-emergency"
              onClick={() => setEmergencyArmed(!emergencyArmed)}
              className={`w-full py-1 rounded border text-[10px] font-bold transition-colors cursor-pointer ${
                emergencyArmed
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {emergencyArmed ? 'Disarm Abort Thruster' : 'Arm Emergency Drive'}
            </button>
          </div>

          {/* Crew Compartment Flux Dam Protection */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold">Flux Dam Isolation:</span>
              <span className="text-emerald-400 font-bold">{telemetry.auxiliary.spineFluxDamIsolation} dB</span>
            </div>
            <span className="block text-[9px] text-slate-500">
              Superconducting perimeter ensures human habitat remains within bio-compatible EM background (&lt;0.05 V/m).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
