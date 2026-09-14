'use client';

import React from 'react';
import { EnergyAccountingLedger } from '@/lib/physics-engine';
import ProvenanceBadge from './ProvenanceBadge';
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface EnergyAccountingPanelProps {
  ledger: EnergyAccountingLedger;
  title?: string;
  compact?: boolean;
}

export const EnergyAccountingPanel: React.FC<EnergyAccountingPanelProps> = ({
  ledger,
  title = 'Energy Balance Ledger',
  compact = false,
}) => {
  const {
    powerIn,
    powerThrough,
    powerReflected,
    powerOhmicLoss,
    powerRadiativeLeak,
    dEnergyFieldDt,
    totalSumOut,
    residualErrorWatts,
    isBalanced,
    provenance,
  } = ledger;

  const pctThrough = powerIn > 0 ? (powerThrough / powerIn) * 100 : 0;
  const pctReflected = powerIn > 0 ? (powerReflected / powerIn) * 100 : 0;
  const pctOhmic = powerIn > 0 ? (powerOhmicLoss / powerIn) * 100 : 0;
  const pctLeak = powerIn > 0 ? (powerRadiativeLeak / powerIn) * 100 : 0;

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2.5 font-mono text-xs shadow-inner">
      {/* Header with Conservation Equation & Balance Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-slate-100 tracking-tight text-xs uppercase">
            {title}
          </span>
          <ProvenanceBadge tag={provenance} />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
              isBalanced
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                : 'bg-rose-950/70 text-rose-300 border-rose-500/50'
            }`}
          >
            {isBalanced ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-rose-400" />
            )}
            <span>
              {isBalanced ? 'ZERO RESIDUAL' : `Δ = ${residualErrorWatts.toFixed(4)}W`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            P_in = P_out + P_refl + P_ohmic + P_leak + dU/dt
          </span>
        </div>
      </div>

      {/* Segmented Power Flow Breakdown Bar */}
      <div className="w-full space-y-1">
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
          <div
            style={{ width: `${Math.min(100, Math.max(0, pctThrough))}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
            title={`P_out: ${powerThrough.toFixed(2)}W (${pctThrough.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${Math.min(100, Math.max(0, pctReflected))}%` }}
            className="bg-amber-500 h-full transition-all duration-300"
            title={`P_refl: ${powerReflected.toFixed(2)}W (${pctReflected.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${Math.min(100, Math.max(0, pctOhmic))}%` }}
            className="bg-rose-500/80 h-full transition-all duration-300"
            title={`P_ohmic: ${powerOhmicLoss.toFixed(2)}W (${pctOhmic.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${Math.min(100, Math.max(0, pctLeak))}%` }}
            className="bg-purple-500/80 h-full transition-all duration-300"
            title={`P_leak: ${powerRadiativeLeak.toFixed(2)}W (${pctLeak.toFixed(1)}%)`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>P_out (Thru)</span>
            </span>
            <span className="text-emerald-300 font-bold">
              {powerThrough.toFixed(1)}W{' '}
              <span className="text-slate-400 text-[9px]">({pctThrough.toFixed(0)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>P_reflected</span>
            </span>
            <span className="text-amber-300 font-bold">
              {powerReflected.toFixed(1)}W{' '}
              <span className="text-slate-400 text-[9px]">({pctReflected.toFixed(0)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>P_ohmic</span>
            </span>
            <span className="text-rose-300 font-bold">
              {powerOhmicLoss.toFixed(1)}W{' '}
              <span className="text-slate-400 text-[9px]">({pctOhmic.toFixed(0)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>P_leak</span>
            </span>
            <span className="text-purple-300 font-bold">
              {powerRadiativeLeak.toFixed(1)}W{' '}
              <span className="text-slate-400 text-[9px]">({pctLeak.toFixed(0)}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Balance Verification Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850 text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Input: <strong className="text-white">{powerIn.toFixed(2)}W</strong>
          </span>
          <span>
            Σ Out: <strong className="text-slate-200">{totalSumOut.toFixed(2)}W</strong>
          </span>
          <span>
            dU/dt:{' '}
            <strong className="text-cyan-300">{dEnergyFieldDt.toFixed(3)} W</strong>
          </span>
        </div>
        <div className="text-right">
          Residual |P_in - Σ Out| ={' '}
          <span className="text-emerald-400 font-bold">
            {residualErrorWatts.toFixed(6)} W
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnergyAccountingPanel;
