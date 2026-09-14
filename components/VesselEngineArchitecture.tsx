'use client';

import React, { useState, useMemo } from 'react';
import {
  SimulationParameters,
  VesselOperationalMode,
  HullEigenmodeId,
  HULL_EIGENMODES,
  COSMIC_FLUX_CORRIDORS,
  FluxCorridorId,
  CRUISE_GAMMA_0_PRESET,
  VECTORING_GAMMA_DELTA_PRESET,
  TURBULENCE_SHIELD_PRESET,
  DEFAULT_EIGENMODE_WEIGHTS,
  calculateVesselEngineMetrics,
  computeOptimalFlightComputerWeights,
  NAUTICAL_FLIGHT_SEQUENCE,
  NauticalFlightStage,
  NauticalStageInfo,
  GEOMETRY_DEFINITIONS,
  GeometryType,
} from '@/lib/physics-engine';
import {
  Zap,
  Compass,
  Sliders,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  Anchor,
  Wind,
  Flame,
  Radio,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Navigation,
  Crosshair,
  Gauge,
  Cpu,
  AlertTriangle,
  Ship,
  TrendingUp,
} from 'lucide-react';
import ProvenanceBadge from './ProvenanceBadge';
import EnergyAccountingPanel from './EnergyAccountingPanel';
import { getGeometryNodes, calculateNodalDistribution } from '@/lib/physics-engine';

interface VesselEngineArchitectureProps {
  params: SimulationParameters;
  onUpdateParams: (updates: Partial<SimulationParameters>) => void;
  onSelectGeometry?: (geom: GeometryType) => void;
  onNavigateToWorkbench?: () => void;
  onOpenWorkbench?: () => void;
  onOpenAiSynthesis?: () => void;
}

