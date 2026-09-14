'use client';

import React, { useMemo } from 'react';
import {
  SimulationParameters,
  OPTIMALITY_PRESETS,
  OptimalityPresetDef,
  OptimalityWeights,
  solveDynamicOptimality,
  GeometryType,
} from '@/lib/physics-engine';
import ProvenanceBadge from './ProvenanceBadge';
import { Scale, Sliders, CheckCircle2, TrendingUp, Award, Info } from 'lucide-react';

interface DynamicOptimalitySolverProps {
  params: SimulationParameters;
  onParamsChange: (updater: (prev: SimulationParameters) => SimulationParameters) => void;
  onSelectGeometry?: (geom: GeometryType) => void;
}

export const DynamicOptimalitySolver: React.FC<DynamicOptimalitySolverProps> = ({
  params,
  onParamsChange,
  onSelectGeometry,
}) => {
  const activePresetKey = params.optimalityPreset || 'balanced';
  const currentWeights: OptimalityWeights = useMemo(() => {
    return params.optimalityWeights || OPTIMALITY_PRESETS[activePresetKey]?.weights || {
      wEta: 1.0,
      wU: 1.0,
      wL: 0.5,
    };
  }, [params.optimalityWeights, activePresetKey]);

  const solution = useMemo(() => {
    return solveDynamicOptimality(params, currentWeights);
  }, [params, currentWeights]);

  const handleSelectPreset = (presetKey: string) => {
    const preset = OPTIMALITY_PRESETS[presetKey];
    if (!preset) return;
    onParamsChange(prev => ({
      ...prev,
      optimalityPreset: presetKey as any,
      optimalityWeights: { ...preset.weights },
    }));
  };

  const handleWeightChange = (key: keyof OptimalityWeights, value: number) => {
    onParamsChange(prev => ({
      ...prev,
      optimalityWeights: {
        ...(prev.optimalityWeights || currentWeights),
        [key]: value,
      },
    }));
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 font-mono text-xs shadow-md">
      {/* Header with Equation & Objective */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 uppercase tracking-tight text-xs">
                Dynamic Optimality Objective: G* = argmax J_n
              </span>
              <ProvenanceBadge tag="DERIVED" />
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              J_n = (w_η · η_n) + (w_U · U_n) - (w_L · Loss_n)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Optimal: {solution.winner} (Score: {solution.winnerScore.toFixed(3)})
          </span>
        </div>
      </div>

      {/* Epistemic Clarification Note */}
      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed font-sans flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Anti-Dogma Rule: </span>
          G₆ is not intrinsically superior. G₆ achieves optimality only when{' '}
          <strong className="text-amber-300">azimuthal uniformity U_n</strong> is heavily weighted. Under strict efficiency or loss-penalized metrics, other geometries or continuous manifolds can match or exceed it.
        </div>
      </div>

      {/* Operator Weight Presets (Touch-friendly Buttons >= 44px) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          Objective Weight Presets:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {Object.entries(OPTIMALITY_PRESETS).map(([key, def]) => {
            const isSelected = activePresetKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                className={`min-h-[44px] px-3 py-2 rounded-lg border text-left transition-all flex flex-col justify-center ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="font-bold text-[11px] font-mono leading-tight">
                  {def.name}
                </span>
                <span className="text-[9px] text-slate-400 truncate mt-0.5">
                  w=[{def.weights.wEta},{def.weights.wU},{def.weights.wL}]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Weight Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-850">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300">w_η (Efficiency Weight):</span>
            <span className="text-emerald-400 font-bold">{currentWeights.wEta.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={currentWeights.wEta}
            onChange={e => handleWeightChange('wEta', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300">w_U (Uniformity Weight):</span>
            <span className="text-amber-400 font-bold">{currentWeights.wU.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={currentWeights.wU}
            onChange={e => handleWeightChange('wU', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300">w_L (Loss Penalty Weight):</span>
            <span className="text-rose-400 font-bold">{currentWeights.wL.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={currentWeights.wL}
            onChange={e => handleWeightChange('wL', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>

      {/* Dynamic Ranking Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider">
              <th className="py-1.5 px-2">Rank</th>
              <th className="py-1.5 px-2">Geometry</th>
              <th className="py-1.5 px-2 text-right">Score J_n</th>
              <th className="py-1.5 px-2 text-right">η (Eff)</th>
              <th className="py-1.5 px-2 text-right">U (Unif)</th>
              <th className="py-1.5 px-2 text-right">Loss Fraction</th>
              <th className="py-1.5 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {solution.rankings.map(item => {
              const isWinner = item.rank === 1;
              const isCurrent = params.geometry === item.geometryId;
              return (
                <tr
                  key={item.geometryId}
                  className={`transition-colors ${
                    isCurrent ? 'bg-sky-950/30' : 'hover:bg-slate-850/40'
                  }`}
                >
                  <td className="py-2 px-2">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        isWinner
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'text-slate-400'
                      }`}
                    >
                      #{item.rank}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-bold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {isWinner && (
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          G*
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-sky-300">
                    {item.score.toFixed(3)}
                  </td>
                  <td className="py-2 px-2 text-right text-emerald-400">
                    {(item.eta * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right text-amber-300">
                    {(item.u * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right text-rose-400">
                    {(item.loss * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-center">
                    {item.geometryId !== 'G_inf' && (
                      <button
                        type="button"
                        onClick={() => onSelectGeometry?.(item.geometryId)}
                        className={`min-h-[32px] px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                          isCurrent
                            ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isCurrent ? 'Active' : 'Apply'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicOptimalitySolver;
