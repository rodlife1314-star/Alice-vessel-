'use client';

import React, { useMemo, useState } from 'react';
import {
  SimulationParameters,
  GeometryType,
  GEOMETRY_DEFINITIONS,
  runComparativeExperiment,
  GeometryExperimentMetrics,
  OptimalityWeights,
  DEFAULT_OPTIMALITY_WEIGHTS,
} from '@/lib/physics-engine';
import { G6CausalChallenge } from './G6CausalChallenge';
import {
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Activity,
  Sliders,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Copy,
  Check,
  Zap,
  Award,
  Scale,
} from 'lucide-react';

interface GeometryExperimentSuiteProps {
  currentParams: SimulationParameters;
  onSelectGeometry: (geom: GeometryType) => void;
  onUpdateParams?: (updates: Partial<SimulationParameters>) => void;
}

export default function GeometryExperimentSuite({
  currentParams,
  onSelectGeometry,
  onUpdateParams,
}: GeometryExperimentSuiteProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'distribution_vectors' | 'causal_challenge' | 'hypothesis'>('matrix');
  const [sortBy, setSortBy] = useState<'order' | 'optimality' | 'efficiency' | 'uniformity' | 'sensitivity'>('optimality');
  const [copied, setCopied] = useState<boolean>(false);

  // Optimality Weights state: J_n = w_eta * eta + w_u * U - w_l * Loss
  const [optimalityWeights, setOptimalityWeights] = useState<OptimalityWeights>(
    currentParams.optimalityWeights || DEFAULT_OPTIMALITY_WEIGHTS
  );

  // Run controlled experiment with current parameters locked constant
  const results = useMemo(() => {
    return runComparativeExperiment({
      ...currentParams,
      optimalityWeights,
    }, 0);
  }, [currentParams, optimalityWeights]);

  // Reference geometry G6 metrics
  const g6Ref = useMemo(() => {
    return results.find(r => r.geometryId === 'G6') || results[0];
  }, [results]);

  // Optimal winning geometry G* = argmax J_n
  const optimalGeom = useMemo(() => {
    return results.reduce((prev, curr) => (curr.optimalityScore > prev.optimalityScore ? curr : prev), results[0]);
  }, [results]);

  // Filter specifically for n=3, 4, 5, 6, 8 (as requested) + G_inf
  const sortedResults = useMemo(() => {
    const list = [...results];
    if (sortBy === 'optimality') list.sort((a, b) => b.optimalityScore - a.optimalityScore);
    else if (sortBy === 'efficiency') list.sort((a, b) => b.efficiency - a.efficiency);
    else if (sortBy === 'uniformity') list.sort((a, b) => b.uniformity - a.uniformity);
    else if (sortBy === 'sensitivity') list.sort((a, b) => b.sensitivityJacobianZ - a.sensitivityJacobianZ);
    return list;
  }, [results, sortBy]);

  const handleCopyReport = () => {
    const isPowerMode = currentParams.reflectionMode === 'power_fraction';
    const lines = [
      `# ELECTROMAGNETIC ENERGY DISTRIBUTION & OPTIMALITY BENCHMARK REPORT`,
      `Constant Conditions: Source Height z0 = ${currentParams.sourceHeight.toFixed(1)} px | Total Receiver Area A_total = 1.0 | Input Power P_in = ${currentParams.sourcePower.toFixed(0)} W | Frequency omega = ${currentParams.sourceFrequency.toFixed(1)} rad/s | Permittivity eps_r = ${currentParams.permittivity.toFixed(1)}`,
      `Boundary Reflection Interpretation: ${isPowerMode ? `Power Fraction R = ${currentParams.boundaryReflection.toFixed(2)} (|Gamma| = ${Math.sqrt(currentParams.boundaryReflection).toFixed(3)})` : `Amplitude |Gamma| = ${currentParams.boundaryReflection.toFixed(2)} (Power R = ${(currentParams.boundaryReflection ** 2).toFixed(3)})`}`,
      `Objective Optimality Function: J_n = ${optimalityWeights.wEta}*eta + ${optimalityWeights.wU}*U - ${optimalityWeights.wL}*(P_loss/P_in)`,
      `Optimal Geometry G*: ${optimalGeom.name} (J = ${optimalGeom.optimalityScore.toFixed(3)})`,
      ``,
      `| Geometry (n) | Rank | J_n Score | Captured (W) | Boundary Loss (W) | Ohmic Loss (W) | Efficiency eta | Uniformity U | Axial ||J_z|| | Chord L/R |`,
      `|---|---|---|---|---|---|---|---|---|---|`,
    ];

    for (const r of sortedResults) {
      lines.push(
        `| ${r.name} | #${r.optimalityRank || '-'} | ${r.optimalityScore.toFixed(3)} | ${r.totalCapturedPower.toFixed(2)} W | ${r.boundaryLossPower.toFixed(2)} W | ${r.ohmicLossPower.toFixed(2)} W | ${(r.efficiency * 100).toFixed(1)}% | ${(r.uniformity * 100).toFixed(1)}% | ${r.sensitivityJacobianZ.toFixed(3)} W/px | ${(r.chordLengthNearest / currentParams.radius).toFixed(2)} |`
      );
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="geometry-experiment-suite" className="flex flex-col w-full h-full bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              PHYSICAL EXPERIMENT PROGRAMME
            </span>
            <h2 className="text-base font-bold text-slate-100 font-mono tracking-tight">
              G_n Systematic Geometry Topology Suite
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating <code className="text-amber-400 font-mono">G₃, G₄, G₅, G₆ (Reference), G₈, G_∞</code> under strictly constant source height <code className="text-sky-300 font-mono">z₀={currentParams.sourceHeight.toFixed(1)}</code>, total receiver area <code className="text-sky-300 font-mono">A_tot=1.0</code>, and power <code className="text-sky-300 font-mono">P_in={currentParams.sourcePower.toFixed(0)}W</code>.
          </p>
        </div>

        {/* Header Controls & Export */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            id="btn-copy-benchmark-report"
            onClick={handleCopyReport}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              copied
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Copy comparative experimental dataset as formatted scientific Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copied ? 'Report Copied!' : 'Copy Benchmark Report'}</span>
          </button>

          {/* Tab Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              id="tab-matrix"
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'matrix' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Metrics Matrix
            </button>
            <button
              id="tab-distribution-vectors"
              onClick={() => setActiveTab('distribution_vectors')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'distribution_vectors' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nodal Vector [P₁...Pₙ]
            </button>
            <button
              id="tab-causal-challenge"
              onClick={() => setActiveTab('causal_challenge')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'causal_challenge' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm font-semibold' : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>G₆ Causal Challenge</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                ACTIVE
              </span>
            </button>
            <button
              id="tab-hypothesis"
              onClick={() => setActiveTab('hypothesis')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'hypothesis' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Epistemic Audit (H₁-H₃)
            </button>
          </div>
        </div>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'matrix' && (
        <div className="flex flex-col gap-4">
          {/* Epistemic Conclusion Relabeling Banner */}
          <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div className="text-xs text-slate-200">
                <span className="font-mono font-bold text-amber-300">Doctrine Re-evaluation:</span>{' '}
                <strong className="text-slate-100 font-mono">G₆ is a symmetry-perfect reference state, not yet proven resonance.</strong>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  Observed 100% uniformity at 6 discrete nodes is a consequence of preserving D₆ symmetry. Optimal geometry G* must earn its status via the objective function J_n.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                P₁ = P₂ = ... = P₆ (Symmetry)
              </span>
            </div>
          </div>

          {/* Objective Function J_n & Steady-State Energy Balance Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Optimality Function Controller (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-tight">
                    Objective Optimality Index: J_n = w_η·η_n + w_U·U_n - w_L·(P_loss/P_in)
                  </h4>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 font-bold">Winner G*: {optimalGeom.name}</span>
                </div>
              </div>

              {/* Weight Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <span className="text-slate-500 text-[10px]">Presets:</span>
                <button
                  id="preset-balanced"
                  onClick={() => setOptimalityWeights({ wEta: 0.50, wU: 0.35, wL: 0.15 })}
                  className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
                    optimalityWeights.wEta === 0.50 && optimalityWeights.wU === 0.35
                      ? 'bg-sky-950 border-sky-500 text-sky-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Balanced (50/35/15)
                </button>
                <button
                  id="preset-efficiency"
                  onClick={() => setOptimalityWeights({ wEta: 0.70, wU: 0.15, wL: 0.15 })}
                  className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
                    optimalityWeights.wEta === 0.70
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Efficiency-First (70/15/15)
                </button>
                <button
                  id="preset-uniformity"
                  onClick={() => setOptimalityWeights({ wEta: 0.20, wU: 0.70, wL: 0.10 })}
                  className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
                    optimalityWeights.wU === 0.70
                      ? 'bg-sky-950 border-sky-500 text-sky-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Uniformity-First (20/70/10)
                </button>
                <button
                  id="preset-lowloss"
                  onClick={() => setOptimalityWeights({ wEta: 0.35, wU: 0.25, wL: 0.40 })}
                  className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
                    optimalityWeights.wL === 0.40
                      ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Loss Penalty (35/25/40)
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-0.5">
                    <span>w_η (Efficiency):</span>
                    <span className="text-emerald-300 font-bold">{optimalityWeights.wEta.toFixed(2)}</span>
                  </div>
                  <input
                    id="slider-w-eta"
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={optimalityWeights.wEta}
                    onChange={e => setOptimalityWeights(prev => ({ ...prev, wEta: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-0.5">
                    <span>w_U (Uniformity):</span>
                    <span className="text-sky-300 font-bold">{optimalityWeights.wU.toFixed(2)}</span>
                  </div>
                  <input
                    id="slider-w-u"
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={optimalityWeights.wU}
                    onChange={e => setOptimalityWeights(prev => ({ ...prev, wU: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-0.5">
                    <span>w_L (Loss Penalty):</span>
                    <span className="text-rose-300 font-bold">{optimalityWeights.wL.toFixed(2)}</span>
                  </div>
                  <input
                    id="slider-w-l"
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={optimalityWeights.wL}
                    onChange={e => setOptimalityWeights(prev => ({ ...prev, wL: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-400"
                  />
                </div>
              </div>
            </div>

            {/* Steady-State Energy Balance Card (5 cols) */}
            <div className="lg:col-span-5 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-tight">
                  Steady-State Energy Balance (dU/dt = 0)
                </h4>
                {/* Reflection Mode Toggle */}
                <button
                  id="btn-toggle-refl-mode"
                  onClick={() => {
                    const nextMode = currentParams.reflectionMode === 'power_fraction' ? 'amplitude_gamma' : 'power_fraction';
                    if (onUpdateParams) onUpdateParams({ reflectionMode: nextMode });
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-amber-300 hover:bg-slate-850"
                  title="Toggle between |Gamma| amplitude reflection and R power reflection fraction"
                >
                  Mode: {currentParams.reflectionMode === 'power_fraction' ? 'Power R' : 'Amplitude |Γ|'}
                </button>
              </div>

              <div className="font-mono text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-850 space-y-1">
                <div className="text-emerald-400 font-semibold">
                  P_in ({currentParams.sourcePower}W) = P_nodes ({g6Ref.totalCapturedPower.toFixed(2)}W) + P_loss ({(currentParams.sourcePower - g6Ref.totalCapturedPower).toFixed(2)}W)
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800">
                  <span>↳ P_boundary (Reflected): <strong className="text-amber-300">{g6Ref.boundaryLossPower.toFixed(2)} W</strong></span>
                  <span>↳ P_ohmic (Dissipated): <strong className="text-rose-300">{g6Ref.ohmicLossPower.toFixed(2)} W</strong></span>
                  <span>↳ P_leak: <strong className="text-slate-300">{g6Ref.leakageLossPower.toFixed(2)} W</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Boundary |Γ| = {g6Ref.amplitudeGamma.toFixed(2)}</span>
                <span>Power Reflection R = {(g6Ref.powerReflectionFraction * 100).toFixed(1)}%</span>
                <span>Conductivity σ = {currentParams.conductivity.toFixed(2)} S/m</span>
              </div>
            </div>
          </div>

          {/* Controls & Quick Filter */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Reference Baseline: <strong className="text-amber-400 font-mono">G₆ Hexagon (6-node)</strong> | Chord <code className="text-amber-300 font-mono">L=R ({currentParams.radius}px)</code></span>
            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <button
                onClick={() => setSortBy('optimality')}
                className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                  sortBy === 'optimality' ? 'bg-amber-950 text-amber-300 border-amber-600' : 'border-slate-800 text-slate-500'
                }`}
              >
                Optimality J_n
              </button>
              <button
                onClick={() => setSortBy('order')}
                className={`px-2 py-0.5 rounded border text-[11px] ${
                  sortBy === 'order' ? 'bg-slate-800 text-slate-200 border-slate-600' : 'border-slate-800 text-slate-500'
                }`}
              >
                Polygon n
              </button>
              <button
                onClick={() => setSortBy('efficiency')}
                className={`px-2 py-0.5 rounded border text-[11px] ${
                  sortBy === 'efficiency' ? 'bg-slate-800 text-slate-200 border-slate-600' : 'border-slate-800 text-slate-500'
                }`}
              >
                Efficiency η
              </button>
              <button
                onClick={() => setSortBy('uniformity')}
                className={`px-2 py-0.5 rounded border text-[11px] ${
                  sortBy === 'uniformity' ? 'bg-slate-800 text-slate-200 border-slate-600' : 'border-slate-800 text-slate-500'
                }`}
              >
                Uniformity U
              </button>
              <button
                onClick={() => setSortBy('sensitivity')}
                className={`px-2 py-0.5 rounded border text-[11px] ${
                  sortBy === 'sensitivity' ? 'bg-slate-800 text-slate-200 border-slate-600' : 'border-slate-800 text-slate-500'
                }`}
              >
                Sensitivity ||J_z||
              </button>
            </div>
          </div>

          {/* Comparative Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Geometry Ecosystem</th>
                  <th className="py-2.5 px-2 text-center">Rank</th>
                  <th className="py-2.5 px-2 text-right">Score J_n</th>
                  <th className="py-2.5 px-3 text-right">Captured (W)</th>
                  <th className="py-2.5 px-3 text-right">P_bound (W)</th>
                  <th className="py-2.5 px-3 text-right">P_ohmic (W)</th>
                  <th className="py-2.5 px-3 text-right">Efficiency (ηₙ)</th>
                  <th className="py-2.5 px-3 text-right">Uniformity (Uₙ)</th>
                  <th className="py-2.5 px-3 text-right">Axial ||J_z||</th>
                  <th className="py-2.5 px-3 text-right">Nearest L (L/R)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {sortedResults.map(item => {
                  const isCurrent = item.geometryId === currentParams.geometry;
                  const isRef = item.geometryId === 'G6';
                  const isTopRank = item.optimalityRank === 1;
                  const chordRatio = item.chordLengthNearest / currentParams.radius;

                  return (
                    <tr
                      key={item.geometryId}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        isCurrent ? 'bg-sky-950/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          {isTopRank && (
                            <span title="Rank 1 Winner under current J_n">
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                            </span>
                          )}
                          <span>{item.name}</span>
                          {item.sampleType === 'continuous_manifold' && (
                            <span className="text-[9px] bg-purple-900/60 text-purple-300 border border-purple-700/40 px-1 rounded">Continuum</span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1 rounded">Active</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-300">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isTopRank ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
                        }`}>
                          #{item.optimalityRank || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-amber-400">
                        {item.optimalityScore.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                        {item.totalCapturedPower.toFixed(2)} W
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-mono text-[11px]">
                        {item.boundaryLossPower.toFixed(2)} W
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-300 font-mono text-[11px]">
                        {item.ohmicLossPower.toFixed(2)} W
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-slate-200 font-semibold">
                            {(item.efficiency * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-medium ${
                            item.uniformity > 0.85
                              ? 'text-sky-300'
                              : item.uniformity > 0.65
                              ? 'text-amber-300'
                              : 'text-rose-400'
                          }`}
                        >
                          {(item.uniformity * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300 font-mono">
                        {item.sensitivityJacobianZ.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={isRef ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {item.chordLengthNearest.toFixed(0)}px ({chordRatio.toFixed(2)})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          id={`btn-load-${item.geometryId}`}
                          onClick={() => onSelectGeometry(item.geometryId)}
                          className={`px-2 py-1 text-[11px] rounded transition-colors ${
                            isCurrent
                              ? 'bg-sky-500 text-white font-semibold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {isCurrent ? 'Simulating' : 'Simulate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Key Findings Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Highest Efficiency
              </span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {results.reduce((prev, curr) => (curr.efficiency > prev.efficiency ? curr : prev)).name}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Averaging highest Poynting flux capture under current z₀.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Maximum Uniformity U_n
              </span>
              <div className="text-lg font-bold font-mono text-sky-400">
                {results.reduce((prev, curr) => (curr.uniformity > prev.uniformity ? curr : prev)).name}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Equal angular phase delay distribution with minimal divergence.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Central Axis Sensitivity (∂P/∂z₀)
              </span>
              <div className="text-lg font-bold font-mono text-amber-400">
                {results.reduce((prev, curr) => (curr.sensitivityJacobianZ > prev.sensitivityJacobianZ ? curr : prev)).name}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Highest sensitivity to axial source motion and vertical threading.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nodal Vector Distribution Tab */}
      {activeTab === 'distribution_vectors' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-slate-400">
            Nodal partition breakdown: <code className="text-amber-400 font-mono">P_in = Σ P_i + P_loss</code> for each polygon ecosystem:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map(item => (
              <div
                key={item.geometryId}
                className={`p-3 rounded-lg border bg-slate-950 flex flex-col gap-2.5 ${
                  item.geometryId === currentParams.geometry
                    ? 'border-sky-500/60 shadow-lg shadow-sky-950/40'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs font-mono text-slate-200">
                      {item.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono">
                      Chord: {item.chordLengthNearest.toFixed(1)}px (L/R={(item.chordLengthNearest / currentParams.radius).toFixed(2)})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    Captured: {item.totalCapturedPower.toFixed(2)}W / {item.inputPower}W ({ (item.efficiency * 100).toFixed(1)}%)
                  </span>
                </div>

                {/* Explicit Vector Representation */}
                <div className="bg-slate-900/90 rounded p-2 border border-slate-850 font-mono text-[11px] space-y-1">
                  <div className="flex items-start gap-1">
                    <span className="text-amber-400 font-bold whitespace-nowrap">P_{item.nodeCount} Vector:</span>
                    <span className="text-sky-300 break-all">
                      [{item.powers.map(p => p.toFixed(3)).join(', ')}] W
                    </span>
                  </div>
                  <div className="flex items-start gap-1 text-[10px] text-slate-400">
                    <span className="text-slate-500 whitespace-nowrap">Jacobian J_z:</span>
                    <span className="break-all">
                      [{item.jacobianVectorZ.map(j => j.toFixed(4)).join(', ')}] W/px
                    </span>
                  </div>
                  <div className="flex items-start gap-1 text-[10px] text-slate-400">
                    <span className="text-slate-500 whitespace-nowrap">Scale J_R:</span>
                    <span className="break-all">
                      [{item.jacobianVectorR.map(j => j.toFixed(4)).join(', ')}] W/px
                    </span>
                  </div>
                </div>

                {/* Bars for each P_i */}
                <div className="flex items-end gap-1.5 h-16 pt-2 pb-1 border-b border-slate-850">
                  {item.powers.map((p, idx) => {
                    const maxP = Math.max(...item.powers, 0.1);
                    const heightPercent = Math.max(8, (p / maxP) * 100);
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        <div
                          className="w-full bg-sky-500 rounded-t transition-all group-hover:bg-amber-400"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[9px] font-mono text-slate-400">
                          P{idx + 1}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                          {p.toFixed(3)}W | Jz: {item.jacobianVectorZ[idx]?.toFixed(3)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Uniformity U_{item.nodeCount}: <strong className="text-slate-200">{(item.uniformity * 100).toFixed(1)}%</strong></span>
                  <span>Sensitivity ||J_z||: <strong className="text-amber-400">{item.sensitivityJacobianZ.toFixed(3)}</strong></span>
                  <span>Loss P_loss: <strong className="text-rose-400">{item.lossPower.toFixed(2)}W</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* G6 Causal Challenge Tab */}
      {activeTab === 'causal_challenge' && (
        <G6CausalChallenge
          params={currentParams}
          onUpdateParams={onUpdateParams}
          onSelectGeometry={onSelectGeometry}
        />
      )}

      {/* Epistemic Audit Tab */}
      {activeTab === 'hypothesis' && (
        <div className="flex flex-col gap-4 text-xs">
          {/* Epistemic Principle Header */}
          <div className="p-4 rounded-lg bg-slate-950 border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                Epistemic Standard: Distinguishing Simulation Artifacts from Physical Causality
              </h3>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800 text-amber-300 font-mono text-center font-bold text-xs">
              observed simulation result ≠ physical cause
            </div>
            <p className="text-slate-300 leading-relaxed pt-1">
              Holding source parameters constant (height <code className="text-sky-300 font-mono">z₀</code>, power <code className="text-sky-300 font-mono">P_in</code>, frequency <code className="text-sky-300 font-mono">ω</code>, radius <code className="text-sky-300 font-mono">R</code>, aperture area <code className="text-sky-300 font-mono">A_tot</code>) successfully isolates geometry as the principal manipulated variable. However, an observed efficiency peak in a discrete geometry simulation does not by itself prove electromagnetic resonance until subjected to deliberate falsification challenges.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider text-sky-400">
              Three Distinct Mechanistic Hypotheses
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* H1 */}
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">Hypothesis H₁</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50">Under Test</span>
                </div>
                <div className="font-semibold text-slate-200 text-[11px]">Hexagonal Resonance vs Geometry Identity</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  In G₆, regular chord length equals circumradius (<code className="text-slate-300 font-mono">c₆ = R</code>). H₁ asserts that constructive boundary wave circulation coincides with radial arrival when <code className="text-slate-300 font-mono">Δϕ_rad ≈ Δϕ_bnd (mod 2π)</code>. Falsification requires testing if peak efficiency decouples from this phase condition across continuous frequency sweeps.
                </p>
              </div>

              {/* H2 */}
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400">Hypothesis H₂</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">Supported</span>
                </div>
                <div className="font-semibold text-slate-200 text-[11px]">Spatial Inversion Parity Bifurcation</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Even-order polygons (<code className="text-slate-300">G₄, G₆, G₈</code>) possess antipodal inversion symmetry (<code className="text-slate-300 font-mono">r → -r</code>) that preserves higher field uniformity <code className="text-slate-300 font-mono">U_n</code> under transverse translation <code className="text-slate-300 font-mono">δx</code>, whereas odd polygons (<code className="text-slate-300">G₃, G₅</code>) lack antipodal pairs and exhibit asymmetric vortex shearing.
                </p>
              </div>

              {/* H3 */}
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-400">Hypothesis H₃</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50">Refined</span>
                </div>
                <div className="font-semibold text-slate-200 text-[11px]">Discrete Spatial Low-Pass Scaling</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Higher vertex counts <code className="text-slate-300 font-mono">n</code> provide finer discrete sampling of the circular wavefront, smoothing out localized shadow zones and damping sensitivity <code className="text-slate-300 font-mono">||J_z||_2</code>, converging as <code className="text-slate-300 font-mono">n → ∞</code> to the continuous uniform radial flux <code className="text-slate-300 font-mono">S_r ~ 1/r</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="text-amber-400 font-semibold">FORMULATION EQUIVALENCE:</div>
            <div>Source Trajectory: <span className="text-slate-200">N₀(t) = (x₀, y₀, z₀)</span></div>
            <div>Poynting Thread: <span className="text-slate-200">S(r, t) = E(r, t) × H(r, t)</span></div>
            <div>Redistribution Law: <span className="text-slate-200">P_in = Σ P_i(G(t), ω, φ, M) + P_loss</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
