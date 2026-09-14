'use client';

import React, { useState } from 'react';
import {
  SimulationParameters,
  GeometryType,
  GEOMETRY_DEFINITIONS,
  NodeReceiver,
  VesselOperationalMode,
  COSMIC_FLUX_CORRIDORS,
  FluxCorridorId,
  CRUISE_GAMMA_0_PRESET,
  VECTORING_GAMMA_DELTA_PRESET,
  calculateVesselEngineMetrics,
  NAUTICAL_FLIGHT_SEQUENCE,
  NauticalFlightStage,
} from '@/lib/physics-engine';
import {
  Sliders,
  Radio,
  Zap,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Compass,
  ChevronsRight,
  ShieldAlert,
  Gauge,
  HelpCircle,
  Cpu,
  Navigation,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import ProvenanceBadge from './ProvenanceBadge';
import EnergyAccountingPanel from './EnergyAccountingPanel';
import DynamicOptimalitySolver from './DynamicOptimalitySolver';
import { getGeometryNodes, calculateNodalDistribution } from '@/lib/physics-engine';

interface OperatorDashboardProps {
  params: SimulationParameters;
  onParamsChange: (updater: (prev: SimulationParameters) => SimulationParameters) => void;
  nodalTelemetry: { powers: number[]; efficiency: number; uniformity: number };
  onOpenAiSynthesis: () => void;
}

export default function OperatorDashboard({
  params,
  onParamsChange,
  nodalTelemetry,
  onOpenAiSynthesis,
}: OperatorDashboardProps) {
  const [activeSection, setActiveSection] = useState<'vessel_engine' | 'source_axis' | 'substrate' | 'optimality' | 'formulations'>('vessel_engine');

  const handleGeometrySelect = (geom: GeometryType) => {
    onParamsChange(prev => ({ ...prev, geometry: geom }));
  };

  const handleSliderChange = (key: keyof SimulationParameters, value: number) => {
    onParamsChange(prev => ({ ...prev, [key]: value }));
  };

  const engineMetrics = calculateVesselEngineMetrics(params);
  const currentMode = params.vesselMode || 'cruise_gamma_0';
  const currentCorridorKey = params.activeCorridor || 'corridor_solar_wind';

  const nodesForLedger = React.useMemo(() => getGeometryNodes(params.geometry, params.radius), [params.geometry, params.radius]);
  const nodalForLedger = React.useMemo(() => calculateNodalDistribution(params, nodesForLedger, 0), [params, nodesForLedger]);
  const energyLedger = nodalForLedger.energyLedger;

  const handleEngageCruise = () => {
    onParamsChange(prev => ({
      ...prev,
      vesselMode: 'cruise_gamma_0',
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      motionPreset: 'static',
      eigenmodeWeights: { ...CRUISE_GAMMA_0_PRESET },
    }));
  };

  const handleEngageVectoring = (dx: number = 32, dy: number = -22) => {
    onParamsChange(prev => ({
      ...prev,
      vesselMode: 'vectoring_gamma_delta',
      sourceOffsetX: dx,
      sourceOffsetY: dy,
      motionPreset: 'static',
      eigenmodeWeights: { ...VECTORING_GAMMA_DELTA_PRESET },
    }));
  };

  const currentGeom = GEOMETRY_DEFINITIONS[params.geometry];
  const totalCaptured = nodalTelemetry.powers.reduce((a, b) => a + b, 0);
  const lossPower = Math.max(0, params.sourcePower - totalCaptured);

  return (
    <div id="operator-dashboard" className="flex flex-col w-full h-full bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-y-auto space-y-4">
      {/* Header & Geometry Quick Selector */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400 tracking-wider uppercase font-semibold">
                OPERATOR COMMAND CONSOLE
              </span>
              <ProvenanceBadge tag="STATIC" />
            </div>
            <h1 className="text-sm font-bold text-slate-100 font-mono">
              Central Axis Trajectory & Ecosystem Couplings
            </h1>
          </div>
          <button
            id="btn-ai-synthesis"
            onClick={onOpenAiSynthesis}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Operator Synthesis
          </button>
        </div>

        {/* Geometry Ecosystem Selector Tabs */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono text-slate-400 block">
              Active Polygon Ecosystem (G_n: θ_k = 2πk / n)
            </label>
            <ProvenanceBadge tag="STATIC" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {(Object.keys(GEOMETRY_DEFINITIONS) as GeometryType[]).map(gKey => {
              const def = GEOMETRY_DEFINITIONS[gKey];
              const isSelected = params.geometry === gKey;
              const isRef = gKey === 'G6';

              return (
                <button
                  key={gKey}
                  id={`select-geom-${gKey}`}
                  onClick={() => handleGeometrySelect(gKey)}
                  className={`min-h-[44px] p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-md shadow-sky-950/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-bold">{gKey}</span>
                    {isRef && (
                      <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 rounded font-mono">
                        Ref
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono opacity-80 truncate mt-1">
                    {def.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Symmetry: <span className="text-slate-200">{currentGeom.symmetryGroup}</span></span>
            <span className="text-slate-500 italic truncate max-w-[240px]">{currentGeom.description}</span>
          </div>
        </div>
      </div>

      {/* Primary Real-time Telemetry Cards with Provenance Labels */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Captured</span>
            <ProvenanceBadge tag="DERIVED" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            {totalCaptured.toFixed(2)} W
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            P_in = {params.sourcePower}W
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Efficiency η</span>
            <ProvenanceBadge tag="DERIVED" />
          </div>
          <div className="text-base font-bold font-mono text-sky-400 mt-1">
            {(nodalTelemetry.efficiency * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Loss = {lossPower.toFixed(2)}W
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Uniformity U</span>
            <ProvenanceBadge tag="DERIVED" />
          </div>
          <div className="text-base font-bold font-mono text-amber-400 mt-1">
            {(nodalTelemetry.uniformity * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {nodalTelemetry.powers.length} Vertices
          </span>
        </div>
      </div>

      {/* Strict Energy Balance Ledger Panel */}
      <EnergyAccountingPanel
        ledger={energyLedger}
        title="Field Energy Conservation Ledger"
      />

      {/* Control Tabs: Source Trajectory vs Substrate vs Optimality vs Formulations */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
        <div className="flex border-b border-slate-800 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveSection('vessel_engine')}
            className={`flex-1 min-h-[44px] px-3 py-2 text-center transition-colors whitespace-nowrap ${
              activeSection === 'vessel_engine'
                ? 'bg-slate-900 text-emerald-400 font-semibold border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vessel Engine (Γ₀/Γ_δ)
          </button>
          <button
            onClick={() => setActiveSection('optimality')}
            className={`flex-1 min-h-[44px] px-3 py-2 text-center transition-colors whitespace-nowrap ${
              activeSection === 'optimality'
                ? 'bg-slate-900 text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Optimality (G*)
          </button>
          <button
            onClick={() => setActiveSection('source_axis')}
            className={`flex-1 min-h-[44px] px-3 py-2 text-center transition-colors whitespace-nowrap ${
              activeSection === 'source_axis'
                ? 'bg-slate-900 text-sky-400 font-semibold border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Axis A(t)
          </button>
          <button
            onClick={() => setActiveSection('substrate')}
            className={`flex-1 min-h-[44px] px-3 py-2 text-center transition-colors whitespace-nowrap ${
              activeSection === 'substrate'
                ? 'bg-slate-900 text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Substrate Σ(t)
          </button>
          <button
            onClick={() => setActiveSection('formulations')}
            className={`flex-1 min-h-[44px] px-3 py-2 text-center transition-colors whitespace-nowrap ${
              activeSection === 'formulations'
                ? 'bg-slate-900 text-purple-400 font-semibold border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Theory
          </button>
        </div>

        <div className="p-3">
          {/* Optimality G* Objective Section */}
          {activeSection === 'optimality' && (
            <div className="space-y-3">
              <DynamicOptimalitySolver
                params={params}
                onParamsChange={onParamsChange}
                onSelectGeometry={handleGeometrySelect}
              />
            </div>
          )}

          {/* Phase 2: Vessel as Engine Section */}
          {activeSection === 'vessel_engine' && (
            <div className="space-y-3.5 text-xs font-mono">
              {/* Ejection Hazard Warning Alert */}
              {engineMetrics.ejectionHazardLevel !== 'NOMINAL' && (
                <div
                  id="op-ejection-hazard-alert"
                  className={`p-3 rounded-lg border font-mono ${
                    engineMetrics.ejectionHazardLevel === 'CRITICAL_EJECTION_HAZARD'
                      ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                      : 'bg-amber-950/70 border-amber-500 text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0 animate-pulse" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] uppercase tracking-wider">
                          {engineMetrics.ejectionHazardLevel === 'CRITICAL_EJECTION_HAZARD'
                            ? 'CRITICAL THREAD EJECTION WARNING'
                            : 'ELEVATED THERMAL BLOOMING / SWR'}
                        </span>
                        <button
                          onClick={handleEngageCruise}
                          className="px-2 py-0.5 bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 rounded border border-rose-400 text-[9px] uppercase tracking-wider font-bold transition-colors"
                        >
                          Match Phase
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        Impedance mismatch |ΔZ| = {engineMetrics.deltaZAbs.toFixed(1)} Ω (SWR {engineMetrics.standingWaveRatio.toFixed(2)}). Severe reflection coefficient {(engineMetrics.impedanceMismatchCoeff * 100).toFixed(0)}% risks decoupling or structural thermal shear.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nautical Flight Sequence Navigation Bar */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" /> NAUTICAL FLIGHT SEQUENCE
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Stage {engineMetrics.activeNauticalStage.stageIndex}/6: <span className="text-cyan-300 font-semibold">{engineMetrics.activeNauticalStage.name}</span>
                  </span>
                </div>

                {/* Stage Steps Selector */}
                <div className="grid grid-cols-6 gap-1">
                  {NAUTICAL_FLIGHT_SEQUENCE.map((st) => {
                    const isCurrent = engineMetrics.activeNauticalStage.id === st.id;
                    return (
                      <button
                        key={st.id}
                        id={`btn-stage-${st.id}`}
                        onClick={() => {
                          onParamsChange(prev => ({
                            ...prev,
                            vesselMode: st.recommendedMode,
                            sourceOffsetX: st.targetOffsetX,
                            sourceOffsetY: st.targetOffsetY,
                            eigenmodeWeights: { ...st.eigenmodeDistribution },
                          }));
                        }}
                        className={`py-1 text-center rounded border transition-all text-[9px] font-bold ${
                          isCurrent
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                        title={`${st.phaseLabel}: ${st.name} — Click to Engage`}
                      >
                        S{st.stageIndex}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-900/80 p-2 rounded border border-slate-850 text-[10px] space-y-0.5">
                  <div className="flex justify-between text-slate-300 font-semibold">
                    <span>{engineMetrics.activeNauticalStage.operationalState}</span>
                    <span className="text-cyan-400">{engineMetrics.activeNauticalStage.action}</span>
                  </div>
                  <p className="text-slate-400 italic text-[9px]">
                    &ldquo;{engineMetrics.activeNauticalStage.doctrineQuote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Operational State Switcher */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 flex justify-between items-center">
                  <span>Operational Coupling State:</span>
                  <span className={`font-bold ${currentMode === 'cruise_gamma_0' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {currentMode === 'cruise_gamma_0' ? 'Γ₀ (Thread Centred)' : 'Γ_δ (Thread Bent)'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-op-cruise"
                    onClick={handleEngageCruise}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      currentMode === 'cruise_gamma_0'
                        ? 'bg-emerald-950/40 border-emerald-400 text-emerald-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Γ₀ Cruise</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Δr = 0</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                      Pass thread through centre. Max forward momentum Π_z.
                    </span>
                  </button>

                  <button
                    id="btn-op-vectoring"
                    onClick={() => handleEngageVectoring(35, -22)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      currentMode === 'vectoring_gamma_delta'
                        ? 'bg-amber-950/40 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Γ_δ Vectoring</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">
                        Δr = {engineMetrics.threadOffsetDistance.toFixed(0)}px
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                      Bend thread through ship. Reactionless Maxwell steering.
                    </span>
                  </button>
                </div>
              </div>

              {/* Cosmic Flux Corridor Selector */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 flex justify-between">
                  <span>Ambient Flux Corridor (C_AB):</span>
                  <span className="text-sky-300 font-semibold">{engineMetrics.activeCorridor.type}</span>
                </label>
                <select
                  id="select-active-corridor"
                  suppressHydrationWarning
                  value={currentCorridorKey}
                  onChange={e => {
                    const cKey = e.target.value as FluxCorridorId;
                    const corridor = COSMIC_FLUX_CORRIDORS[cKey];
                    onParamsChange(prev => ({
                      ...prev,
                      activeCorridor: cKey,
                      sourceFrequency: corridor.carrierFrequencyRad,
                    }));
                  }}
                  className="w-full p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-400"
                >
                  {(Object.keys(COSMIC_FLUX_CORRIDORS) as FluxCorridorId[]).map(cKey => (
                    <option key={cKey} value={cKey}>
                      {COSMIC_FLUX_CORRIDORS[cKey].name} ({COSMIC_FLUX_CORRIDORS[cKey].ambientDriftKmS} km/s)
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Vectoring Coordinates Slider */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Thread Deviation (δx, δy):</span>
                  <button
                    id="btn-reset-core-deviation"
                    onClick={handleEngageCruise}
                    className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Core
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>δx: {params.sourceOffsetX.toFixed(1)} px</span>
                    <span>δy: {params.sourceOffsetY.toFixed(1)} px</span>
                    <span className="text-amber-400 font-bold">
                      θ = {engineMetrics.threadDeflectionAngleDeg.toFixed(1)}°
                    </span>
                  </div>
                  <input
                    id="input-source-offset-x"
                    suppressHydrationWarning
                    type="range"
                    min="-70"
                    max="70"
                    step="1"
                    value={params.sourceOffsetX}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      onParamsChange(prev => ({
                        ...prev,
                        sourceOffsetX: val,
                        vesselMode: Math.hypot(val, prev.sourceOffsetY) > 4 ? 'vectoring_gamma_delta' : 'cruise_gamma_0',
                      }));
                    }}
                    className="w-full accent-amber-400 h-1 bg-slate-800 rounded"
                  />
                  <input
                    id="input-source-offset-y"
                    suppressHydrationWarning
                    type="range"
                    min="-70"
                    max="70"
                    step="1"
                    value={params.sourceOffsetY}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      onParamsChange(prev => ({
                        ...prev,
                        sourceOffsetY: val,
                        vesselMode: Math.hypot(prev.sourceOffsetX, val) > 4 ? 'vectoring_gamma_delta' : 'cruise_gamma_0',
                      }));
                    }}
                    className="w-full accent-sky-400 h-1 bg-slate-800 rounded"
                  />
                </div>
              </div>

              {/* Engine Metrics Telemetry Strip */}
              <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-900/60 rounded border border-slate-850">
                <div>
                  <span className="text-slate-500 block text-[9px]">NET CORRIDOR THRUST (Δp_v = -Δp_c)</span>
                  <span className="text-emerald-400 font-bold">{engineMetrics.netThrustForceN.toFixed(2)} mN</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">CORRIDOR COUPLING INDEX</span>
                  <span className={engineMetrics.isCoupled ? 'text-sky-400 font-bold' : 'text-rose-400 font-bold'}>
                    {engineMetrics.couplingIndex.toFixed(1)}% ({engineMetrics.isCoupled ? 'LOCKED' : 'DRIFT'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">VESSEL IMPEDANCE Z_v</span>
                  <span className="text-amber-300 font-semibold">{engineMetrics.effectiveImpedance.toFixed(1)} Ω</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">IMPEDANCE MISMATCH |ΔZ|</span>
                  <span className={`font-semibold ${engineMetrics.deltaZAbs > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {engineMetrics.deltaZAbs.toFixed(1)} Ω (SWR {engineMetrics.standingWaveRatio.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Central Axis Section */}
          {activeSection === 'source_axis' && (
            <div className="space-y-3 text-xs">
              {/* Motion Preset */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Source Trajectory Dynamics N₀(t)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[11px]">
                  {[
                    { id: 'static', label: 'Static (Manual)' },
                    { id: 'axial_oscillation', label: 'Axial Oscillation z(t)' },
                    { id: 'precession', label: 'Orbital Precession' },
                    { id: 'vertical_ascent', label: 'Vertical Ascent' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() =>
                        onParamsChange(prev => ({
                          ...prev,
                          motionPreset: mode.id as SimulationParameters['motionPreset'],
                        }))
                      }
                      className={`py-1.5 px-2 rounded border text-center transition-colors ${
                        params.motionPreset === mode.id
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Height Slider (z0) */}
              <div>
                <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                  <span>Central Axis Height (z₀)</span>
                  <span className="text-amber-400 font-bold">{params.sourceHeight.toFixed(1)} px</span>
                </div>
                <input
                  id="input-source-height"
                  suppressHydrationWarning
                  type="range"
                  min="0"
                  max="35"
                  step="0.5"
                  value={params.sourceHeight}
                  onChange={e => handleSliderChange('sourceHeight', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Controls vertical separation of source N₀(t) passing through polygon plane.
                </span>
              </div>

              {/* Transverse Offsets */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Offset Δx</span>
                    <span className="text-sky-300">{params.sourceOffsetX.toFixed(0)}</span>
                  </div>
                  <input
                    id="input-substrate-offset-x"
                    suppressHydrationWarning
                    type="range"
                    min="-80"
                    max="80"
                    step="2"
                    value={params.sourceOffsetX}
                    onChange={e => handleSliderChange('sourceOffsetX', parseFloat(e.target.value))}
                    className="w-full accent-sky-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Offset Δy</span>
                    <span className="text-sky-300">{params.sourceOffsetY.toFixed(0)}</span>
                  </div>
                  <input
                    id="input-substrate-offset-y"
                    suppressHydrationWarning
                    type="range"
                    min="-80"
                    max="80"
                    step="2"
                    value={params.sourceOffsetY}
                    onChange={e => handleSliderChange('sourceOffsetY', parseFloat(e.target.value))}
                    className="w-full accent-sky-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Motion Speed */}
              {params.motionPreset !== 'static' && (
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Trajectory Velocity</span>
                    <span className="text-emerald-400">{params.motionSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    id="input-motion-speed"
                    suppressHydrationWarning
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={params.motionSpeed}
                    onChange={e => handleSliderChange('motionSpeed', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* Substrate Ecosystem Section */}
          {activeSection === 'substrate' && (
            <div className="space-y-3 text-xs">
              {/* Permittivity and Loss */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Permittivity (ε_r)</span>
                    <span className="text-sky-300">{params.permittivity.toFixed(1)}</span>
                  </div>
                  <input
                    id="input-permittivity"
                    suppressHydrationWarning
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.2"
                    value={params.permittivity}
                    onChange={e => handleSliderChange('permittivity', parseFloat(e.target.value))}
                    className="w-full accent-sky-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Conductivity Loss (σ)</span>
                    <span className="text-rose-400">{params.conductivity.toFixed(2)}</span>
                  </div>
                  <input
                    id="input-conductivity"
                    suppressHydrationWarning
                    type="range"
                    min="0.0"
                    max="1.5"
                    step="0.05"
                    value={params.conductivity}
                    onChange={e => handleSliderChange('conductivity', parseFloat(e.target.value))}
                    className="w-full accent-rose-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Boundary Reflection & Coupling */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Boundary Refl (B_i)</span>
                    <span className="text-purple-300">{params.boundaryReflection.toFixed(2)}</span>
                  </div>
                  <input
                    id="input-boundary-reflection"
                    suppressHydrationWarning
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={params.boundaryReflection}
                    onChange={e => handleSliderChange('boundaryReflection', parseFloat(e.target.value))}
                    className="w-full accent-purple-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Inter-Node K_ij</span>
                    <span className="text-amber-300">{params.couplingConstant.toFixed(2)}</span>
                  </div>
                  <input
                    id="input-coupling-constant"
                    suppressHydrationWarning
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={params.couplingConstant}
                    onChange={e => handleSliderChange('couplingConstant', parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Frequency & Power */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Frequency (ω)</span>
                    <span className="text-blue-300">{params.sourceFrequency.toFixed(1)} rad/s</span>
                  </div>
                  <input
                    id="input-source-frequency"
                    suppressHydrationWarning
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.2"
                    value={params.sourceFrequency}
                    onChange={e => handleSliderChange('sourceFrequency', parseFloat(e.target.value))}
                    className="w-full accent-blue-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-300 mb-1">
                    <span>Source Power (P_in)</span>
                    <span className="text-emerald-300">{params.sourcePower.toFixed(0)} W</span>
                  </div>
                  <input
                    id="input-source-power"
                    suppressHydrationWarning
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={params.sourcePower}
                    onChange={e => handleSliderChange('sourcePower', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formulations Section */}
          {activeSection === 'formulations' && (
            <div className="space-y-2 text-[11px] font-mono text-slate-300">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">CENTRAL AXIS ARCHITECTURE:</span>
                <code>N₀(t) → E(r,t), H(r,t) → Σ(t) → &#123;P₁(t)...Pₙ(t)&#125;</code>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-sky-400 font-bold block mb-1">POYNTING VECTOR THREAD:</span>
                <code>S(r, t) = E(r, t) × H(r, t)</code>
                <span className="block text-slate-500 text-[10px] mt-0.5">
                  Direction & density of local electromagnetic power flow.
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">POLYGON ECOSYSTEM:</span>
                <code>G_n: θ_k = 2πk / n,  k ∈ [0, n-1]</code>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-purple-400 font-bold block mb-1">COUPLED SOLUTION:</span>
                <code>S_global = F(E₁, E₂, ..., K_ij)</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
