'use client';

import React, { useState } from 'react';
import {
  SimulationParameters,
  GEOMETRY_DEFINITIONS,
} from '@/lib/physics-engine';
import { Sparkles, X, Send, Cpu, BookOpen, Check, Loader2 } from 'lucide-react';

interface TheoreticalSynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: SimulationParameters;
  nodalTelemetry: { powers: number[]; efficiency: number; uniformity: number };
}

export default function TheoreticalSynthesisModal({
  isOpen,
  onClose,
  params,
  nodalTelemetry,
}: TheoreticalSynthesisModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentGeom = GEOMETRY_DEFINITIONS[params.geometry];

  const handleRunAnalysis = async (customPrompt?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometryId: params.geometry,
          geometryName: currentGeom.name,
          sourceHeight: params.sourceHeight,
          efficiency: nodalTelemetry.efficiency,
          uniformity: nodalTelemetry.uniformity,
          powers: nodalTelemetry.powers,
          permittivity: params.permittivity,
          conductivity: params.conductivity,
          boundaryReflection: params.boundaryReflection,
          question: customPrompt || query,
        }),
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.analysis) {
            setAnalysisText(errData.analysis);
            return;
          }
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore non-json error
        }
        setAnalysisText(`Theoretical Synthesis Note: ${errMessage}. Poynting theorem equations active.`);
        return;
      }

      const data = await res.json();
      setAnalysisText(data.analysis || data.text || 'Analysis completed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network request failure';
      setAnalysisText(`Unable to reach synthesis service (${msg}). Local Poynting conservation theorems active.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        id="operator-synthesis-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100">
                Operator Theoretical Synthesis (Gemini Engine)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Evaluating {currentGeom.name} • S = E × H Topology
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Quick Prompts */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">
              Quick Theoretical Query Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Why does G6 have optimal hexagonal coupling?',
                'Analyze Poynting vector vortex formation in odd polygons (G3, G5).',
                'How does source elevation z0 alter standing wave interference?',
                'Evaluate the asymptotic convergence toward continuous circle G_inf.',
              ].map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(template);
                    handleRunAnalysis(template);
                  }}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:border-purple-500/40 hover:text-purple-300 text-[11px] transition-colors text-left"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Output Container */}
          <div className="min-h-[160px] p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-purple-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-mono">
                  Calculating Maxwell-Poynting tensor field synthesis...
                </span>
              </div>
            ) : analysisText ? (
              <div className="space-y-2 whitespace-pre-line text-slate-200">
                {analysisText}
              </div>
            ) : (
              <div className="text-slate-500 italic py-6 text-center">
                Click a template above or ask a custom theoretical question to generate the operator synthesis for {currentGeom.name}.
              </div>
            )}
          </div>

          {/* Custom Input */}
          <div className="flex items-center gap-2">
            <input
              id="input-synthesis-query"
              suppressHydrationWarning
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask theoretical or physical questions about the field..."
              className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs font-mono"
              onKeyDown={e => {
                if (e.key === 'Enter') handleRunAnalysis();
              }}
            />
            <button
              onClick={() => handleRunAnalysis()}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors flex items-center gap-1 text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
