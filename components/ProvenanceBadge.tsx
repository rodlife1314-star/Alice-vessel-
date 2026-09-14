'use client';

import React from 'react';
import { ProvenanceTag } from '@/lib/physics-engine';

interface ProvenanceBadgeProps {
  tag: ProvenanceTag | string;
  size?: 'xs' | 'sm';
  className?: string;
}

const TAG_STYLES: Record<ProvenanceTag, { bg: string; text: string; border: string }> = {
  MEASURED: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
  },
  DERIVED: {
    bg: 'bg-sky-950/60',
    text: 'text-sky-300',
    border: 'border-sky-500/40',
  },
  INFERRED: {
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-300',
    border: 'border-indigo-500/40',
  },
  SIMULATED: {
    bg: 'bg-cyan-950/60',
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
  },
  STATIC: {
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-700/60',
  },
  HYPOTHETICAL: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
  },
};

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  tag,
  size = 'xs',
  className = '',
}) => {
  const normTag = (tag in TAG_STYLES ? tag : 'SIMULATED') as ProvenanceTag;
  const style = TAG_STYLES[normTag];

  const sizeClasses =
    size === 'xs'
      ? 'text-[8px] px-1 py-0.2 tracking-wider'
      : 'text-[9px] px-1.5 py-0.5 tracking-wider';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase rounded border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
      title={`Epistemic Classification: ${normTag}`}
    >
      [{normTag}]
    </span>
  );
};

export default ProvenanceBadge;
