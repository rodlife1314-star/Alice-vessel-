import { GoogleGenAI } from "@google/genai";

/**
 * Request payload structure for electromagnetic theoretical analysis
 */
export interface TheoreticalAnalysisPayload {
  geometryId?: string;
  geometryName?: string;
  sourceHeight?: number;
  efficiency?: number;
  uniformity?: number;
  powers?: number[];
  permittivity?: number;
  conductivity?: number;
  boundaryReflection?: number;
  question?: string;
}

/**
 * Standard response from the Gemini analysis route
 */
export interface TheoreticalAnalysisResult {
  analysis: string;
  model: string;
  isFallback?: boolean;
  error?: string;
}

// Lazy-initialized GoogleGenAI singleton to avoid module-load crashes
let geminiClientInstance: GoogleGenAI | null = null;

/**
 * Get or lazily initialize the Google Gen AI client with telemetry headers.
 * Returns null if GEMINI_API_KEY is not configured in the environment.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  if (!geminiClientInstance) {
    try {
      geminiClientInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('[Gemini Client] Initialization failure:', err);
      return null;
    }
  }

  return geminiClientInstance;
}

/**
 * Generates a deterministic, rigorous electromagnetic Poynting theoretical synthesis
 * when the Gemini API key is absent, during cold starts, or if external network fails.
 */
export function generateDeterministicSynthesis(payload: TheoreticalAnalysisPayload): string {
  const geomName = payload.geometryName || 'G₆ Hexagonal Substrate';
  const geomId = payload.geometryId || 'G6';
  const z0 = typeof payload.sourceHeight === 'number' ? payload.sourceHeight.toFixed(1) : '12.0';
  const eff = typeof payload.efficiency === 'number' ? (payload.efficiency * 100).toFixed(1) : '69.0';
  const unif = typeof payload.uniformity === 'number' ? (payload.uniformity * 100).toFixed(1) : '96.0';
  const eps = typeof payload.permittivity === 'number' ? payload.permittivity.toFixed(1) : '2.2';
  const sigma = typeof payload.conductivity === 'number' ? payload.conductivity.toFixed(2) : '0.15';
  const bRefl = typeof payload.boundaryReflection === 'number' ? payload.boundaryReflection.toFixed(2) : '0.45';
  const powers = Array.isArray(payload.powers) && payload.powers.length > 0
    ? payload.powers.map(p => (typeof p === 'number' ? p.toFixed(2) : '5.00')).join(', ')
    : '5.20, 5.10, 5.30, 5.00, 5.20, 5.10';

  return `### Theoretical Operator Synthesis: ${geomName} (${geomId})

**1. Central Axis Poynting Flux $\\mathbf{S}(\\mathbf{r}, t) = \\mathbf{E} \\times \\mathbf{H}$:**
With source axial position $z_0 = ${z0}\\,\\text{px}$ and dielectric constant $\\epsilon_r = ${eps}$ (loss tangent $\\sigma = ${sigma}\\,\\text{S/m}$), the central thread $\\mathcal{A}(t) = N_0(t)$ radiates a transverse electromagnetic wave. The local radial Poynting flux bifurcates toward the discrete boundary vertices, establishing an active coupling coefficient governed by the boundary reflection index $B_i = ${bRefl}$.

**2. Discrete Boundary Mode Coupling & Telemetry:**
- Observed systemic transfer efficiency $\\eta = ${eff}\\%$
- Spatial field uniformity index $U_n = ${unif}\\%$
- Vertex power distribution vector $\\mathbf{P}_n = [${powers}]\\,\\text{W}$

**3. Group Symmetry Dynamics & Phase Stability:**
- In contrast to an isotropic circle ($G_\\infty$), the discrete $n$-gon geometry introduces boundary azimuth phase shifts $\\Delta \\phi = k \\Delta d$.
- Symmetric dihedral topologies ($D_{2k}$) sustain stationary radial interference nodes, minimizing reactive back-scattering into the central source axis.
- Odd polygons ($G_3, G_5$) exhibit angular frustration and circulation currents $\\nabla \\times \\mathbf{S} \\neq 0$, causing azimuthal phase torque.

**4. Operational Recommendation:**
Maintain transverse offset $|\\delta_x, \\delta_y| \\le 4\\,\\text{px}$ to preserve the $\\Gamma_0$ resonant cruise lock. If vectoring maneuver $\\Gamma_\\delta$ is initiated, ramp frequency $\\omega$ to match the localized corner mode cutoff to suppress dissipative reactive return loss.`;
}