export default function VesselEngineArchitecture({
  params,
  onUpdateParams,
  onSelectGeometry,
  onNavigateToWorkbench,
  onOpenWorkbench,
  onOpenAiSynthesis,
}: VesselEngineArchitectureProps) {
  const handleGoWorkbench = onOpenWorkbench || onNavigateToWorkbench;
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'eigenmodes' | 'nautical' | 'corridors' | 'codex'>('cockpit');
  const [selectedStageId, setSelectedStageId] = useState<NauticalFlightStage>('cruise_gamma_0');
  const [flightNotice, setFlightNotice] = useState<string | null>(null);

  const currentWeights = params.eigenmodeWeights || DEFAULT_EIGENMODE_WEIGHTS;
  const currentMode = params.vesselMode || 'cruise_gamma_0';
  const currentCorridorId = params.activeCorridor || 'corridor_solar_wind';

  // Compute live engine metrics
  const engineMetrics = useMemo(() => {
    return calculateVesselEngineMetrics(params);
  }, [params]);

  const activeCorridor = engineMetrics.activeCorridor;

  const nodesForLedger = useMemo(() => getGeometryNodes(params.geometry, params.radius), [params.geometry, params.radius]);
  const nodalForLedger = useMemo(() => calculateNodalDistribution(params, nodesForLedger, 0), [params, nodesForLedger]);
  const energyLedger = nodalForLedger.energyLedger;

  // Flight Computer Solver: a*(t) = arg max J(...)
  const handleRunFlightComputer = () => {
    const optimal = computeOptimalFlightComputerWeights(
      currentMode,
      currentCorridorId,
      engineMetrics.threadOffsetDistance
    );
    onUpdateParams({
      eigenmodeWeights: optimal,
    });
    setFlightNotice('Flight Computer: Optimal eigenmode state vector a*(t) = arg max J(...) applied.');
    setTimeout(() => setFlightNotice(null), 3500);
  };

  // Nautical Stage Selection Handler
  const handleEngageNauticalStage = (stage: NauticalStageInfo) => {
    setSelectedStageId(stage.id);
    onUpdateParams({
      vesselMode: stage.recommendedMode,
      sourceOffsetX: stage.targetOffsetX,
      sourceOffsetY: stage.targetOffsetY,
      eigenmodeWeights: { ...stage.eigenmodeDistribution },
    });
    setFlightNotice(`Nautical Flight Stage Engaged: Stage ${stage.stageIndex} — ${stage.title}`);
    setTimeout(() => setFlightNotice(null), 3500);
  };

  // Mode handlers
  const handleEngageCruise = () => {
    onUpdateParams({
      vesselMode: 'cruise_gamma_0',
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      motionPreset: 'static',
      eigenmodeWeights: { ...CRUISE_GAMMA_0_PRESET },
      geometry: 'G6',
    });
  };

  const handleEngageVectoring = (dx: number = 32, dy: number = -24) => {
    onUpdateParams({
      vesselMode: 'vectoring_gamma_delta',
      sourceOffsetX: dx,
      sourceOffsetY: dy,
      motionPreset: 'static',
      eigenmodeWeights: { ...VECTORING_GAMMA_DELTA_PRESET },
    });
  };

  const handleUpdateEigenmodeWeight = (modeId: HullEigenmodeId, value: number) => {
    const updated = { ...currentWeights, [modeId]: value };
    onUpdateParams({ eigenmodeWeights: updated });
  };

  const handleApplyPreset = (preset: Record<HullEigenmodeId, number>, mode?: VesselOperationalMode) => {
    onUpdateParams({
      eigenmodeWeights: { ...preset },
      ...(mode ? { vesselMode: mode } : {}),
      ...(mode === 'cruise_gamma_0' ? { sourceOffsetX: 0, sourceOffsetY: 0 } : {}),
    });
  };

  const handleSelectCorridor = (corridorId: FluxCorridorId) => {
    const corridor = COSMIC_FLUX_CORRIDORS[corridorId];
    onUpdateParams({
      activeCorridor: corridorId,
      sourceFrequency: corridor.carrierFrequencyRad,
    });
  };

  // Generate Logbook / Story Markdown
  const handleCopyLogbook = () => {
    const md = `# VESSEL AS THE ENGINE: ELECTROMAGNETIC COUPLING LOGBOOK
**Operational Paradigm**: \`vehicle is the coupling geometry; environment is the energy medium\`
**State**: ${engineMetrics.mode === 'cruise_gamma_0' ? 'Γ₀ (Thread-Centred / Cruise)' : 'Γ_δ (Thread-Offset / Vectoring)'}
**Nautical Stage**: Stage ${engineMetrics.activeNauticalStage.stageIndex}: ${engineMetrics.activeNauticalStage.title}
**Corridor**: ${activeCorridor.name} (${activeCorridor.type})
**Coupling Status**: ${engineMetrics.isCoupled ? 'LOCKED' : 'DECOUPLED'} (Index: ${engineMetrics.couplingIndex.toFixed(1)}%)

## 1. Physical Principle & Momentum Exchange
"The vessel does not carry propulsion through the universe. It temporarily becomes part of the universe's electromagnetic transport system."
"They don’t cross distance in the conventional sense. They learn how to join the field that already connects it."
- Momentum Exchange Rule: Δp_vessel = -Δp_corridor
- Boundary Condition: Σ_vessel ⊂ Σ_field
- Coupled Field Solution: Ψ_field+vessel ≠ Ψ_field + Ψ_vessel
- Energy Loop: environmental field → vessel geometry → field redistribution → momentum exchange → motion

## 2. Telemetry & Impedance Diagnostics
- Net Field-Coupled Thrust: ${engineMetrics.netThrustForceN.toFixed(2)} mN
- Vector Components: Fx=${engineMetrics.thrustVector.fx.toFixed(2)}, Fy=${engineMetrics.thrustVector.fy.toFixed(2)}, Fz=${engineMetrics.thrustVector.fz.toFixed(2)}
- Thread Deflection (Δr): ${engineMetrics.threadOffsetDistance.toFixed(1)} px at ${engineMetrics.threadDeflectionAngleDeg.toFixed(1)}°
- Maxwell Stress Steering Torque: ${engineMetrics.maxwellTorqueNm.toFixed(2)} N·m
- Hull Wave Impedance Z_v: ${engineMetrics.effectiveImpedance.toFixed(1)} Ω (Corridor: ${activeCorridor.waveImpedanceOhm} Ω)
- Impedance Mismatch |ΔZ|: ${engineMetrics.deltaZAbs.toFixed(1)} Ω (SWR: ${engineMetrics.standingWaveRatio.toFixed(2)}, Reflection Coeff Γ_Z: ${engineMetrics.impedanceMismatchCoeff.toFixed(3)})
- Ejection Hazard Level: ${engineMetrics.ejectionHazardLevel}
- Radiation Loss: ${engineMetrics.radiationLossPower.toFixed(2)} W / ${params.sourcePower} W input

## 3. Active Hull Eigenmodes (Ψ = ∑ a_k ψ_k)
${(Object.keys(HULL_EIGENMODES) as HullEigenmodeId[]).map(id => {
  const m = HULL_EIGENMODES[id];
  return `- ${m.symbol} ${m.name}: a_${m.id.split('_')[1]}=${(currentWeights[id] || 0).toFixed(2)} (${m.role})`;
}).join('\n')}

---
*Generated by Electromagnetic Poynting Field Architecture • AI Studio*`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div id="vessel-engine-architecture" className="flex flex-col w-full h-full bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5 overflow-y-auto space-y-5">
      {/* Top Banner: Core Sci-Fi Conceptual Inversion */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold text-sm">
              Ψ
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span>Phase 2 Propulsion Doctrine</span>
                <span className="text-slate-600">•</span>
                <span className="text-sky-400">The Vessel Is The Engine</span>
              </span>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white">
                Cosmic Flux Corridor Coupling & Field-Coupled Thrust
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              id="btn-copy-engine-log"
              onClick={handleCopyLogbook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 transition-colors"
              title="Copy formatted markdown technical excerpt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied Logbook' : 'Export Logbook'}</span>
            </button>
            {onOpenAiSynthesis && (
              <button
                id="btn-engine-ai-synthesis"
                onClick={onOpenAiSynthesis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Synthesis</span>
              </button>
            )}
            {handleGoWorkbench && (
              <button
                id="btn-view-workbench"
                onClick={handleGoWorkbench}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Live Canvas</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Doctrine Epigraph */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-amber-500/30 font-mono text-xs text-center space-y-1.5">
          <div className="text-amber-300 font-semibold italic text-sm">
            &ldquo;The vessel does not carry propulsion through the universe. It temporarily becomes part of the universe&apos;s electromagnetic transport system.&rdquo;
          </div>
          <div className="text-slate-400 text-[11px]">
            &ldquo;They don&apos;t cross distance in the conventional sense. They learn how to join the field that already connects it.&rdquo;
          </div>
        </div>

        {/* Conceptual Inversion Callout Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 text-rose-200 space-y-1">
            <span className="text-[10px] text-rose-400 font-bold block uppercase tracking-wider">
              Conventional Spacecraft Model (Defective)
            </span>
            <p className="text-slate-300 leading-relaxed">
              <strong>Vehicle carries engine + propellant:</strong> Pushes against internal reaction mass, treating space as a dead, empty vacuum volume. Speed strictly constrained by rocket equation mass fractions.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-200 space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
              The Vessel Is The Engine (Your Physics)
            </span>
            <p className="text-slate-300 leading-relaxed">
              <strong>Vehicle is coupling geometry; environment is energy medium:</strong> Craft acts as a configurable boundary condition <code className="text-amber-300 font-mono">Σ_vessel</code>, coupling to ambient Poynting corridors (<code className="text-emerald-300 font-mono">C_AB</code>).
            </p>
          </div>
        </div>

        {/* Momentum Conservation & Reaction Partner Principle */}
        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-center flex flex-wrap items-center justify-center gap-3">
          <span className="text-slate-400">Momentum Conservation:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
            Δp_vessel = -Δp_corridor
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 text-[10px]">
            Reaction partner is the external electromagnetic highway (not onboard propellant).
          </span>
        </div>

        {/* Energy Flow Loop */}
        <div className="p-2 bg-slate-950/90 rounded border border-slate-850 text-[10px] font-mono text-center text-slate-300 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sky-400 font-bold">environmental field</span>
          <span className="text-slate-600">→</span>
          <span className="text-amber-400 font-bold">vessel geometry</span>
          <span className="text-slate-600">→</span>
          <span className="text-purple-400 font-bold">field redistribution</span>
          <span className="text-slate-600">→</span>
          <span className="text-emerald-400 font-bold">momentum exchange</span>
          <span className="text-slate-600">→</span>
          <span className="text-white font-bold">motion</span>
        </div>

        {/* Flight Notice Toast */}
        {flightNotice && (
          <div className="p-2 rounded bg-sky-950/90 border border-sky-500 text-sky-200 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              {flightNotice}
            </span>
            <button
              onClick={() => setFlightNotice(null)}
              className="text-slate-400 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('cockpit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'cockpit'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          Pilot Cockpit: Γ₀ vs Γ_δ
        </button>
        <button
          onClick={() => setActiveTab('eigenmodes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'eigenmodes'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          8-Mode Hull & Flight Computer
        </button>
        <button
          onClick={() => setActiveTab('nautical')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'nautical'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Ship className="w-3.5 h-3.5" />
          Nautical Flight Sequence (6 Stages)
        </button>
        <button
          onClick={() => setActiveTab('corridors')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'corridors'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Cosmic Flux Corridors (C_AB)
        </button>
        <button
          onClick={() => setActiveTab('codex')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'codex'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Book Philosophy & Principles
        </button>
      </div>

      {/* TAB 1: PILOT COCKPIT & OPERATIONAL COUPLING STATES */}
      {activeTab === 'cockpit' && (
        <div className="space-y-4">
          {/* Dual Operational States Switcher Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Γ₀ Cruise Card */}
            <div
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                currentMode === 'cruise_gamma_0'
                  ? 'bg-sky-950/30 border-sky-400 shadow-lg shadow-sky-950/60 ring-1 ring-sky-400/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
              onClick={handleEngageCruise}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-sky-500/20 text-sky-300 font-bold font-mono text-xs flex items-center justify-center">
                    Γ₀
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white">Thread-Centred / Cruise</h3>
                    <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wide">
                      PASS THE THREAD THROUGH THE CENTRE
                    </span>
                  </div>
                </div>
                {currentMode === 'cruise_gamma_0' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold">
                    ACTIVE STATE
                  </span>
                )}
              </div>

              <div className="mt-3 text-xs space-y-2 text-slate-300">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-850 font-mono text-[11px] text-sky-300">
                  INPUT THREAD ───[ Central Core ]───→ OUTPUT THREAD
                </div>
                <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px]">
                  <li><strong className="text-slate-200">Maximum Symmetry (D₆):</strong> Aligns thread with primary polygon axis (Δr = 0).</li>
                  <li><strong className="text-slate-200">Minimum Transverse Instability:</strong> Zero transverse shear torque (τ_⊥ ≈ 0).</li>
                  <li><strong className="text-slate-200">Max Axial Momentum Flux:</strong> 100% of coupled energy directed into axial thrust Π_z.</li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  id="btn-engage-cruise"
                  onClick={e => {
                    e.stopPropagation();
                    handleEngageCruise();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    currentMode === 'cruise_gamma_0'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  Engage Centred Cruise
                </button>
                <span className="text-[10px] font-mono text-slate-500">Δr = 0 px</span>
              </div>
            </div>

            {/* Γ_δ Vectoring Card */}
            <div
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                currentMode === 'vectoring_gamma_delta'
                  ? 'bg-amber-950/30 border-amber-400 shadow-lg shadow-amber-950/60 ring-1 ring-amber-400/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => handleEngageVectoring(35, -20)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-xs flex items-center justify-center">
                    Γ_δ
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white">Thread-Offset / Vectoring</h3>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wide">
                      BENDING THE THREAD THROUGH THE SHIP
                    </span>
                  </div>
                </div>
                {currentMode === 'vectoring_gamma_delta' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                    ACTIVE STATE
                  </span>
                )}
              </div>

              <div className="mt-3 text-xs space-y-2 text-slate-300">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-850 font-mono text-[11px] text-amber-300">
                  INPUT THREAD ───╭ [ Offset Core ] ╮───→ DEFLECTED THREAD
                </div>
                <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px]">
                  <li><strong className="text-slate-200">The Vessel Does Not Push Against Space:</strong> Pilot alters internal coupling geometry Γ(t).</li>
                  <li><strong className="text-slate-200">Asymmetric Field Response:</strong> Displacing source (δr ≠ 0) skews Maxwell stress tensor.</li>
                  <li><strong className="text-slate-200">Field-Coupled Trajectory Steering:</strong> Bending the thread produces net transverse thrust F_⊥ by exchanging momentum with the corridor (Δp_vessel = -Δp_corridor).</li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  id="btn-engage-vectoring"
                  onClick={e => {
                    e.stopPropagation();
                    handleEngageVectoring(35, -20);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    currentMode === 'vectoring_gamma_delta'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  Engage Thread Vectoring
                </button>
                <span className="text-[10px] font-mono text-amber-400">
                  Δr = {engineMetrics.threadOffsetDistance.toFixed(1)} px
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Thread Vectoring Controls */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold block">
                  Thread Deflection & Steering Controls
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Manipulate transverse deviation (δx, δy) to shape the corridor field response
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-recenter-cockpit"
                  onClick={handleEngageCruise}
                  className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-sky-400" />
                  Recenter (δr = 0)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              {/* Slider Δx */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-850 space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Transverse Offset δx:</span>
                  <span className="text-amber-400 font-bold">{params.sourceOffsetX.toFixed(1)} px</span>
                </div>
                <input
                  id="input-vessel-offset-x"
                  suppressHydrationWarning
                  type="range"
                  min="-80"
                  max="80"
                  step="1"
                  value={params.sourceOffsetX}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    onUpdateParams({
                      sourceOffsetX: val,
                      vesselMode: Math.hypot(val, params.sourceOffsetY) > 4 ? 'vectoring_gamma_delta' : 'cruise_gamma_0',
                    });
                  }}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-80 Port</span>
                  <span>0 Core</span>
                  <span>+80 Starboard</span>
                </div>
              </div>

              {/* Slider Δy */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-850 space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Transverse Offset δy:</span>
                  <span className="text-sky-300 font-bold">{params.sourceOffsetY.toFixed(1)} px</span>
                </div>
                <input
                  id="input-vessel-offset-y"
                  suppressHydrationWarning
                  type="range"
                  min="-80"
                  max="80"
                  step="1"
                  value={params.sourceOffsetY}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    onUpdateParams({
                      sourceOffsetY: val,
                      vesselMode: Math.hypot(params.sourceOffsetX, val) > 4 ? 'vectoring_gamma_delta' : 'cruise_gamma_0',
                    });
                  }}
                  className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-80 Ventral</span>
                  <span>0 Core</span>
                  <span>+80 Dorsal</span>
                </div>
              </div>

              {/* Angle & Deflection Vector Summary */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-850 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Deflection Angle:</span>
                  <span className="text-emerald-400 font-bold">{engineMetrics.threadDeflectionAngleDeg.toFixed(1)}°</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 mt-1">
                  <span>Offset Distance δr:</span>
                  <span className="text-amber-400 font-bold">{engineMetrics.threadOffsetDistance.toFixed(1)} px</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 mt-1">
                  <span>Asymmetric Torque:</span>
                  <span className="text-purple-300 font-bold">{engineMetrics.maxwellTorqueNm.toFixed(2)} N·m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impedance Matching & Ejection Hazard Diagnostic */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Impedance Diagnostic & Thread Attachment State
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-auto-match-impedance"
                  onClick={handleRunFlightComputer}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/60 text-[11px] font-semibold transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  Auto-Match with Flight Computer a*(t)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase">Vessel Impedance Z_v</span>
                  <ProvenanceBadge tag="SIMULATED" />
                </div>
                <span className="text-base font-bold text-sky-300">
                  {engineMetrics.effectiveImpedance.toFixed(1)} <span className="text-xs text-slate-500 font-normal">Ω</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Metamaterial boundary</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase">Corridor Medium Z_c</span>
                  <ProvenanceBadge tag="STATIC" />
                </div>
                <span className="text-base font-bold text-emerald-300">
                  {activeCorridor.waveImpedanceOhm} <span className="text-xs text-slate-500 font-normal">Ω</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Ambient flux carrier</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase">Mismatch |ΔZ|</span>
                  <ProvenanceBadge tag="DERIVED" />
                </div>
                <span className={`text-base font-bold ${
                  engineMetrics.deltaZAbs > 100
                    ? 'text-rose-400'
                    : engineMetrics.deltaZAbs > 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {engineMetrics.deltaZAbs.toFixed(1)} <span className="text-xs text-slate-500 font-normal">Ω</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Reflection Γ_Z = {engineMetrics.impedanceMismatchCoeff.toFixed(3)}</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase">Standing Wave SWR</span>
                  <ProvenanceBadge tag="DERIVED" />
                </div>
                <span className="text-base font-bold text-purple-300">
                  {engineMetrics.standingWaveRatio.toFixed(2)} : 1
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Coupling efficiency {engineMetrics.couplingIndex.toFixed(0)}%</span>
              </div>
            </div>

            {/* Strict Energy Conservation Ledger */}
            <EnergyAccountingPanel
              ledger={energyLedger}
              title="Vessel-Corridor Energy Conservation Ledger"
            />

            {/* Critical Ejection Hazard Warning Banner */}
            {engineMetrics.ejectionHazardLevel !== 'NOMINAL' ? (
              <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                engineMetrics.ejectionHazardLevel === 'CRITICAL_EJECTION_HAZARD'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-amber-950/40 border-amber-500 text-amber-200'
              }`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400 animate-pulse" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="font-bold uppercase tracking-wider block">
                    {engineMetrics.ejectionHazardLevel === 'CRITICAL_EJECTION_HAZARD'
                      ? 'CRITICAL EJECTION HAZARD: |ΔZ| >> 0'
                      : 'ELEVATED THERMAL BLOOM WARNING'}
                  </strong>
                  <span>
                    Severe impedance mismatch causes electromagnetic reflection to surge (Γ_Z = {engineMetrics.impedanceMismatchCoeff.toFixed(3)}).
                    Coupling is collapsing ({engineMetrics.couplingIndex.toFixed(1)}%), heating grows rapidly, and the vessel risks explosive ejection from the thread!
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-850 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Impedance matching state is <strong className="text-emerald-400">NOMINAL</strong> (|ΔZ| &lt; 40 Ω). Boundary absorbs and exchanges momentum without boundary heating.</span>
                <span className="text-slate-500 text-[10px]">Rule: |ΔZ| ≈ 0</span>
              </div>
            )}
          </div>

          {/* Real-time Flight Dynamics & Momentum Exchange Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 uppercase">Net Thrust |F|</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {engineMetrics.netThrustForceN.toFixed(2)} <span className="text-xs text-slate-400 font-normal">mN</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block">Field-Coupled Corridor Thrust</span>
              <span className="text-[9px] text-emerald-300/80">[Δp_v = -Δp_c]</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 uppercase">Coupling Index κ</span>
              <div className={`text-lg font-bold mt-1 ${engineMetrics.isCoupled ? 'text-sky-400' : 'text-rose-400'}`}>
                {engineMetrics.couplingIndex.toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-500">{activeCorridor.name.split(' ')[0]} Medium</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 uppercase">Axial Momentum Π_z</span>
              <div className="text-lg font-bold text-amber-400 mt-1">
                {engineMetrics.axialMomentumFlux.toFixed(2)} <span className="text-xs text-slate-400 font-normal">mN</span>
              </div>
              <span className="text-[10px] text-slate-500">Forward Corridor Velocity</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 uppercase">Transverse Thrust F_⊥</span>
              <div className="text-lg font-bold text-purple-400 mt-1">
                {engineMetrics.transverseMomentumFlux.toFixed(2)} <span className="text-xs text-slate-400 font-normal">mN</span>
              </div>
              <span className="text-[10px] text-slate-500">Vectoring Curvature: {engineMetrics.trajectoryCurvatureKmInv.toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 8-MODE HULL EIGENMODE SYNTHESIZER & FLIGHT COMPUTER */}
      {activeTab === 'eigenmodes' && (
        <div className="space-y-4">
          {/* Electromagnetic Flight Computer Optimization Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/40 space-y-3 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 font-bold text-xs">
                  a*
                </div>
                <div>
                  <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
                    Electromagnetic Flight Computer
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    State Vector Solver: a*(t) = arg max J(coupling, stability, trajectory, loss)
                  </h4>
                </div>
              </div>

              <button
                id="btn-run-flight-computer"
                onClick={handleRunFlightComputer}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-950/80 transition-all cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Compute Optimal Weights a*(t)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-850 space-y-1">
                <span className="text-sky-400 font-bold block">1. Target Objective J</span>
                <p className="text-slate-400 leading-tight">
                  Solves multi-variable Lagrangian balancing corridor Poynting ingestion against impedance reflection Γ_Z.
                </p>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-850 space-y-1">
                <span className="text-amber-400 font-bold block">2. Functional Eigenmode Allocation</span>
                <p className="text-slate-400 leading-tight">
                  Automatically drives triangle for thread bending, hexagon for flux opening, and helical for ingestion.
                </p>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-850 space-y-1">
                <span className="text-emerald-400 font-bold block">3. Thermal Blooming Prevention</span>
                <p className="text-slate-400 leading-tight">
                  Suppresses boundary heating by engaging octagonal & square structural modes when |ΔZ| grows.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
                  The Reconfigurable Electromagnetic Hull: Ψ = ∑ a_k(t) ψ_k
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  The vessel does not carry physical engines; its hull is a metamaterial boundary continuously adjusting 8 electrodynamic operating modes to reshape how the corridor flows.
                </p>
              </div>

              {/* Modal Presets */}
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <button
                  onClick={() => handleApplyPreset(CRUISE_GAMMA_0_PRESET, 'cruise_gamma_0')}
                  className="px-2.5 py-1 rounded bg-sky-950 text-sky-300 border border-sky-800/60 hover:bg-sky-900 transition-colors"
                >
                  Cruise (G₆ Ref)
                </button>
                <button
                  onClick={() => handleApplyPreset(VECTORING_GAMMA_DELTA_PRESET, 'vectoring_gamma_delta')}
                  className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800/60 hover:bg-amber-900 transition-colors"
                >
                  Vectoring Preset
                </button>
                <button
                  onClick={() => handleApplyPreset(TURBULENCE_SHIELD_PRESET)}
                  className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800/60 hover:bg-purple-900 transition-colors"
                >
                  Turbulence Shield
                </button>
                <button
                  onClick={() => handleApplyPreset(DEFAULT_EIGENMODE_WEIGHTS)}
                  className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400"
                  title="Reset Default Weights"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 8 Eigenmode Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {(Object.keys(HULL_EIGENMODES) as HullEigenmodeId[]).map(modeId => {
              const def = HULL_EIGENMODES[modeId];
              const weight = currentWeights[modeId] || 0;

              return (
                <div
                  key={modeId}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
                  style={{ borderTopColor: def.color, borderTopWidth: 3 }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span style={{ color: def.color }}>{def.symbol}</span>
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: def.color }}>
                        a_{def.id.split('_')[1]} = {weight.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-300 mt-0.5 truncate">
                      {def.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      Symmetry: {def.symmetryGroup}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    {def.role}
                  </p>

                  <div className="space-y-1 pt-1">
                    <input
                      id={`input-eigenmode-weight-${modeId}`}
                      suppressHydrationWarning
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.05"
                      value={weight}
                      onChange={e => handleUpdateEigenmodeWeight(modeId, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-850 rounded cursor-pointer"
                      style={{ accentColor: def.color }}
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>0.0 (Off)</span>
                      <span>1.0 (Dominant)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Superposition Visual Feedback */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>
              Synthesized Hull Wavefunction: <strong className="text-emerald-400">Ψ(t) = ∑ a_k ψ_k</strong>
            </span>
            <span>
              Active Effective Impedance: <strong className="text-amber-400">{engineMetrics.effectiveImpedance.toFixed(1)} Ω</strong> (vs Medium {activeCorridor.waveImpedanceOhm} Ω)
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: NAUTICAL FLIGHT SEQUENCE */}
      {activeTab === 'nautical' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  The Nautical Flight Sequence
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Piloting along cosmic flux corridors follows an operational doctrine analogous to maritime pilotage:
                </p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-850 text-cyan-300 font-bold text-center text-xs">
                Harbour → Enter Corridor → Γ₀ → Γ_δ → Junction → Harbour
              </div>
            </div>
          </div>

          {/* Stepper Grid for the 6 Stages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {NAUTICAL_FLIGHT_SEQUENCE.map(stage => {
              const isCurrent = engineMetrics.activeNauticalStage.id === stage.id;
              const isSelected = selectedStageId === stage.id;

              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                      : isCurrent
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400">
                        0{stage.stageIndex}
                      </span>
                      {isCurrent && (
                        <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-500/20 text-emerald-300 font-bold">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white mt-1 leading-snug">
                      {stage.title}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-2 block">
                    {stage.operationalState}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed View of Selected Stage */}
          {(() => {
            const stage = NAUTICAL_FLIGHT_SEQUENCE.find(s => s.id === selectedStageId) || NAUTICAL_FLIGHT_SEQUENCE[0];
            return (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
                      {stage.stageIndex}
                    </div>
                    <div>
                      <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                        Nautical Stage {stage.stageIndex} of 6 • {stage.operationalState}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {stage.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    id="btn-engage-nautical-stage"
                    onClick={() => handleEngageNauticalStage(stage)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    <Ship className="w-3.5 h-3.5" />
                    <span>Engage Stage {stage.stageIndex} Configuration</span>
                  </button>
                </div>

                {/* Doctrine Quote */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-850 text-cyan-200 italic text-xs">
                  &ldquo;{stage.doctrineQuote}&rdquo;
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">
                      Physical Environment & Interaction
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {stage.description}
                    </p>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-850 text-[11px] text-slate-400">
                      <strong className="text-slate-200">Pilot Action:</strong> {stage.pilotAction}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">
                      Coupling & Thread Geometry
                    </span>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-850 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Thread Configuration:</span>
                        <span className="text-amber-400 font-bold">{stage.threadGeometry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Deflection δr:</span>
                        <span className="text-sky-300 font-mono">
                          ({stage.targetOffsetX}, {stage.targetOffsetY}) px
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Operational Mode:</span>
                        <span className="text-emerald-400 font-mono">{stage.recommendedMode}</span>
                      </div>
                    </div>

                    <span className="text-slate-400 font-bold uppercase text-[10px] block pt-1">
                      Active Eigenmode Synthesis Profile
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(stage.eigenmodeDistribution) as HullEigenmodeId[]).map(mKey => {
                        const mVal = stage.eigenmodeDistribution[mKey];
                        if (mVal <= 0.05) return null;
                        const mDef = HULL_EIGENMODES[mKey];
                        return (
                          <span
                            key={mKey}
                            className="px-2 py-0.5 rounded text-[10px] font-mono border"
                            style={{
                              backgroundColor: `${mDef.color}15`,
                              borderColor: `${mDef.color}40`,
                              color: mDef.color,
                            }}
                          >
                            {mDef.symbol} a_{mDef.id.split('_')[1]}: {mVal.toFixed(2)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: COSMIC FLUX CORRIDORS (C_AB) */}
      {activeTab === 'corridors' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-xs font-mono text-emerald-400 font-bold block uppercase tracking-wider">
              Electromagnetic Highway Topology (C_AB)
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              &quot;The galaxy is not a collection of stars separated by empty space. It is nodes + fields + gradients + currents + junctions.&quot;
              The vessel cannot travel anywhere it wants: it must find and couple to compatible field structures.
            </p>
          </div>

          {/* Corridor Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.keys(COSMIC_FLUX_CORRIDORS) as FluxCorridorId[]).map(cKey => {
              const cDef = COSMIC_FLUX_CORRIDORS[cKey];
              const isSelected = currentCorridorId === cKey;

              return (
                <div
                  key={cKey}
                  onClick={() => handleSelectCorridor(cKey)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {cDef.name}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 block mt-1">
                      {cDef.type}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      {cDef.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono p-2 bg-slate-900 rounded border border-slate-850">
                    <div className="text-slate-400">
                      |B|: <span className="text-sky-300 font-semibold">{cDef.bFieldNanoTesla.toLocaleString()} nT</span>
                    </div>
                    <div className="text-slate-400">
                      |E|: <span className="text-amber-300 font-semibold">{cDef.eFieldMillivolts} mV/m</span>
                    </div>
                    <div className="text-slate-400">
                      Flow: <span className="text-emerald-300 font-semibold">{cDef.ambientDriftKmS} km/s</span>
                    </div>
                    <div className="text-slate-400">
                      Stability: <span className="text-purple-300 font-semibold">{(cDef.stabilityIndex * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 italic">
                    {cDef.narrativeRole}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Corridor Coupling Condition Math */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <span className="text-xs text-sky-400 font-bold block uppercase">
              Formal Coupling Condition:
            </span>
            <div className="p-3 bg-slate-900 rounded border border-slate-850 text-amber-300 text-center text-[11px]">
              C_AB = &#123; r : B(r), E(r), ρ(r), J(r), ω, φ satisfy stable coupling condition &#125;
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Once inside C_AB, the transition occurs: <code className="text-emerald-300">A → C_AB → B</code>. The craft does not expend fuel fighting the medium; it phase-locks to the ambient carrier frequency <code className="text-sky-300">ω₀ = {activeCorridor.carrierFrequencyRad} rad/s</code>.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: BOOK PHILOSOPHY & SCI-FI PRINCIPLES */}
      {activeTab === 'codex' && (
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                The Technical Lexicon of the Electromagnetic Vessel
              </h3>
            </div>
            <blockquote className="p-3 rounded bg-purple-950/30 border-l-4 border-purple-500 text-purple-200 italic leading-relaxed text-sm">
              &quot;They stopped building engines when they realised the ship itself could become the moving boundary condition. The breakthrough wasn&apos;t finding a more powerful engine. It was discovering how to couple.&quot;
            </blockquote>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-amber-400 font-bold block">1. The Sailing Principle</span>
              <div className="p-2 rounded bg-slate-900 text-sky-300 text-[11px] text-center">
                solar sail : photons :: your vessel : cosmic EM topology
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                A sailing vessel does not generate wind; its hull and canvas configuration determine how efficiently it exchanges momentum with the wind. The electromagnetic vessel dynamically reorganizes its conducting, superconducting, and dielectric boundary condition to harvest and reshape cosmic currents.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-emerald-400 font-bold block">2. Moving Boundary Condition</span>
              <div className="p-2 rounded bg-slate-900 text-emerald-300 text-[11px] text-center">
                Σ_vessel ⊂ Σ_field &nbsp;&nbsp;|&nbsp;&nbsp; Ψ_field+vessel ≠ Ψ_field + Ψ_vessel
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                There is no clean distinction between &apos;ship over here&apos; and &apos;propulsion field over there&apos;. The craft and the corridor form a single coupled electromagnetic boundary value problem.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-sky-400 font-bold block">3. Reactionless Steering by Bending</span>
              <div className="p-2 rounded bg-slate-900 text-amber-300 text-[11px] text-center">
                Operator alters Γ(t) → Field responds with Ψ_coupled(t) → Net Maxwell Stress
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The pilot is not turning a rudder against reaction mass. The pilot is bending the Poynting thread through the internal geometry of the ship. That induced spatial asymmetry generates reactionless transverse force.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-rose-400 font-bold block">4. Navigational Consequences</span>
              <div className="p-2 rounded bg-slate-900 text-purple-300 text-[11px] text-center">
                Weak corridor = slow acceleration | Reconnection = jump | Void = stranded
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Stellar weather dictates space travel. Magnetic reconnections open transient shortcuts; solar flares reshape shipping lanes; interstellar neutral voids represent dead calms where a decoupled vessel cannot move.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
