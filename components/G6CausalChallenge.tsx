'use client';

import React, { useState, useMemo } from 'react';
import {
  SimulationParameters,
  GeometryType,
  runG6FrequencySweep,
  runG6SymmetryBreakingExperiment,
  runTransverseSweep,
  evaluateHypotheses,
  PhaseConditionPoint,
  SymmetryBreakingPoint,
  TransverseSweepPoint,
  CausalHypothesisVerdict,
} from '@/lib/physics-engine';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
  Sliders,
  TrendingUp,
  Compass,
  Check,
  Copy,
} from 'lucide-react';

interface G6CausalChallengeProps {
  params: SimulationParameters;
  onUpdateParams?: (updates: Partial<SimulationParameters>) => void;
  onSelectGeometry?: (geom: GeometryType) => void;
}

export const G6CausalChallenge: React.FC<G6CausalChallengeProps> = ({
  params,
  onUpdateParams,
  onSelectGeometry,
}) => {
  const [activeSubTest, setActiveSubTest] = useState<'frequency' | 'symmetry' | 'parity' | 'verdicts'>('frequency');
  const [eccentricitySlider, setEccentricitySlider] = useState<number>(0.0);
  const [transverseDeltaX, setTransverseDeltaX] = useState<number>(0.0);
  const [copied, setCopied] = useState<boolean>(false);

  // Computations
  const frequencyPoints = useMemo(() => {
    return runG6FrequencySweep(params, 0.6, 5.4, 36);
  }, [params]);

  const symmetryPoints = useMemo(() => {
    return runG6SymmetryBreakingExperiment(params, 0.35, 29);
  }, [params]);

  const transversePoints = useMemo(() => {
    return runTransverseSweep(params, 60, 31);
  }, [params]);

  const verdicts = useMemo(() => {
    return evaluateHypotheses(params);
  }, [params]);

  // Current operational point for Test 1
  const currentKReal = (params.sourceFrequency / 1.0) * Math.sqrt(Math.max(1.0, params.permittivity));
  const currentRadialDist = Math.sqrt(params.radius ** 2 + params.sourceHeight ** 2);
  const currentChordG6 = params.radius;
  const currentPhiRadial = currentKReal * currentRadialDist;
  const currentPhiBoundary = currentKReal * currentChordG6;
  const currentPhaseMismatch = Math.abs(currentPhiRadial - currentPhiBoundary) % (2 * Math.PI);
  const currentCoherence = (1.0 + Math.cos(currentPhiRadial - currentPhiBoundary)) / 2.0;

  // Selected symmetry point for Test 2
  const selectedSymmetryPoint = useMemo(() => {
    return symmetryPoints.reduce((closest, pt) => {
      return Math.abs(pt.eccentricity - eccentricitySlider) < Math.abs(closest.eccentricity - eccentricitySlider)
        ? pt
        : closest;
    }, symmetryPoints[0]);
  }, [symmetryPoints, eccentricitySlider]);

  // Selected transverse point for Test 3 (Off-Axis Source Test)
  const selectedTransversePoint = useMemo(() => {
    return transversePoints.reduce((closest, pt) => {
      return Math.abs(pt.offsetX - transverseDeltaX) < Math.abs(closest.offsetX - transverseDeltaX)
        ? pt
        : closest;
    }, transversePoints[0]);
  }, [transversePoints, transverseDeltaX]);

  // Generate scientific markdown report
  const handleCopyReport = () => {
    let md = `# G6 Causal Challenge & Falsification Report\n\n`;
    md += `**Evaluation Timestamp:** ${new Date().toISOString()}\n`;
    md += `**Controlled Baseline:** R=${params.radius}px, z0=${params.sourceHeight}px, omega=${params.sourceFrequency}rad/s, P_in=${params.sourcePower}W, eps_r=${params.permittivity}\n\n`;

    md += `## 1. Epistemic Principle\n`;
    md += `$$\\boxed{\\text{SOURCE} \\rightarrow \\text{FIELD} \\rightarrow \\text{GEOMETRY} \\rightarrow \\text{NODAL DISTRIBUTION} \\rightarrow \\text{SENSITIVITY} \\rightarrow \\text{HYPOTHESIS} \\rightarrow \\text{TEST}}$$\n`;
    md += `$$\\boxed{\\text{observed simulation result} \\neq \\text{physical cause}}$$\n\n`;
    md += `> **Core Physical Conclusion:** **G₆: symmetry-perfect reference state, not yet proven resonance.**\n`;
    md += `> The observed perfect uniformity is consistent with excitation of a symmetry-compatible field configuration respecting the D₆ geometry. U_n = 100% across the 6 nodes is a consequence of preserved spatial symmetry, not proof of an intrinsic cavity resonance.\n\n`;

    md += `## 2. Hypothesis Falsification Status\n`;
    for (const v of verdicts) {
      md += `### [${v.status}] ${v.title}\n`;
      md += `* **Formal Hypothesis:** ${v.formalHypothesis}\n`;
      md += `* **Falsification Criteria:** ${v.falsificationCriteria}\n`;
      md += `* **Measured Evidence:** ${v.quantitativeEvidence}\n`;
      md += `* **Evaluation Verdict:** ${v.summary} (Confidence: ${v.confidence}%)\n\n`;
    }

    md += `## 3. Test A: Frequency Sweep & Phase Matching Sweep\n`;
    md += `| omega (rad/s) | lambda (px) | Phase Mismatch (rad) | Coherence C_phase | eta_G6 (%) | eta_G4 (%) | eta_G8 (%) |\n`;
    md += `| :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    for (let i = 0; i < frequencyPoints.length; i += 4) {
      const p = frequencyPoints[i];
      md += `| ${p.omega.toFixed(2)} | ${p.wavelength.toFixed(1)} | ${p.phaseMismatchRad.toFixed(3)} | ${p.phaseCoherence.toFixed(3)} | ${(p.etaG6 * 100).toFixed(1)}% | ${(p.etaG4 * 100).toFixed(1)}% | ${(p.etaG8 * 100).toFixed(1)}% |\n`;
    }

    md += `\n## 4. Test B: Deliberate Symmetry Breaking (Eccentricity Sweep)\n`;
    md += `| Eccentricity (eps) | Aspect Ratio (a/b) | Chord StdDev | Captured Power (W) | Efficiency eta (%) | Relative to Unbroken |\n`;
    md += `| :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    for (let i = 0; i < symmetryPoints.length; i += 4) {
      const s = symmetryPoints[i];
      md += `| ${s.eccentricity.toFixed(2)} | ${s.aspectRatio.toFixed(2)} | ${s.chordStdDev.toFixed(1)}px | ${s.capturedPower.toFixed(2)}W | ${(s.efficiency * 100).toFixed(1)}% | ${(s.relativeToUnbroken * 100).toFixed(1)}% |\n`;
    }

    md += `\n## 5. Test C: Transverse Displacement Sweep (Odd vs Even Parity)\n`;
    md += `| delta x (px) | Odd Mean Uniformity (G3, G5) | Even Mean Uniformity (G4, G6, G8) | Parity Gap delta U |\n`;
    md += `| :---: | :---: | :---: | :---: |\n`;
    for (let i = 0; i < transversePoints.length; i += 4) {
      const t = transversePoints[i];
      md += `| ${t.offsetX.toFixed(0)} | ${(t.oddMeanUniformity * 100).toFixed(1)}% | ${(t.evenMeanUniformity * 100).toFixed(1)}% | +${(t.parityDelta * 100).toFixed(1)}% |\n`;
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="g6-causal-challenge-container" className="flex flex-col gap-4 text-xs font-sans">
      {/* Epistemic Guardrail Banner */}
      <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 font-mono tracking-tight uppercase text-[11px]">
                Rigorous Causal Challenge: Hypotheses vs Evidence
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200 text-[10px] font-mono">
                Falsification Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Distinguishing empirical simulation observations from physical causality:{' '}
              <span className="text-amber-200 font-mono font-semibold">observed simulation result ≠ physical cause</span>. Doctrine: <strong className="text-slate-100 font-mono">G₆: symmetry-perfect reference state, not yet proven resonance.</strong> U_n = 100% across the 6 nodes is a direct consequence of preserving D₆ symmetry.
            </p>
          </div>
        </div>

        <button
          id="btn-copy-causal-report"
          onClick={handleCopyReport}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
            copied
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
          <span>{copied ? 'Challenge Report Copied!' : 'Export Challenge Report'}</span>
        </button>
      </div>

      {/* Sub-test Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            id="subtest-frequency"
            onClick={() => setActiveSubTest('frequency')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeSubTest === 'frequency'
                ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Test A: Frequency & Phase Sweep
          </button>
          <button
            id="subtest-symmetry"
            onClick={() => setActiveSubTest('symmetry')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeSubTest === 'symmetry'
                ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Test B: Deliberate Symmetry Breaking
          </button>
          <button
            id="subtest-parity"
            onClick={() => setActiveSubTest('parity')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeSubTest === 'parity'
                ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Test C: Transverse Parity Sweep
          </button>
          <button
            id="subtest-verdicts"
            onClick={() => setActiveSubTest('verdicts')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeSubTest === 'verdicts'
                ? 'bg-slate-800 text-purple-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Falsification Verdicts (H₁-H₃)
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
          Baseline: <strong className="text-amber-300">G₆ Hexagon</strong> (L=R=175px)
        </span>
      </div>

      {/* SUBTEST A: Frequency Sweep & Phase Matching Condition */}
      {activeSubTest === 'frequency' && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-200 font-mono">
                  Test A: Phase-Locked Resonance Condition Tracking
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Checking if <code className="text-amber-300 font-mono">η₆(ω)</code> tracks the electromagnetic phase condition: <code className="text-sky-300 font-mono">Δϕ_radial ≈ Δϕ_boundary (mod 2π)</code> across frequency <code className="text-sky-300 font-mono">ω ∈ [0.6, 5.4] rad/s</code>.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-slate-400">Current ω:</span>
                <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-700 text-sky-300 font-bold">
                  {params.sourceFrequency.toFixed(2)} rad/s
                </span>
              </div>
            </div>

            {/* Current Phase Diagnostics Box */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/80 p-2.5 rounded border border-slate-850 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Radial Path ϕ_rad:</span>
                <span className="text-slate-200 font-semibold">
                  {currentPhiRadial.toFixed(2)} rad ({ (currentRadialDist).toFixed(1) }px)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Chord Path ϕ_bnd:</span>
                <span className="text-slate-200 font-semibold">
                  {currentPhiBoundary.toFixed(2)} rad ({currentChordG6.toFixed(1)}px)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Phase Mismatch ΔΦ:</span>
                <span className="text-amber-400 font-bold">
                  {currentPhaseMismatch.toFixed(3)} rad ({(currentPhaseMismatch * 180 / Math.PI).toFixed(1)}°)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Coherence C_phase:</span>
                <span className={currentCoherence >= 0.6 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {currentCoherence.toFixed(3)} {currentCoherence >= 0.6 ? '(Constructive)' : '(Interference)'}
                </span>
              </div>
            </div>

            {/* SVG Frequency Sweep Chart */}
            <div className="relative w-full h-56 bg-slate-900 rounded-lg p-2 border border-slate-850 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="50" y1="20" x2="680" y2="20" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="65" x2="680" y2="65" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="110" x2="680" y2="110" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="155" x2="680" y2="155" stroke="#1e293b" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="40" y="25" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">60%</text>
                <text x="40" y="70" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">40%</text>
                <text x="40" y="115" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">20%</text>
                <text x="40" y="160" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">0%</text>

                {/* Shaded Phase-Coherence bands */}
                {frequencyPoints.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = frequencyPoints[i - 1];
                  const x1 = 50 + ((prev.omega - 0.6) / 4.8) * 630;
                  const x2 = 50 + ((pt.omega - 0.6) / 4.8) * 630;
                  if (pt.phaseCoherence > 0.65) {
                    return (
                      <rect
                        key={`band-${i}`}
                        x={x1}
                        y="20"
                        width={x2 - x1}
                        height="140"
                        fill="#065f46"
                        fillOpacity="0.15"
                      />
                    );
                  }
                  return null;
                })}

                {/* Phase Coherence Curve (Amber dotted line, scaled to height) */}
                <path
                  d={frequencyPoints
                    .map((pt, i) => {
                      const x = 50 + ((pt.omega - 0.6) / 4.8) * 630;
                      // scale coherence [0, 1] to y [160, 20]
                      const y = 160 - pt.phaseCoherence * 140;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />

                {/* Square Baseline Curve (Gray) */}
                <path
                  d={frequencyPoints
                    .map((pt, i) => {
                      const x = 50 + ((pt.omega - 0.6) / 4.8) * 630;
                      const y = 160 - (pt.etaG4 / 0.65) * 140;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.2"
                />

                {/* Octagon Baseline Curve (Violet) */}
                <path
                  d={frequencyPoints
                    .map((pt, i) => {
                      const x = 50 + ((pt.omega - 0.6) / 4.8) * 630;
                      const y = 160 - (pt.etaG8 / 0.65) * 140;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.2"
                />

                {/* Hexagon Efficiency Curve (Sky Blue Solid line) */}
                <path
                  d={frequencyPoints
                    .map((pt, i) => {
                      const x = 50 + ((pt.omega - 0.6) / 4.8) * 630;
                      const y = 160 - (pt.etaG6 / 0.65) * 140;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />

                {/* Current Omega Marker */}
                {(() => {
                  const currentX = 50 + ((params.sourceFrequency - 0.6) / 4.8) * 630;
                  return (
                    <g>
                      <line
                        x1={currentX}
                        y1="15"
                        x2={currentX}
                        y2="165"
                        stroke="#f43f5e"
                        strokeWidth="2"
                        strokeDasharray="2 2"
                      />
                      <circle cx={currentX} cy="15" r="3.5" fill="#f43f5e" />
                      <text x={currentX} y="10" fill="#f43f5e" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        current ω
                      </text>
                    </g>
                  );
                })()}

                {/* X-axis labels */}
                <text x="50" y="180" fill="#64748b" fontSize="10" fontFamily="monospace">ω=0.6</text>
                <text x="207" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">ω=1.8</text>
                <text x="365" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">ω=3.0</text>
                <text x="522" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">ω=4.2</text>
                <text x="680" y="180" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">ω=5.4</text>
              </svg>
            </div>

            {/* Legend & Interactive Frequency Tuner */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono border-t border-slate-850 pt-2 text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                  <span className="text-sky-300">G₆ Hexagon η</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-slate-500 inline-block" />
                  <span>G₄ Square η</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-purple-400 inline-block" />
                  <span>G₈ Octagon η</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block border-b border-dashed" />
                  <span className="text-amber-300">Phase Coherence C_phase</span>
                </span>
              </div>

              {onUpdateParams && (
                <div className="flex items-center gap-2">
                  <span>Tune ω:</span>
                  <input
                    id="input-causal-tune-omega"
                    suppressHydrationWarning
                    type="range"
                    min="0.8"
                    max="5.0"
                    step="0.1"
                    value={params.sourceFrequency}
                    onChange={e => onUpdateParams({ sourceFrequency: parseFloat(e.target.value) })}
                    className="w-28 accent-sky-500 cursor-pointer"
                  />
                  <span className="text-slate-200">{params.sourceFrequency.toFixed(1)} rad/s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTEST B: Deliberate Symmetry Breaking */}
      {activeSubTest === 'symmetry' && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-200 font-mono">
                  Test B: Deliberate Symmetry Breaking (Eccentricity Perturbation)
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Deforming G₆ vertices along an elliptical eccentricity axis: <code className="text-sky-300 font-mono">x_k = R(1+ε)cosθ_k, y_k = R(1-ε)sinθ_k</code>. Breaks 6-fold <code className="text-amber-300 font-mono">D₆</code> symmetry into <code className="text-amber-300 font-mono">D₂</code> to test if optimality strictly requires equilateral chord condition <code className="text-amber-300 font-mono">L = R</code>.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-slate-400">Selected ε:</span>
                <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-700 text-amber-300 font-bold">
                  {eccentricitySlider > 0 ? `+${eccentricitySlider.toFixed(2)}` : eccentricitySlider.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Slider Control */}
            <div className="flex items-center gap-3 p-2 bg-slate-900/60 rounded border border-slate-850">
              <span className="font-mono text-slate-400 text-[11px]">Eccentricity ε:</span>
              <input
                id="input-causal-eccentricity"
                suppressHydrationWarning
                type="range"
                min="-0.30"
                max="0.30"
                step="0.02"
                value={eccentricitySlider}
                onChange={e => setEccentricitySlider(parseFloat(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <button
                onClick={() => setEccentricitySlider(0)}
                className="px-2 py-1 text-[10px] font-mono rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Reset ε=0 (Unbroken D₆)
              </button>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px] bg-slate-900/80 p-2.5 rounded border border-slate-850">
              <div>
                <span className="text-slate-500 block">Aspect Ratio a/b:</span>
                <span className="text-slate-200 font-semibold">{selectedSymmetryPoint.aspectRatio.toFixed(2)}:1</span>
              </div>
              <div>
                <span className="text-slate-500 block">Chord StdDev (Spread):</span>
                <span className="text-amber-400 font-semibold">±{selectedSymmetryPoint.chordStdDev.toFixed(1)} px</span>
              </div>
              <div>
                <span className="text-slate-500 block">Captured Power:</span>
                <span className="text-emerald-400 font-bold">{selectedSymmetryPoint.capturedPower.toFixed(2)} W</span>
              </div>
              <div>
                <span className="text-slate-500 block">Efficiency vs Unbroken:</span>
                <span className={selectedSymmetryPoint.relativeToUnbroken >= 0.98 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {(selectedSymmetryPoint.relativeToUnbroken * 100).toFixed(1)}% (Δ {((selectedSymmetryPoint.relativeToUnbroken - 1) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* SVG Symmetry Breaking Curve */}
            <div className="relative w-full h-52 bg-slate-900 rounded-lg p-2 border border-slate-850 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 700 180" preserveAspectRatio="none">
                <line x1="50" y1="20" x2="680" y2="20" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="60" x2="680" y2="60" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="100" x2="680" y2="100" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="140" x2="680" y2="140" stroke="#1e293b" strokeWidth="1" />

                <text x="40" y="25" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">60%</text>
                <text x="40" y="65" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">50%</text>
                <text x="40" y="105" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">40%</text>
                <text x="40" y="145" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">30%</text>

                {/* Symmetry Curve (Amber) */}
                <path
                  d={symmetryPoints
                    .map((pt, i) => {
                      const x = 50 + ((pt.eccentricity + 0.35) / 0.70) * 630;
                      // map efficiency [0.3, 0.65] to y [140, 20]
                      const y = 140 - ((pt.efficiency - 0.3) / 0.35) * 120;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* Center Unbroken Line (eps = 0) */}
                <line x1="365" y1="15" x2="365" y2="155" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="365" y="12" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  ε=0 (Unbroken L=R)
                </text>

                {/* Selected Eccentricity Marker */}
                {(() => {
                  const selX = 50 + ((eccentricitySlider + 0.35) / 0.70) * 630;
                  return (
                    <g>
                      <line x1={selX} y1="15" x2={selX} y2="155" stroke="#f43f5e" strokeWidth="2" />
                      <circle cx={selX} cy="15" r="3" fill="#f43f5e" />
                    </g>
                  );
                })()}

                {/* X labels */}
                <text x="50" y="165" fill="#64748b" fontSize="10" fontFamily="monospace">ε=-0.35</text>
                <text x="207" y="165" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">ε=-0.17</text>
                <text x="365" y="165" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">ε=0.00</text>
                <text x="522" y="165" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">ε=+0.17</text>
                <text x="680" y="165" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">ε=+0.35</text>
              </svg>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              <strong className="text-amber-300">Symmetry Falsification Verdict:</strong> As eccentricity <code className="text-slate-200 font-mono">|ε|</code> increases away from 0, the chord lengths diverge from <code className="text-slate-200 font-mono">R</code>, breaking the equilateral circulation condition. Efficiency degrades symmetrically by <strong className="text-rose-400">-{((1 - selectedSymmetryPoint.relativeToUnbroken) * 100).toFixed(1)}%</strong>, confirming that <strong className="text-slate-200 font-mono">G₆ is a symmetry-perfect reference state, not yet proven resonance</strong>. The observed perfect uniformity is consistent with excitation of a symmetry-compatible field configuration respecting the D₆ geometry.
            </p>
          </div>
        </div>
      )}

      {/* SUBTEST C: Transverse Parity Sweep / Off-Axis Source Test */}
      {activeSubTest === 'parity' && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-200 font-mono">
                  Test C: Off-Axis Source Test — N₀ = (δx, 0, z₀)
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Testing whether Hexagon (<code className="text-sky-300 font-mono">G₆</code>) uniformity and efficiency persist as symmetry is broken via transverse offset <code className="text-amber-300 font-mono">δx ∈ [-60, +60] px</code>.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-400 block">Current Probe:</span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  N₀ = ({transverseDeltaX >= 0 ? `+${transverseDeltaX}` : transverseDeltaX}px, 0, {params.sourceHeight.toFixed(1)}px)
                </span>
              </div>
            </div>

            {/* Interactive Off-Axis Slider */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-850 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">
                  Transverse Displacement Offset <code className="text-amber-400 font-bold">δx</code>:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTransverseDeltaX(0)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-sky-300 border border-slate-700 font-mono"
                  >
                    Reset On-Axis (δx=0)
                  </button>
                  <span className="text-sky-300 font-bold font-mono">
                    {transverseDeltaX > 0 ? `+${transverseDeltaX.toFixed(1)}` : transverseDeltaX.toFixed(1)} px
                  </span>
                </div>
              </div>
              <input
                id="slider-transverse-delta-x"
                type="range"
                min="-60"
                max="60"
                step="2"
                value={transverseDeltaX}
                onChange={e => setTransverseDeltaX(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-60 px (Left Bound)</span>
                <span>0 px (Symmetric Central Axis)</span>
                <span>+60 px (Right Bound)</span>
              </div>
            </div>

            {/* Live Comparative Point Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">G₆ Uniformity (U₆)</span>
                <div className="text-base font-bold text-sky-400">
                  {(selectedTransversePoint.g6Uniformity * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500">
                  {Math.abs(transverseDeltaX) < 1 ? '100% on-axis' : `${((selectedTransversePoint.g6Uniformity - 1.0) * 100).toFixed(1)}% drop`}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Even Mean U (G₄, G₆, G₈)</span>
                <div className="text-base font-bold text-emerald-400">
                  {(selectedTransversePoint.evenMeanUniformity * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-emerald-500">Antipodal parity</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Odd Mean U (G₃, G₅)</span>
                <div className="text-base font-bold text-rose-400">
                  {(selectedTransversePoint.oddMeanUniformity * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-rose-500">Asymmetric shear</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Parity Gap ΔU</span>
                <div className="text-base font-bold text-amber-400">
                  +{(selectedTransversePoint.parityDelta * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500">Even vs Odd stability</span>
              </div>
            </div>

            {/* SVG Parity Sweep Chart */}
            <div className="relative w-full h-56 bg-slate-900 rounded-lg p-2 border border-slate-850 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                <line x1="50" y1="20" x2="680" y2="20" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="65" x2="680" y2="65" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="110" x2="680" y2="110" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="155" x2="680" y2="155" stroke="#1e293b" strokeWidth="1" />

                <text x="40" y="25" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">100%</text>
                <text x="40" y="70" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">75%</text>
                <text x="40" y="115" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">50%</text>
                <text x="40" y="160" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">25%</text>

                {/* Shaded Parity Delta Area */}
                <path
                  d={
                    transversePoints
                      .map((pt, i) => {
                        const x = 50 + ((pt.offsetX + 60) / 120) * 630;
                        const y = 160 - (pt.evenMeanUniformity / 1.0) * 140;
                        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      })
                      .join(' ') +
                    ' ' +
                    transversePoints
                      .slice()
                      .reverse()
                      .map(pt => {
                        const x = 50 + ((pt.offsetX + 60) / 120) * 630;
                        const y = 160 - (pt.oddMeanUniformity / 1.0) * 140;
                        return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                      })
                      .join(' ') +
                    ' Z'
                  }
                  fill="#10b981"
                  fillOpacity="0.12"
                />

                {/* Odd Mean Uniformity Curve (Rose dashed) */}
                <path
                  d={transversePoints
                    .map((pt, i) => {
                      const x = 50 + ((pt.offsetX + 60) / 120) * 630;
                      const y = 160 - (pt.oddMeanUniformity / 1.0) * 140;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />

                {/* Even Mean Uniformity Curve (Emerald solid) */}
                <path
                  d={transversePoints
                    .map((pt, i) => {
                      const x = 50 + ((pt.offsetX + 60) / 120) * 630;
                      const y = 160 - (pt.evenMeanUniformity / 1.0) * 140;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                {/* Hexagon (G6) Curve (Sky Blue) */}
                <path
                  d={transversePoints
                    .map((pt, i) => {
                      const x = 50 + ((pt.offsetX + 60) / 120) * 630;
                      const y = 160 - (pt.g6Uniformity / 1.0) * 140;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                />

                {/* Interactive Cursor for current transverse delta x */}
                {(() => {
                  const cursorX = 50 + ((transverseDeltaX + 60) / 120) * 630;
                  const cursorYG6 = 160 - (selectedTransversePoint.g6Uniformity / 1.0) * 140;
                  return (
                    <g>
                      <line
                        x1={cursorX}
                        y1="15"
                        x2={cursorX}
                        y2="165"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                      <circle cx={cursorX} cy={cursorYG6} r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                  );
                })()}

                {/* Center Delta x = 0 */}
                <line x1="365" y1="15" x2="365" y2="165" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />

                {/* X labels */}
                <text x="50" y="180" fill="#64748b" fontSize="10" fontFamily="monospace">δx=-60px</text>
                <text x="207" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">δx=-30px</text>
                <text x="365" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">δx=0 (On-Axis)</text>
                <text x="522" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">δx=+30px</text>
                <text x="680" y="180" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">δx=+60px</text>
              </svg>
            </div>

            {/* Scientific Analysis & Physical Verdict */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-850 space-y-1.5 font-mono text-[11px]">
              <div className="text-amber-300 font-bold flex items-center gap-1.5">
                <span>OFF-AXIS STABILITY VERDICT:</span>
                <span className="text-slate-200">Uniformity is an alignment artifact; stability is a parity property.</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                When moving the source off-axis (<code className="text-sky-300 font-mono">N₀ = (δx, 0, z₀)</code>), Hexagon (<code className="text-slate-200 font-mono">G₆</code>) uniformity <strong>does not persist at 100%</strong>. It declines progressively to ~{(selectedTransversePoint.g6Uniformity * 100).toFixed(1)}%, proving that the on-axis 100% uniformity is a direct consequence of preserving central $D_6$ symmetry. However, <code className="text-emerald-300 font-mono">G₆</code> retains significant antipodal parity protection (<code className="text-slate-200 font-mono">r → -r</code>) identical to other even-order polygons, outperforming odd polygons (<code className="text-rose-400 font-mono">G₃, G₅</code>) by <strong className="text-amber-300">+{(selectedTransversePoint.parityDelta * 100).toFixed(1)}%</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTEST D: Falsification Verdicts Matrix */}
      {activeSubTest === 'verdicts' && (
        <div className="flex flex-col gap-3">
          {verdicts.map(v => (
            <div
              key={v.id}
              className={`p-4 rounded-lg border bg-slate-950 flex flex-col gap-2.5 ${
                v.status === 'SUPPORTED'
                  ? 'border-emerald-500/50'
                  : v.status === 'FALSIFIED'
                  ? 'border-rose-500/50'
                  : 'border-amber-500/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {v.status === 'SUPPORTED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : v.status === 'FALSIFIED' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <h4 className="text-xs font-bold text-slate-200 font-mono tracking-tight">
                    {v.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-slate-400">Confidence: {v.confidence}%</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase ${
                      v.status === 'SUPPORTED'
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                        : v.status === 'FALSIFIED'
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-850 font-mono text-[11px] space-y-1.5 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Formal Hypothesis:</span>
                  <p className="text-slate-200">{v.formalHypothesis}</p>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Falsification Criteria:</span>
                  <p className="text-amber-300/90">{v.falsificationCriteria}</p>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Quantitative Evidence:</span>
                  <p className="text-sky-300">{v.quantitativeEvidence}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                <strong>Epistemic Assessment:</strong> {v.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
