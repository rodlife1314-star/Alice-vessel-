import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export interface GeminiGenerateRequest {
  prompt?: string;
  model?: string;
}

export interface GeminiGenerateResponse {
  text?: string;
  model?: string;
  isFallback?: boolean;
  error?: string;
}

/**
 * GET /api/gemini/generate
 * Health/status check to prevent 405 errors during route discovery or health probes.
 */
export async function GET() {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== "" &&
    process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  );

  return NextResponse.json({
    status: "online",
    service: "Gemini Text Generation API",
    defaultModel: "gemini-3.8-flash",
    hasApiKey: hasKey,
  });
}

/**
 * POST /api/gemini/generate
 * Handles standard server-side Gemini text generation requests.
 */
export async function POST(req: NextRequest): Promise<NextResponse<GeminiGenerateResponse>> {
  let body: GeminiGenerateRequest = {};

  try {
    const raw = await req.json();
    if (raw && typeof raw === "object") {
      body = raw as GeminiGenerateRequest;
    }
  } catch {
    body = {};
  }

  const prompt = body.prompt?.trim() || "State the Maxwell-Poynting theorem for electromagnetic power conservation.";
  const selectedModel = body.model || "gemini-3.8-flash";

  const ai = getGeminiClient();

  if (!ai) {
    return NextResponse.json({
      text: `Poynting's Theorem Formulation:\n\n\\nabla \\cdot \\mathbf{S} + \\frac{\\partial u}{\\partial t} = -\\mathbf{J} \\cdot \\mathbf{E}\n\nWhere \\mathbf{S} = \\mathbf{E} \\times \\mathbf{H} represents the Poynting vector, u = \\frac{1}{2}(\\epsilon |\\mathbf{E}|^2 + \\mu |\\mathbf{H}|^2) is electromagnetic energy density, and \\mathbf{J} \\cdot \\mathbf{E} quantifies dissipative work done on free charge currents.`,
      model: selectedModel,
      isFallback: true,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
    });

    return NextResponse.json({
      text: response.text || "No text content returned from GenAI model.",
      model: selectedModel,
      isFallback: false,
    });
  } catch (error: unknown) {
    console.error("[Gemini API Error in /api/gemini/generate]:", error);
    const errorMessage = error instanceof Error ? error.message : "Generation failed";

    return NextResponse.json({
      text: `Theoretical Fallback: Under harmonic oscillation e^{i\\omega t}, power transferred through closed surface \\partial V is \\oint_{\\partial V} \\mathbf{S} \\cdot d\\mathbf{A} = P_{in} - P_{loss}.`,
      model: `${selectedModel}-fallback`,
      isFallback: true,
      error: errorMessage,
    });
  }
}
