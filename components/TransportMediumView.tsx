'use client';

import React, { useState, useMemo } from 'react';
import {
  DEFAULT_RAILS,
  DEFAULT_JUNCTIONS,
  DEFAULT_VESSELS,
  RailSegment,
  VesselConfiguration,
  computeSystemPairDynamics,
  SystemDynamicPairResult,
} from '@/lib/transport-medium-engine';
import {
  Network,
  Layers,
  Cpu,
  Gauge,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import ProvenanceBadge from './ProvenanceBadge';

export const TransportMediumView: React.FC = () => {
  // Civilization Evolution Paradigm Phase
  const [civilizationPhase, setCivilizationPhase] = useState<
    'NATURAL_TOPOLOGY' | 'HYBRID_CANAL' | 'ENGINEERED_GRID'
  >('ENGINEERED_GRID');

  // Selected Rail and Vessel
  const [selectedRailId, setSelectedRailId] = useState<string>('rail-3');
  const [selectedVesselId, setSelectedVesselId] = useState<string>('vessel-standard-freight');

  // Custom Tweakers
  const [customRailFieldT, setCustomRailFieldT] = useState<number>(11.2);
  const [customPhaseCoherence, setCustomPhaseCoherence] = useState<number>(0.99);
  const [customVesselImpedance, setCustomVesselImpedance] = useState<number>(378.5);

  // Active Rail and Vessel Objects
  const activeRail: RailSegment = useMemo(() => {
    const r = DEFAULT_RAILS.find(item => item.id === selectedRailId) || DEFAULT_RAILS[0];
    return {
      ...r,
      corridorFieldStrengthTesla: customRailFieldT,
      phaseCoherenceRatio: customPhaseCoherence,
    };
  }, [selectedRailId, customRailFieldT, customPhaseCoherence]);

  const activeVessel: VesselConfiguration = useMemo(() => {
    const v = DEFAULT_VESSELS.find(item => item.id === selectedVesselId) || DEFAULT_VESSELS[0];
    return {
      ...v,
      impedanceZ: customVesselImpedance,
    };
  }, [selectedVesselId, customVesselImpedance]);

  // Synchronize custom inputs on preset select
  const handleRailSelect = (rId: string) => {
    setSelectedRailId(rId);
    const r = DEFAULT_RAILS.find(item => item.id === rId);
    if (r) {
      setCustomRailFieldT(r.corridorFieldStrengthTesla);
      setCustomPhaseCoherence(r.phaseCoherenceRatio);
    }
  };

  const handleVesselSelect = (vId: string) => {
    setSelectedVesselId(vId);
    const v = DEFAULT_VESSELS.find(item => item.id === vId);
    if (v) {
      setCustomVesselImpedance(v.impedanceZ);
    }
  };

  // Compute Live System Pair Dynamics: T = R \oplus V
  const dynamics: SystemDynamicPairResult = useMemo(() => {
    return computeSystemPairDynamics(activeRail, activeVessel);
  }, [activeRail, activeVessel]);

  // Contrast Matrix: Compare Primitive vs Advanced Vessel on Natural vs Engineered Rails
  const comparativePairs = useMemo(() => {
    const naturalRail = DEFAULT_RAILS.find(r => r.type === 'NATURAL_STREAM') || DEFAULT_RAILS[1];
    const engineeredRail = DEFAULT_RAILS.find(r => r.type === 'SYNCHRONOUS_EXPRESS') || DEFAULT_RAILS[2];
    const primitiveVessel = DEFAULT_VESSELS.find(v => v.classType === 'PIONEER_SURVEY') || DEFAULT_VESSELS[0];
    const advancedVessel = DEFAULT_VESSELS.find(v => v.classType === 'EXPRESS_PACKET') || DEFAULT_VESSELS[2];

    return [
      {
        scenario: 'Advanced Vessel on Natural Wild Corridor',
        tag: 'V_adv ⊕ R_nat',
        rail: naturalRail.name,
        vessel: advancedVessel.name,
        result: computeSystemPairDynamics(naturalRail, advancedVessel),
        note: 'Stifled by wild turbulence & low rail capacity',
      },
      {
        scenario: 'Primitive Vessel on Civilisation Engineered Trunk',
        tag: 'V_prim ⊕ R_eng',
        rail: engineeredRail.name,
        vessel: primitiveVessel.name,
        result: computeSystemPairDynamics(engineeredRail, primitiveVessel),
        note: 'Outperforms advanced craft due to superior rail substrate!',
      },
      {
        scenario: 'Resonant Coupling (Optimised Rolling Stock + Superconducting Rail)',
        tag: 'V_opt ⊕ R_opt',
        rail: engineeredRail.name,
        vessel: advancedVessel.name,
        result: computeSystemPairDynamics(engineeredRail, advancedVessel),
        note: 'Harmonic lock: peak velocity and near-zero reflection loss',
      },
    ];
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100 font-sans">
      {/* Doctrine Banner: "Own the Rails, Then Optimise the Vehicle" */}
      <div className="p-5 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs">
            <Network className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wider">SOVEREIGN TRANSPORT MEDIUM ARCHITECTURE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
            &ldquo;Own the Rails, Then Optimise the Vehicle&rdquo;
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed font-mono">
            Propulsion systems do not scale civilisations—transportation mediums do. The fundamental system dynamic is{' '}
            <strong className="text-amber-300 font-mono">𝒯 = ℛ ⊕ 𝒱</strong>, where velocity and throughput are properties of the{' '}
            <strong className="text-cyan-300">Ship–Rail Pair</strong>, not the isolated vehicle.
          </p>
        </div>

        {/* System Equation Badge */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-center shrink-0 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">CIVILISATION EQUATION</div>
          <div className="text-base font-bold text-amber-300 tracking-wider">
            𝒯 = ℛ ⊕ 𝒱
          </div>
          <div className="text-[10px] text-slate-400">
            v_max = f(B_rail, σ_phase, Z_match)
          </div>
        </div>
      </div>

      {/* Epoch Paradigm Selector: Nature Provides Path -> Civilisation Provides Path */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 uppercase font-semibold text-[11px] flex items-center space-x-2">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>INFRASTRUCTURE EVOLUTIONARY TRAJECTORY</span>
          </span>
          <span className="text-[10px] text-slate-500">
            {civilizationPhase === 'NATURAL_TOPOLOGY' && 'Phase I: Hunting Natural Ambient Currents'}
            {civilizationPhase === 'HYBRID_CANAL' && 'Phase II: Dredging & Magnetic Channeling'}
            {civilizationPhase === 'ENGINEERED_GRID' && 'Phase III: Full Sovereign Electromagnetic Grid'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setCivilizationPhase('NATURAL_TOPOLOGY')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              civilizationPhase === 'NATURAL_TOPOLOGY'
                ? 'bg-slate-950 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="text-amber-400 font-bold text-xs mb-1">1. Nature Provides Path</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Vessels seek wild solar winds and heliospheric seams. Unstable, turbulent, low-throughput; ships require massive independent fuel reserves.
            </p>
          </button>

          <button
            onClick={() => setCivilizationPhase('HYBRID_CANAL')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              civilizationPhase === 'HYBRID_CANAL'
                ? 'bg-slate-950 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="text-cyan-400 font-bold text-xs mb-1">2. Dredged Canals & Stators</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Placement of plasma pinch relays and Lagrange switching buoys. Corridors stabilized with localized RF injection arrays.
            </p>
          </button>

          <button
            onClick={() => setCivilizationPhase('ENGINEERED_GRID')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              civilizationPhase === 'ENGINEERED_GRID'
                ? 'bg-slate-950 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="text-emerald-400 font-bold text-xs mb-1">3. Sovereign Field Grid</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Civilisation engineers the electromagnetic medium: continuous superconducting waveguides, phase synchronization, and terminal harbours.
            </p>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Network Map & Dynamic Pair Coupling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive System Rail Network Diagram (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SOVEREIGN CORRIDOR MAP • HARBOURS & JUNCTIONS</span>
            </span>
            <span className="text-slate-400">
              Active Vessels: <strong className="text-cyan-300">40 in transit</strong>
            </span>
          </div>

          {/* SVG Map of the Electromagnetic Rail Grid */}
          <div className="relative w-full max-w-[620px] aspect-[16/10] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
            <svg viewBox="0 0 850 480" className="w-full h-full select-none">
              <defs>
                <pattern id="gridSub" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <rect width="850" height="480" fill="url(#gridSub)" />

              {/* Draw Rail Segments */}
              {DEFAULT_RAILS.map((rail) => {
                const orig = DEFAULT_JUNCTIONS.find(j => j.id === rail.originNode);
                const dest = DEFAULT_JUNCTIONS.find(j => j.id === rail.destinationNode);
                if (!orig || !dest) return null;

                const isSelected = rail.id === selectedRailId;
                const strokeColor =
                  rail.type === 'SYNCHRONOUS_EXPRESS'
                    ? '#10b981'
                    : rail.type === 'SUPERCONDUCTING_TRUNK'
                    ? '#06b6d4'
                    : rail.type === 'CONFINED_CHANNEL'
                    ? '#38bdf8'
                    : '#f59e0b';

                return (
                  <g
                    key={rail.id}
                    onClick={() => handleRailSelect(rail.id)}
                    className="cursor-pointer group"
                  >
                    {/* Background wide line for easy click */}
                    <line
                      x1={orig.coordinates.x}
                      y1={orig.coordinates.y}
                      x2={dest.coordinates.x}
                      y2={dest.coordinates.y}
                      stroke="transparent"
                      strokeWidth="24"
                    />
                    {/* Corridor Field Aura */}
                    <line
                      x1={orig.coordinates.x}
                      y1={orig.coordinates.y}
                      x2={dest.coordinates.x}
                      y2={dest.coordinates.y}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 6 : 3}
                      strokeOpacity={isSelected ? 0.9 : 0.4}
                      strokeDasharray={rail.type === 'NATURAL_STREAM' ? '6 4' : undefined}
                      filter={isSelected ? 'url(#corridorGlow)' : undefined}
                    />
                    {/* Animated Flux Pulses */}
                    <circle r={isSelected ? 5 : 3.5} fill={strokeColor}>
                      <animateMotion
                        path={`M ${orig.coordinates.x} ${orig.coordinates.y} L ${dest.coordinates.x} ${dest.coordinates.y}`}
                        dur={`${Math.max(1.8, 8 - rail.corridorFieldStrengthTesla * 0.5)}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Rail Label */}
                    <text
                      x={(orig.coordinates.x + dest.coordinates.x) / 2}
                      y={(orig.coordinates.y + dest.coordinates.y) / 2 - 8}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#94a3b8'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {rail.id.toUpperCase()} ({rail.corridorFieldStrengthTesla}T)
                    </text>
                  </g>
                );
              })}

              {/* Draw Harbours and Junctions */}
              {DEFAULT_JUNCTIONS.map((junc) => {
                const isHub = junc.archetype === 'TERMINAL_HARBOUR';
                const isHex = junc.archetype === 'HEXAGONAL_SWITCHING_JUNCTION';

                return (
                  <g key={junc.id} className="cursor-pointer">
                    {/* Aura */}
                    <circle
                      cx={junc.coordinates.x}
                      cy={junc.coordinates.y}
                      r={isHub ? 22 : 16}
                      fill="#0f172a"
                      stroke={isHub ? '#f59e0b' : isHex ? '#10b981' : '#38bdf8'}
                      strokeWidth="2"
                    />
                    {/* Inner Core */}
                    <circle
                      cx={junc.coordinates.x}
                      cy={junc.coordinates.y}
                      r={isHub ? 8 : 5}
                      fill={isHub ? '#fbbf24' : isHex ? '#34d399' : '#38bdf8'}
                    />
                    {/* Junction Label */}
                    <text
                      x={junc.coordinates.x}
                      y={junc.coordinates.y + 26}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {junc.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Overlay Map Badge */}
            <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-400">
              CLICK ANY CORRIDOR TO INSPECT RAIL SPEC
            </div>
          </div>

          {/* Quick Rail Selector Chips */}
          <div className="w-full flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800 text-xs font-mono">
            <span className="text-slate-500 mr-2 text-[10px]">CORRIDOR SELECTION:</span>
            {DEFAULT_RAILS.map(rail => (
              <button
                key={rail.id}
                onClick={() => handleRailSelect(rail.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedRailId === rail.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {rail.id.toUpperCase()} • {rail.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: The Ship-Rail Pairing Solver (T = R ⊕ V) (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Pair Evaluation Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>SHIP–RAIL PAIRING SOLVER</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  dynamics.operationalRegime === 'RESONANT_LOCK'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : dynamics.operationalRegime === 'CAVITATION_RISK'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {dynamics.operationalRegime}
              </span>
            </div>

            {/* Big Speed Output: v_max = f(Rail, Vessel) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-center">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  MAX SYSTEM VELOCITY (v_max)
                </span>
                <ProvenanceBadge tag="DERIVED" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                {(dynamics.maxAttainableVelocityC * 100).toFixed(2)}% <span className="text-lg font-mono text-slate-400">c</span>
              </div>
              <div className="text-[11px] text-slate-400">
                ≈ {(dynamics.maxAttainableVelocityC * 299792).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/s
              </div>
            </div>

            {/* Telemetry Metrics Grid with Epistemic Badges */}
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 block">COUPLING PRODUCT (η)</span>
                  <ProvenanceBadge tag="DERIVED" />
                </div>
                <span className="text-cyan-400 font-bold text-sm">
                  {(dynamics.systemCouplingProduct * 100).toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Z_match × σ_phase</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 block">EFFECTIVE THRUST</span>
                  <ProvenanceBadge tag="DERIVED" />
                </div>
                <span className="text-amber-400 font-bold text-sm">
                  {dynamics.effectiveThrustKiloNewtons.toFixed(1)} kN
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Coupled Rail Momentum</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 block">RETURN LOSS (SWR)</span>
                  <ProvenanceBadge tag="DERIVED" />
                </div>
                <span className="text-slate-200 font-bold text-sm">
                  {dynamics.impedanceMismatchDb.toFixed(1)} dB
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  ΔZ = {Math.abs(activeVessel.impedanceZ - activeRail.railImpedanceZ0).toFixed(1)} Ω
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 block">DISSIPATIVE LOSS</span>
                  <ProvenanceBadge tag="DERIVED" />
                </div>
                <span className="text-rose-400 font-bold text-sm">
                  {dynamics.energyDissipationLossMw.toFixed(0)} MW
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Uncoupled Radiation</span>
              </div>
            </div>

            {/* Vessel Selector Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                SELECT VESSEL / ROLLING STOCK:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {DEFAULT_VESSELS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleVesselSelect(v.id)}
                    className={`p-2 rounded text-left transition-colors border cursor-pointer ${
                      selectedVesselId === v.id
                        ? 'bg-slate-800 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold truncate">{v.name.split(' ')[0]}</div>
                    <div className="text-[9px] text-slate-500">{v.classType.replace('_', ' ')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Interactive Sliders for Rail & Vessel Tuning */}
            <div className="space-y-3 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Rail Field Strength (Tesla):</span>
                  <span className="text-amber-400 font-bold">{customRailFieldT.toFixed(1)} T</span>
                </div>
                <input
                  id="input-custom-rail-field"
                  suppressHydrationWarning
                  type="range"
                  min="0.5"
                  max="15.0"
                  step="0.1"
                  value={customRailFieldT}
                  onChange={e => setCustomRailFieldT(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-850 rounded"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Rail Phase Coherence (σ_phase):</span>
                  <span className="text-cyan-400 font-bold">{(customPhaseCoherence * 100).toFixed(1)}%</span>
                </div>
                <input
                  id="input-custom-phase-coherence"
                  suppressHydrationWarning
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.005"
                  value={customPhaseCoherence}
                  onChange={e => setCustomPhaseCoherence(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-850 rounded"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Vessel Impedance (Z_vessel vs 377Ω):</span>
                  <span className="text-emerald-400 font-bold">{customVesselImpedance.toFixed(1)} Ω</span>
                </div>
                <input
                  id="input-custom-vessel-impedance"
                  suppressHydrationWarning
                  type="range"
                  min="360"
                  max="410"
                  step="0.5"
                  value={customVesselImpedance}
                  onChange={e => setCustomVesselImpedance(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-850 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Crucial Demonstration: Primitive Vessel on Advanced Rail vs Advanced Vessel on Natural Rail */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
          <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>CRITICAL DOCTRINE PROOF: THE SHIP–RAIL PAIR PARADOX</span>
          </span>
          <span className="text-slate-500">Infrastructure determines capability ceiling</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparativePairs.map((pair, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border text-xs font-mono space-y-3 ${
                idx === 1
                  ? 'bg-amber-950/20 border-amber-600/80 shadow-lg'
                  : idx === 2
                  ? 'bg-emerald-950/20 border-emerald-600/80 shadow-lg'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="font-bold text-slate-100">{pair.tag}</span>
                <span className="text-[10px] text-slate-500">Pair #{idx + 1}</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-200">
                {pair.scenario}
              </div>
              <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Rail:</span>
                  <span className="text-slate-200 truncate max-w-[160px]">{pair.rail}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Vessel:</span>
                  <span className="text-slate-200 truncate max-w-[160px]">{pair.vessel}</span>
                </div>
              </div>
              {/* Realized Speed Comparison */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-slate-500 uppercase">Max Velocity:</span>
                <span
                  className={`text-base font-bold ${
                    idx === 1 ? 'text-amber-400' : idx === 2 ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {(pair.result.maxAttainableVelocityC * 100).toFixed(2)}% c
                </span>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60 leading-relaxed">
                &ldquo;{pair.note}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Domain Architectural Matrix: Rail Layer vs Vessel Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rail Layer Domain */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center space-x-2 text-amber-400 border-b border-slate-800 pb-2">
            <Layers className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">DOMAIN 1: THE RAIL LAYER (ℛ)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            The external field substrate constructed and sustained across interplanetary space. The vessel carries none of this infrastructure.
          </p>
          <ul className="space-y-2 text-slate-300 text-[11px]">
            <li className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span>Field Generators & Stators</span>
              <span className="text-amber-400 font-bold">4.8T – 12.5T</span>
            </li>
            <li className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span>Phased Plasma Channels</span>
              <span className="text-cyan-400 font-bold">Collimated Pinches</span>
            </li>
            <li className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span>Hexagonal Switching Junctions</span>
              <span className="text-emerald-400 font-bold">G₆ Topology Hubs</span>
            </li>
            <li className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span>Terminal Harbours & Deceleration Siphons</span>
              <span className="text-slate-400 font-bold">Kuiper & Sol Buffers</span>
            </li>
          </ul>
        </div>

        {/* Vessel Layer Domain */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center space-x-2 text-cyan-400 border-b border-slate-800 pb-2">
            <Cpu className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">DOMAIN 2: THE VESSEL LAYER (𝒱)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            The rolling stock architecture. Lightweight, compatible machines optimized for coupling to the pre-existing field infrastructure.
          </p>
          <ul className="space-y-2 text-slate-300 text-[11px]">
            <li className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span>Impedance Matching Stacks</span>
              <span className="text-emerald-400 font-bold">Z_vessel → 376.73 Ω</span>
            </li>
            <li className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span>8-Eigenmode Synthesis Controllers</span>
              <span className="text-cyan-400 font-bold">Ψ = ∑ a_k ψ_k</span>
            </li>
            <li className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span>Phase-Lock Carrier Trackers</span>
              <span className="text-amber-400 font-bold">Narrowband Injection</span>
            </li>
            <li className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span>Decoupling & Vectoring Nozzles</span>
              <span className="text-slate-400 font-bold">Γ_δ Transverse Bending</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TransportMediumView;
