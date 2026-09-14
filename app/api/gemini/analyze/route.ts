import { NextRequest, NextResponse } from "next/server";
import {
  getGeminiClient,
  generateDeterministicSynthesis,
  TheoreticalAnalysisPayload,
  TheoreticalAnalysisResult,
} from "@/lib/gemini";

export const dynamic = "force-dynamic";

/**
 * GET /api/gemini/analyze
 * Status/health endpoint to avoid 405 Method Not Allowed during routing probes or healthchecks.
 */
export async function GET() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  return NextResponse.json({
    status: "online",
    service: "Electromagnetic Poynting Field Theoretical Synthesis API",
    model: "gemini-3.8-flash",
    hasApiKey: hasKey,
  });
}

/**
 * POST /api/gemini/analyze
 * Generates electromagnetic theoretical synthesis for the current experimental state.
 */
export async function POST(req: NextRequest): Promise<NextResponse<TheoreticalAnalysisResult>> {
  let body: TheoreticalAnalysisPayload = {};
  
  try {
    const rawJson = await req.json();
    if (rawJson && typeof rawJson === "object") {
      body = rawJson as TheoreticalAnalysisPayload;
    }
  } catch {
    // If request body is empty or non-JSON, continue with default payload
    body = {};
  }

  const {
    geometryId = "G6",
    geometryName = "G₆ Hexagonal Substrate",
    sourceHeight = 12.0,
    efficiency = 0.69,
    uniformity = 0.96,
    powers = [5.2, 5.1, 5.3, 5.0, 5.2, 5.1],
    permittivity = 2.2,
    conductivity = 0.15,
    boundaryReflection = 0.45,
    question = "",
  } = body;

  const sanitizedPayload: TheoreticalAnalysisPayload = {
    geometryId,
    geometryName,
    sourceHeight,
    efficiency,
    uniformity,
    powers,
    permittivity,
    conductivity,
    boundaryReflection,
    question,
  };

  const ai = getGeminiClient();

  // If no Gemini API key is configured or initialization returned null,
  // return our rich mathematical physics synthesis gracefully without throwing
  if (!ai) {
    const fallbackText = generateDeterministicSynthesis(sanitizedPayload);
    return NextResponse.json({
      analysis: fallbackText,
      model: "theoretical-physics-engine-fallback",
      isFallback: true,
    });
  }

  try {
    const prompt = `You are a world-class theoretical physicist and electromagnetic field operator specializing in Maxwell-Poynting field architecture, antenna array topologies, and electromagnetic power flow.

Analyze this experimental state:
- Active Polygon Ecosystem: ${geometryName} (Geometry ID: ${geometryId})
- Central Source Elevation z_0: ${typeof sourceHeight === "number" ? sourceHeight.toFixed(1) : sourceHeight} px
- Current System Efficiency: ${(efficiency * 100).toFixed(1)}%
- Field Uniformity U_n: ${(uniformity * 100).toFixed(1)}%
- Node Power Vector P_n: [${powers.map(p => (typeof p === "number" ? p.toFixed(2) : "0.00")).join(", ")}] Watts
- Substrate Relative Permittivity (ε_r): ${permittivity}
- Substrate Conductivity Loss (σ): ${conductivity} S/m
- Boundary Reflection Coeff (B_i): ${boundaryReflection}
- Operator Query: ${question.trim() || "Analyze the Poynting vector topology, mode coupling, and symmetry implications of this geometry compared to the G6 reference."}

Provide a concise, rigorous, mathematically grounded analysis addressing:
1. Poynting vector power flow S = E x H and how the central thread bifurcates into the discrete nodes.
2. The specific role of the polygon symmetry group (e.g. D_n / C_nv) and spatial parity in redistributing energy.
3. Contrast with the hexagonal reference G6 and the continuous circle G_inf.
4. Physical recommendation for tuning the source trajectory N_0(t) or boundary conditions to maximize coupling uniformity.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const outputText = response.text || generateDeterministicSynthesis(sanitizedPayload);

    return NextResponse.json({
      analysis: outputText,
      model: "gemini-3.8-flash",
      isFallback: false,
    });
  } catch (error: unknown) {
    console.error("[Gemini API Error in /api/gemini/analyze]:", error);
    
    // Provide the reliable theoretical fallback on runtime API failure so UI stays responsive
    const fallbackText = generateDeterministicSynthesis(sanitizedPayload);
    const errorMessage = error instanceof Error ? error.message : "Upstream GenAI invocation failed";

    return NextResponse.json({
      analysis: fallbackText,
      model: "gemini-3.8-flash-resilient-fallback",
      isFallback: true,
      error: errorMessage,
    });
  }
}
