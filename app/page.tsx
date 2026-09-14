'use client';

import React, { useState } from 'react';
import {
  SimulationParameters,
  GeometryType,
  GEOMETRY_DEFINITIONS,
  ProbeMeasurement,
} from '@/lib/physics-engine';
import FieldCanvas from '@/components/FieldCanvas';
import OperatorDashboard from '@/components/OperatorDashboard';
import GeometryExperimentSuite from '@/components/GeometryExperimentSuite';
import VesselEngineArchitecture from '@/components/VesselEngineArchitecture';
import TheoreticalSynthesisModal from '@/components/TheoreticalSynthesisModal';
import TransportMediumView from '@/components/TransportMediumView';
import { VolumetricCavityTransformer } from '@/components/VolumetricCavityTransformer';
import CCV01VehicleStudio from '@/components/CCV01VehicleStudio';
import {
  Activity,
  Layers,
  Sparkles,
  Zap,
  BarChart2,
  Compass,
  FileText,
  Sliders,
  CheckCircle2,
  Maximize2,
  Navigation,
  Network,
  Box,
  Scale,
  ShieldAlert,
  Rocket,
} from 'lucide-react';

export default function Page() {
  // Global Simulation State
  const [params, setParams] = useState<SimulationParameters>({
    geometry: 'G6', // Reference geometry
    sourceFrequency: 2.8,
    sourcePower: 45,
    sourceHeight: 12.0,
    sourceOffsetX: 0,
    sourceOffsetY: 0,
    motionPreset: 'static',
    motionSpeed: 1.0,
    permittivity: 2.2,
    conductivity: 0.15,
    boundaryReflection: 0.45,
    couplingConstant: 0.35,
    radius: 175,
    vesselMode: 'cruise_gamma_0',
    activeCorridor: 'corridor_solar_wind',
  });

  const [activeTab, setActiveTab] = useState<
    'workbench' | 'vessel_engine' | 'transport_medium' | 'ccv01_vehicle' | 'volumetric_cavity' | 'comparative_lab' | 'formulations'
  >('workbench');
  const [probeData, setProbeData] = useState<ProbeMeasurement | null>(null);
  const [nodalTelemetry, setNodalTelemetry] = useState<{
    powers: number[];
    efficiency: number;
    uniformity: number;
  }>({
    powers: [5.2, 5.1, 5.3, 5.0, 5.2, 5.1],
    efficiency: 0.69,
    uniformity: 0.96,
  });
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  const currentGeom = GEOMETRY_DEFINITIONS[params.geometry];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Header: Two-Row Non-Overlapping Layout */}
      <header
        id="app-header"
        className="w-full bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex flex-col gap-2 z-20 shadow-md"
      >
        {/* Row 1: Brand, Title, and Telemetry Pills */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-sky-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black text-xs shrink-0">
              🪡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold font-mono tracking-tight text-white whitespace-nowrap">
                  Electromagnetic Poynting Field Architecture
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  PASS THE THREAD THROUGH THE CENTRE
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 font-mono">
                Central Axis <span className="text-amber-400">N₀(t)</span> • Poynting Flow <span className="text-sky-400">S = E × H</span> • Corridor Coupling <span className="text-emerald-400">CCV-01</span>
              </p>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <div className="hidden lg:flex items-center gap-1.5">
              <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                Mode: <span className={params.vesselMode === 'vectoring_gamma_delta' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {params.vesselMode === 'vectoring_gamma_delta' ? 'Γ_δ' : 'Γ₀'}
                </span>
              </div>
              <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                Geometry: <span className="text-amber-400 font-bold">{currentGeom.name}</span>
              </div>
              <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                η: <span className="text-emerald-400 font-bold">{(nodalTelemetry.efficiency * 100).toFixed(0)}%</span>
              </div>
            </div>
            <button
              id="btn-open-synthesis-header"
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-medium transition-colors"
              title="Open AI Theoretical Synthesis"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Synthesis</span>
            </button>
          </div>
        </div>

        {/* Row 2: Dedicated Horizontal Tab Navigation Bar (Never Wraps Onto Workspace) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs font-mono border-t border-slate-800/80">
          {/* Domain 1: Field Workbench */}
          <button
            id="nav-tab-workbench"
            onClick={() => setActiveTab('workbench')}
            className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'workbench'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs">1. Field Workbench</span>
          </button>

          {/* Domain 2: Phase 2: Vessel as Engine */}
          <button
            id="nav-tab-vessel-engine"
            onClick={() => setActiveTab('vessel_engine')}
            className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'vessel_engine'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs">2. Phase 2: Vessel as Engine</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-500/40">
              Γ₀/Γ_δ
            </span>
          </button>

          {/* Domain 3: Rail Infrastructure */}
          <button
            id="nav-tab-transport-medium"
            onClick={() => setActiveTab('transport_medium')}
            className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'transport_medium'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <Network className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs">3. Rail Infrastructure</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-bold">
              𝒯 = ℛ ⊕ 𝒱
            </span>
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-800 shrink-0 mx-1" />

          {/* Specialized Modules */}
          <button
            id="nav-tab-ccv01"
            onClick={() => setActiveTab('ccv01_vehicle')}
            className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'ccv01_vehicle'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>CCV-01 Vehicle Studio</span>
          </button>

          <button
            id="nav-tab-volumetric-cavity"
            onClick={() => setActiveTab('volumetric_cavity')}
            className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'volumetric_cavity'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>3D Cavity (Ω_G)</span>
          </button>

          <button
            id="nav-tab-comparative"
            onClick={() => setActiveTab('comparative_lab')}
            className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'comparative_lab'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 shrink-0" />
            <span>G_n Comparative Suite</span>
          </button>

          <button
            id="nav-tab-formulations"
            onClick={() => setActiveTab('formulations')}
            className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'formulations'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Physics Manifesto</span>
          </button>
        </div>
      </header>

      {/* Main App Content Body - Fluid, non-clipped */}
      <div className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-4 flex flex-col gap-4">
        {/* VIEW 0: CCV-01 CORRIDOR COUPLING VEHICLE */}
        {activeTab === 'ccv01_vehicle' && (
          <div className="flex-1">
            <CCV01VehicleStudio
              onNavigateToWorkbench={() => setActiveTab('workbench')}
              onOpenAiSynthesis={() => setIsAiModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 1: FIELD WORKBENCH */}
        {activeTab === 'workbench' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
            {/* Left 7 Cols: Interactive Canvas */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full">
              <FieldCanvas
                params={params}
                onParamsChange={setParams}
                onProbeUpdate={setProbeData}
                onNodalUpdate={setNodalTelemetry}
              />
            </div>

            {/* Right 5 Cols: Operator Controls & Telemetry */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full">
              <OperatorDashboard
                params={params}
                onParamsChange={setParams}
                nodalTelemetry={nodalTelemetry}
                onOpenAiSynthesis={() => setIsAiModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: PHASE 2 VESSEL AS ENGINE COCKPIT & ARCHITECTURE */}
        {activeTab === 'vessel_engine' && (
          <div className="flex-1 flex flex-col min-h-[640px]">
            <VesselEngineArchitecture
              params={params}
              onUpdateParams={(updates) => setParams(prev => ({ ...prev, ...updates }))}
              onOpenWorkbench={() => setActiveTab('workbench')}
              onOpenAiSynthesis={() => setIsAiModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 2.5: SOVEREIGN TRANSPORT MEDIUM & RAIL INFRASTRUCTURE (T = R ⊕ V) */}
        {activeTab === 'transport_medium' && (
          <div className="flex-1 overflow-y-auto">
            <TransportMediumView />
          </div>
        )}

        {/* VIEW 3: COMPARATIVE GEOMETRY LABORATORY */}
        {activeTab === 'comparative_lab' && (
          <div className="flex-1 flex flex-col min-h-[640px]">
            <GeometryExperimentSuite
              currentParams={params}
              onSelectGeometry={(geom: GeometryType) => {
                setParams(prev => ({ ...prev, geometry: geom }));
                setActiveTab('workbench');
              }}
              onUpdateParams={(updates) => setParams(prev => ({ ...prev, ...updates }))}
            />
          </div>
        )}

        {/* VIEW 4: 3D VOLUMETRIC CAVITY TRANSFORMER (Ω_G) */}
        {activeTab === 'volumetric_cavity' && (
          <div className="flex-1 flex flex-col min-h-[640px]">
            <VolumetricCavityTransformer />
          </div>
        )}

        {/* VIEW 5: FULL THEORETICAL FORMULATIONS & PHYSICAL MANIFESTO */}
        {activeTab === 'formulations' && (
          <div className="flex-1 overflow-y-auto bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  Physical & Mathematical Manifesto
                </span>
                <h2 className="text-xl font-bold font-mono text-slate-100 mt-1">
                  Electromagnetic Volumetric Cavity Architecture & Epistemic Doctrine
                </h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Moving electromagnetic energy is not a fixed lump traveling down a pipe; it is an evolving field configuration propagating through 3D interior volume <code className="text-cyan-300 font-mono">Ω_G</code> and interacting with conductive and dielectric boundaries.
                </p>
              </div>

              {/* Epistemic Doctrine Warning Banner */}
              <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/40 text-xs text-amber-200 leading-relaxed font-mono flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-amber-300 block">
                    Epistemic Principle: Observed Simulation Result ≠ Physical Cause
                  </strong>
                  <p className="text-slate-300">
                    Uniformity across nodes (<code className="text-sky-300">U₆ = 100%</code>) is a mathematically guaranteed consequence of preserved spatial symmetry (<code className="text-slate-200">D₆</code> dihedral invariance with an on-axis source), <strong>not proof of intrinsic cavity resonance</strong>.
                  </p>
                  <div className="text-amber-300 font-bold pt-0.5">
                    &quot;G₆ is a symmetry-perfect reference state, not yet proven resonance.&quot;
                  </div>
                </div>
              </div>

              {/* Formulation Box: 2D vs 3D Volumetric Cavity */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono space-y-3">
                <span className="text-xs text-cyan-400 font-bold block uppercase">
                  1. Geometry as a Volumetric Field Transformer:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  In 2D, a regular polygon mostly provides boundary positions and symmetry. In 3D, the corresponding polyhedron provides an <strong>internal volume (Ω_G), multiple faces, outward normals, cavities, standing-wave paths, and mode structure</strong>.
                </p>
                <div className="p-3 rounded bg-slate-900 text-cyan-300 text-xs border border-slate-850 text-center font-bold">
                  A_in ───→ Ω_G ───→ &#123;E(r), H(r)&#125;_(r ∈ Ω_G) ───→ A_out
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-cyan-400">Internal Reflections:</strong> Multiple facet bounces govern wavefront interference.
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-cyan-400">Standing Modes:</strong> 3D cavity eigenvalue modes TE_mnp & TM_mnp.
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-cyan-400">Phase Evolution:</strong> Volumetric optical path-length distribution.
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-cyan-400">Field Concentration:</strong> Corner vs face centroid energy density.
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-cyan-400">Polarization:</strong> Geometric boundary rotation of Poynting vector.
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-cyan-400">Exit Coupling:</strong> Aperture matching and transmission efficiency.
                  </div>
                </div>
              </div>

              {/* Formulation Box: Rigorous Energy Conservation */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono space-y-2">
                <span className="text-xs text-emerald-400 font-bold block uppercase flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  2. Steady-State Energy Balance Law:
                </span>
                <div className="p-3 rounded bg-slate-900 text-emerald-300 text-xs border border-slate-850 font-bold">
                  P_in = P_nodes + P_boundary + P_ohmic + P_leakage, &nbsp;&nbsp; with &nbsp; dU_field/dt = 0
                </div>
                <div className="text-xs text-slate-400 space-y-1 pt-1 font-sans">
                  <div>• <code className="text-sky-300 font-mono">P_nodes</code>: Power coupled into receiver pickup probes/apertures.</div>
                  <div>• <code className="text-amber-300 font-mono">P_boundary</code>: Poynting power reflected or dissipated across conductor/dielectric walls.</div>
                  <div>• <code className="text-rose-300 font-mono">P_ohmic</code>: Joule heating dissipation (σ |E|² dV) in lossy interior medium.</div>
                  <div>• <code className="text-purple-300 font-mono">P_leakage</code>: Radiative aperture leakage into exterior far-field.</div>
                </div>
              </div>

              {/* Formulation Box: Optimality Metric */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono space-y-2">
                <span className="text-xs text-amber-400 font-bold block uppercase">
                  3. Objective Optimization Metric (J_n):
                </span>
                <div className="p-3 rounded bg-slate-900 text-amber-300 text-xs border border-slate-850 font-bold">
                  J_n = w_η · η_n + w_U · U_n - w_L · (P_loss / P_in)
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  A geometry is truly superior only if it maximizes the scalar objective <code className="text-amber-300 font-mono">J_n</code> across swept frequency bands and off-axis source translations, rather than relying solely on on-axis nodal equality.
                </p>
              </div>

              {/* Formulation Box: 3D Polyhedral Topologies */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono space-y-2">
                <span className="text-xs text-sky-400 font-bold block uppercase">
                  4. The Polyhedral Cavity Topologies:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <strong className="text-sky-400">Tetrahedron (P₄):</strong> 4 triangular faces, highest volume-to-surface loss, strong corner diffraction.
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <strong className="text-sky-400">Cube / Hexahedron (P₆):</strong> 6 square faces, orthogonal Cartesian standing waves, degenerate modes.
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <strong className="text-sky-400">Octahedron (P₈):</strong> 8 triangular faces, dual of cube, symmetric diagonal focusing.
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <strong className="text-cyan-400">Hexagonal Prism (H₆):</strong> 8 faces (2 hexagonal bases + 6 rectangular walls); extrusion of G₆.
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <strong className="text-sky-400">Dodecahedron (P₁₂):</strong> 12 pentagonal faces, icosahedral symmetry, quasi-isotropic field dispersion.
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <strong className="text-purple-400">Icosahedron (P₂₀):</strong> 20 triangular faces, close spherical approximation, uniform mode density.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-500/40 text-xs text-purple-200 leading-relaxed font-mono flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-300 block mb-1">
                    The Operator&apos;s Principle:
                  </strong>
                  &quot;Operator sees the observable projection of the hidden field topology.&quot; In this laboratory, the operator reads the emergent Poynting flux streamlines, volumetric mode distributions, and impedance transformations rather than treating geometry as passive decoration.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Synthesis Modal */}
      <TheoreticalSynthesisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        params={params}
        nodalTelemetry={nodalTelemetry}
      />
    </main>
  );
}
