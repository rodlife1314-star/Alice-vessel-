'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SimulationParameters,
  NodeReceiver,
  calculateFieldAtPoint,
  calculateNodalDistribution,
  getGeometryNodes,
  GEOMETRY_DEFINITIONS,
  StreamlinePoint,
  ProbeMeasurement,
  HULL_EIGENMODES,
  HullEigenmodeId,
  calculateVesselEngineMetrics,
} from '@/lib/physics-engine';
import { Play, Pause, RotateCcw, Crosshair, Eye, Zap, Layers, Compass, Maximize2, Shield, Navigation, AlertTriangle } from 'lucide-react';

interface FieldCanvasProps {
  params: SimulationParameters;
  onParamsChange: (updater: (prev: SimulationParameters) => SimulationParameters) => void;
  onProbeUpdate?: (probe: ProbeMeasurement | null) => void;
  onNodalUpdate?: (data: { powers: number[]; efficiency: number; uniformity: number }) => void;
}

export default function FieldCanvas({
  params,
  onParamsChange,
  onProbeUpdate,
  onNodalUpdate,
}: FieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [renderMode, setRenderMode] = useState<'streamlines' | 'wavefronts' | 'flux_density' | 'vector_grid'>('streamlines');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showStreamlines, setShowStreamlines] = useState<boolean>(true);
  const [showNodeLabels, setShowNodeLabels] = useState<boolean>(true);
  const [showSuperimposedHull, setShowSuperimposedHull] = useState<boolean>(true);
  const [showCorridorThread, setShowCorridorThread] = useState<boolean>(true);
  const [activeProbe, setActiveProbe] = useState<ProbeMeasurement | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  // Time and animation state
  const timeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<StreamlinePoint[]>([]);

  // Nodes for current geometry
  const nodes = getGeometryNodes(params.geometry, params.radius);

  // Initialize streamlines / particles
  const initParticles = useCallback(() => {
    const p: StreamlinePoint[] = [];
    const count = 180;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const dist = 5 + Math.random() * 20;
      p.push({
        x: params.sourceOffsetX + Math.cos(angle) * dist,
        y: params.sourceOffsetY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        magnitude: 1,
        age: Math.floor(Math.random() * 80),
        maxAge: 70 + Math.floor(Math.random() * 50),
      });
    }
    particlesRef.current = p;
  }, [params.sourceOffsetX, params.sourceOffsetY]);

  useEffect(() => {
    initParticles();
  }, [initParticles, params.geometry]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        // Increment physics time
        timeRef.current += dt * params.sourceFrequency;

        // Auto motion presets
        if (params.motionPreset === 'axial_oscillation') {
          const zOsc = 8 + 6 * Math.sin(timeRef.current * 0.8 * params.motionSpeed);
          onParamsChange(prev => ({ ...prev, sourceHeight: zOsc }));
        } else if (params.motionPreset === 'precession') {
          const r = 35;
          const px = r * Math.cos(timeRef.current * 0.6 * params.motionSpeed);
          const py = r * Math.sin(timeRef.current * 0.6 * params.motionSpeed);
          onParamsChange(prev => ({ ...prev, sourceOffsetX: px, sourceOffsetY: py }));
        } else if (params.motionPreset === 'vertical_ascent') {
          // Source rises through central geometry
          const zAsc = (timeRef.current * 2 * params.motionSpeed) % 25;
          onParamsChange(prev => ({ ...prev, sourceHeight: zAsc }));
        }
      }

      const t = timeRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Clear background
      ctx.fillStyle = '#080c14'; // Sophisticated deep navy/charcoal space
      ctx.fillRect(0, 0, width, height);

      // Draw coordinate / polar grid
      if (showGrid) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        // Concentric distance rings
        [60, 120, 180, 240].forEach(r => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Polar axes
        ctx.beginPath();
        ctx.moveTo(cx - 260, cy);
        ctx.lineTo(cx + 260, cy);
        ctx.moveTo(cx, cy - 260);
        ctx.lineTo(cx, cy + 260);
        ctx.stroke();

        // Central axis A(t) trajectory ring indicator
        ctx.strokeStyle = '#334155';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Substrate Ecosystem Dielectric Boundary
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      if (nodes.length > 0) {
        ctx.moveTo(cx + nodes[0].x, cy + nodes[0].y);
        for (let i = 1; i < nodes.length; i++) {
          ctx.lineTo(cx + nodes[i].x, cy + nodes[i].y);
        }
        ctx.closePath();
      }
      ctx.fill();

      // Render field background layer according to renderMode
      if (renderMode === 'wavefronts' || renderMode === 'flux_density') {
        const step = 8;
        const cols = Math.floor(width / step);
        const rows = Math.floor(height / step);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = c * step + step / 2;
            const py = r * step + step / 2;
            const simX = px - cx;
            const simY = py - cy;

            const field = calculateFieldAtPoint(simX, simY, t, params, nodes);

            if (renderMode === 'wavefronts') {
              // Normalize Ez
              const norm = Math.max(-1, Math.min(1, field.Ez * 1.5));
              if (norm > 0) {
                const alpha = norm * 0.45;
                ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`; // Electric cyan
              } else {
                const alpha = -norm * 0.45;
                ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`; // Magnetic rose
              }
              ctx.fillRect(px - step / 2, py - step / 2, step, step);
            } else if (renderMode === 'flux_density') {
              const fluxNorm = Math.min(1, field.PoyntingMag * 0.8);
              ctx.fillStyle = `rgba(245, 158, 11, ${fluxNorm * 0.65})`; // Amber Poynting flux
              ctx.fillRect(px - step / 2, py - step / 2, step, step);
            }
          }
        }
      } else if (renderMode === 'vector_grid') {
        // Draw discrete Poynting vector arrows S = E x H
        const arrowStep = 32;
        ctx.lineWidth = 1.2;
        for (let x = cx - 220; x <= cx + 220; x += arrowStep) {
          for (let y = cy - 220; y <= cy + 220; y += arrowStep) {
            const simX = x - cx;
            const simY = y - cy;
            const field = calculateFieldAtPoint(simX, simY, t, params, nodes);
            const len = Math.min(14, field.PoyntingMag * 8 + 3);
            const angle = field.PoyntingAngle;

            ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
            ctx.beginPath();
            ctx.moveTo(x, y);
            const tox = x + Math.cos(angle) * len;
            const toy = y + Math.sin(angle) * len;
            ctx.lineTo(tox, toy);
            ctx.stroke();

            // Tiny arrowhead
            ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
            ctx.beginPath();
            ctx.arc(tox, toy, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Render Dynamic Poynting Streamlines (The "Passing the Thread through the Center" physics)
      if (showStreamlines) {
        const particles = particlesRef.current;
        const currentSx = params.sourceOffsetX;
        const currentSy = params.sourceOffsetY;

        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];

          // Compute Poynting vector at particle location
          const field = calculateFieldAtPoint(pt.x, pt.y, t, params, nodes);

          // Velocity is along Poynting vector direction S
          const speed = 2.4;
          const mag = Math.max(0.01, field.PoyntingMag);
          pt.vx = (field.Sx / mag) * speed;
          pt.vy = (field.Sy / mag) * speed;

          const oldX = pt.x;
          const oldY = pt.y;

          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.age += 1;

          // Draw streamline segment
          const lifeRatio = 1 - pt.age / pt.maxAge;
          const canvasOldX = cx + oldX;
          const canvasOldY = cy + oldY;
          const canvasNewX = cx + pt.x;
          const canvasNewY = cy + pt.y;

          // Color gradient from central thread (gold/amber) to coupled nodes (cyan/emerald)
          const distFromCenter = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
          const colorInterpolation = Math.min(1, distFromCenter / params.radius);

          ctx.strokeStyle = colorInterpolation < 0.35
            ? `rgba(251, 191, 36, ${lifeRatio * 0.85})` // Golden central thread
            : `rgba(56, 189, 248, ${lifeRatio * 0.75})`; // Cyan branching flow

          ctx.lineWidth = colorInterpolation < 0.3 ? 2.2 : 1.4;
          ctx.beginPath();
          ctx.moveTo(canvasOldX, canvasOldY);
          ctx.lineTo(canvasNewX, canvasNewY);
          ctx.stroke();

          // Reset particle if out of bounds or expired
          if (
            pt.age >= pt.maxAge ||
            distFromCenter > params.radius * 1.35 ||
            distFromCenter < 2
          ) {
            const angle = (Math.PI * 2 * i) / particles.length + (Math.random() * 0.2 - 0.1);
            const spawnR = 3 + Math.random() * 12;
            pt.x = currentSx + Math.cos(angle) * spawnR;
            pt.y = currentSy + Math.sin(angle) * spawnR;
            pt.age = 0;
            pt.maxAge = 65 + Math.floor(Math.random() * 50);
          }
        }
      }

      // Compute and draw polygon ecosystem boundaries and node targets
      const nodalData = calculateNodalDistribution(params, nodes, t);
      if (onNodalUpdate) {
        onNodalUpdate({
          powers: nodalData.powers,
          efficiency: nodalData.efficiency,
          uniformity: nodalData.uniformity,
        });
      }

      // ─────────────────────────────────────────────────────────────
      // SUPERIMPOSED HULL EIGENMODES (Phase 2: Vessel as the Engine)
      // ─────────────────────────────────────────────────────────────
      const weights = params.eigenmodeWeights;
      const isVectoring = Math.hypot(params.sourceOffsetX, params.sourceOffsetY) >= 4;

      if (showSuperimposedHull) {
        // Render concentric nested polygon layers
        const hullLayers: { n: number; radiusScale: number; color: string; label: string; weightKey: HullEigenmodeId }[] = [
          { n: 0, radiusScale: 1.06, color: '#6366f1', label: 'ψ₆ G_∞ Shield', weightKey: 'psi_6_ginf' },
          { n: 8, radiusScale: 0.94, color: '#a855f7', label: 'ψ₅ G₈ Shunt', weightKey: 'psi_5_g8' },
          { n: 6, radiusScale: 0.82, color: '#10b981', label: 'ψ₄ G₆ Resonator', weightKey: 'psi_4_g6' },
          { n: 5, radiusScale: 0.70, color: '#ec4899', label: 'ψ₃ G₅ Frustration', weightKey: 'psi_3_g5' },
          { n: 4, radiusScale: 0.58, color: '#38bdf8', label: 'ψ₂ G₄ Trap', weightKey: 'psi_2_g4' },
          { n: 3, radiusScale: 0.46, color: '#f59e0b', label: 'ψ₁ G₃ Splitter', weightKey: 'psi_1_g3' },
        ];

        hullLayers.forEach(layer => {
          const w = weights ? (weights[layer.weightKey] || 0.3) : 0.35;
          const layerR = params.radius * layer.radiusScale;
          // Inner layers skew slightly when vectoring, visually demonstrating geometric distortion
          const skewFactor = isVectoring ? (1.0 - layer.radiusScale * 0.7) : 0;
          const lx = cx + params.sourceOffsetX * skewFactor * 0.45;
          const ly = cy + params.sourceOffsetY * skewFactor * 0.45;

          ctx.strokeStyle = layer.color;
          ctx.lineWidth = 1 + w * 1.8;
          ctx.globalAlpha = 0.18 + w * 0.45;

          ctx.beginPath();
          if (layer.n === 0) {
            // Circle G_inf
            ctx.arc(lx, ly, layerR, 0, Math.PI * 2);
          } else {
            // Regular polygon with n vertices
            for (let k = 0; k < layer.n; k++) {
              const th = (2 * Math.PI * k) / layer.n - Math.PI / 2;
              const px = lx + Math.cos(th) * layerR;
              const py = ly + Math.sin(th) * layerR;
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
          }
          ctx.stroke();

          // Helical / Biaxial ellipse if applicable
          ctx.globalAlpha = 1.0;
        });

        // Inner central coupling aperture ring
        const innerR = params.radius * 0.28;
        const innerX = cx + params.sourceOffsetX * 0.6;
        const innerY = cy + params.sourceOffsetY * 0.6;
        ctx.strokeStyle = isVectoring ? '#f97316' : '#10b981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(innerX, innerY, innerR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Selected Active Geometry Perimeter Boundary
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (nodes.length > 0) {
        ctx.moveTo(cx + nodes[0].x, cy + nodes[0].y);
        for (let i = 1; i < nodes.length; i++) {
          ctx.lineTo(cx + nodes[i].x, cy + nodes[i].y);
        }
        ctx.closePath();
      }
      ctx.stroke();

      // Inter-node coupling waveguides (dashed lines connecting adjacent vertices)
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          ctx.beginPath();
          ctx.moveTo(cx + nodes[i].x, cy + nodes[i].y);
          ctx.lineTo(cx + nodes[j].x, cy + nodes[j].y);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      // Draw Receiver Nodes E_i
      nodes.forEach((node, idx) => {
        const nx = cx + node.x;
        const ny = cy + node.y;
        const pReceived = nodalData.powers[idx] || 0;
        const powerRadius = 6 + Math.min(14, pReceived * 1.8);

        // Halo glow
        const gradient = ctx.createRadialGradient(nx, ny, 2, nx, ny, powerRadius * 2);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
        gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(nx, ny, powerRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(nx, ny, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Node labels and power metrics
        if (showNodeLabels) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = '11px ui-monospace, monospace';
          ctx.textAlign = 'center';
          const labelDist = 22;
          const lx = nx + Math.cos(node.theta) * labelDist;
          const ly = ny + Math.sin(node.theta) * labelDist;
          ctx.fillText(`P${idx + 1}`, lx, ly);

          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px ui-monospace, monospace';
          ctx.fillText(`${pReceived.toFixed(2)}W`, lx, ly + 12);
        }
      });

      // ─────────────────────────────────────────────────────────────
      // CORRIDOR FLUX THREAD BEAM (Cruise Γ₀ vs Bent Vectoring Γ_δ)
      // ─────────────────────────────────────────────────────────────
      const sourceCanvasX = cx + params.sourceOffsetX;
      const sourceCanvasY = cy + params.sourceOffsetY;
      const dr = Math.hypot(params.sourceOffsetX, params.sourceOffsetY);

      if (showCorridorThread) {
        const inletX = cx - params.radius * 1.55;
        const inletY = cy;
        const outletX = cx + params.radius * 1.55;
        const outletY = cy + (isVectoring ? params.sourceOffsetY * 1.35 : 0);

        if (!isVectoring) {
          // Γ₀: Cruise State (Thread-Centred) - Straight Laser Beam through Core
          // Outer beam glow
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.moveTo(inletX, inletY);
          ctx.lineTo(outletX, outletY);
          ctx.stroke();

          // Mid beam
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(inletX, inletY);
          ctx.lineTo(outletX, outletY);
          ctx.stroke();

          // Core high-intensity thread
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(inletX, inletY);
          ctx.lineTo(outletX, outletY);
          ctx.stroke();

          // Thread traveling pulse wave
          const pulseOffset = (t * 80) % (outletX - inletX);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(inletX + pulseOffset, cy, 4, 0, Math.PI * 2);
          ctx.fill();

          // Labels
          ctx.font = 'bold 9px ui-monospace, monospace';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('INPUT THREAD', inletX - 8, cy - 4);
          ctx.fillStyle = '#64748b';
          ctx.fillText('[C_AB CORRIDOR]', inletX - 8, cy + 8);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#10b981';
          ctx.fillText('OUTPUT THREAD', outletX + 8, cy - 4);
          ctx.fillStyle = '#64748b';
          ctx.fillText('[AXIAL MOMENTUM Π_z]', outletX + 8, cy + 8);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#facc15';
          ctx.fillText('CENTRAL COUPLING REGION (Γ₀)', cx, cy - 24);

          // Top badge
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
          ctx.lineWidth = 1;
          const badgeText = 'PASS THE THREAD THROUGH THE CENTRE [Γ₀ CRUISE]';
          ctx.font = 'bold 10px ui-monospace, monospace';
          const textW = ctx.measureText(badgeText).width;
          ctx.fillRect(cx - textW / 2 - 10, cy - params.radius - 28, textW + 20, 20);
          ctx.strokeRect(cx - textW / 2 - 10, cy - params.radius - 28, textW + 20, 20);
          ctx.fillStyle = '#34d399';
          ctx.fillText(badgeText, cx, cy - params.radius - 14);
        } else {
          // Γ_δ: Vectoring State (Thread-Offset) - Bending the Thread through Ship
          // Outer curve glow
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
          ctx.lineWidth = 16;
          ctx.beginPath();
          ctx.moveTo(inletX, inletY);
          ctx.quadraticCurveTo(sourceCanvasX, sourceCanvasY, outletX, outletY);
          ctx.stroke();

          // Mid curve
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(inletX, inletY);
          ctx.quadraticCurveTo(sourceCanvasX, sourceCanvasY, outletX, outletY);
          ctx.stroke();

          // Intense core curve
          ctx.strokeStyle = '#fff7ed';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(inletX, inletY);
          ctx.quadraticCurveTo(sourceCanvasX, sourceCanvasY, outletX, outletY);
          ctx.stroke();

          // Deflection Angle and labels
          const deflectAngle = ((Math.atan2(params.sourceOffsetY, params.sourceOffsetX) * 180) / Math.PI).toFixed(1);
          ctx.font = 'bold 9px ui-monospace, monospace';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('INPUT THREAD', inletX - 8, cy - 4);
          ctx.fillStyle = '#64748b';
          ctx.fillText('[C_AB CORRIDOR]', inletX - 8, cy + 8);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#f97316';
          ctx.fillText(`DEFLECTED THREAD (${deflectAngle}°)`, outletX + 8, outletY - 4);
          ctx.fillStyle = '#64748b';
          ctx.fillText('[TRANSVERSE SHEAR F_⊥]', outletX + 8, outletY + 8);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#f59e0b';
          ctx.fillText(`BENT COUPLING CORE [Γ_δ: Δr=${dr.toFixed(1)}px]`, sourceCanvasX, sourceCanvasY - 24);

          // Top badge
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.lineWidth = 1;
          const badgeText = `VECTORING: BENDING THREAD THROUGH VESSEL [Γ_δ | Δr=${dr.toFixed(1)}px]`;
          ctx.font = 'bold 10px ui-monospace, monospace';
          const textW = ctx.measureText(badgeText).width;
          ctx.fillRect(cx - textW / 2 - 10, cy - params.radius - 28, textW + 20, 20);
          ctx.strokeRect(cx - textW / 2 - 10, cy - params.radius - 28, textW + 20, 20);
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(badgeText, cx, cy - params.radius - 14);

          // Reactionless Maxwell Stress Thrust Vector Arrow F_net
          // Resulting thrust reaction opposes the thread deflection
          const thrustLen = Math.min(75, dr * 1.4 + 20);
          const thrustAngle = Math.atan2(params.sourceOffsetY, params.sourceOffsetX) + Math.PI; // Opposite reaction
          const thrustX = cx + Math.cos(thrustAngle) * thrustLen;
          const thrustY = cy + Math.sin(thrustAngle) * thrustLen;

          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(thrustX, thrustY);
          ctx.stroke();

          // Arrow head
          const headLen = 10;
          const headAngle1 = thrustAngle - Math.PI + 0.45;
          const headAngle2 = thrustAngle - Math.PI - 0.45;
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(thrustX, thrustY);
          ctx.lineTo(thrustX + Math.cos(headAngle1) * headLen, thrustY + Math.sin(headAngle1) * headLen);
          ctx.lineTo(thrustX + Math.cos(headAngle2) * headLen, thrustY + Math.sin(headAngle2) * headLen);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 9px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('FIELD-COUPLED THRUST F_net', thrustX, thrustY - 14);
          ctx.font = '8px ui-monospace, monospace';
          ctx.fillStyle = '#6ee7b7';
          ctx.fillText('[Δp_vessel = -Δp_corridor]', thrustX, thrustY - 4);
        }
      }

      // Draw Central Source N_0(t) and Central Axis A(t)
      // Central Axis piercing through (vertical elevation beam)
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sourceCanvasX, sourceCanvasY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Elevation z0 visual shadow / offset
      const zOffset = params.sourceHeight * 2.2;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.beginPath();
      ctx.arc(sourceCanvasX, sourceCanvasY + zOffset, 12, 0, Math.PI * 2);
      ctx.fill();

      // Source pulse glow
      const pulseSize = 10 + Math.sin(t * 3) * 3;
      const sourceGlow = ctx.createRadialGradient(
        sourceCanvasX,
        sourceCanvasY,
        2,
        sourceCanvasX,
        sourceCanvasY,
        pulseSize * 2.5
      );
      sourceGlow.addColorStop(0, '#fef08a');
      sourceGlow.addColorStop(0.4, '#f59e0b');
      sourceGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sourceGlow;
      ctx.beginPath();
      ctx.arc(sourceCanvasX, sourceCanvasY, pulseSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core Source Marker N_0
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sourceCanvasX, sourceCanvasY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Source Label
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`N₀(t) [z₀=${params.sourceHeight.toFixed(1)}]`, sourceCanvasX + 12, sourceCanvasY - 8);

      // Draw Probe if active
      if (activeProbe) {
        const probeCanvasX = cx + activeProbe.x;
        const probeCanvasY = cy + activeProbe.y;

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        // Crosshairs
        ctx.beginPath();
        ctx.arc(probeCanvasX, probeCanvasY, 12, 0, Math.PI * 2);
        ctx.moveTo(probeCanvasX - 16, probeCanvasY);
        ctx.lineTo(probeCanvasX + 16, probeCanvasY);
        ctx.moveTo(probeCanvasX, probeCanvasY - 16);
        ctx.lineTo(probeCanvasX, probeCanvasY + 16);
        ctx.stroke();

        // Local Poynting vector direction arrow from probe
        const arrowLen = Math.min(32, activeProbe.PoyntingMag * 20 + 8);
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(probeCanvasX, probeCanvasY);
        const pEndX = probeCanvasX + Math.cos(activeProbe.PoyntingAngle) * arrowLen;
        const pEndY = probeCanvasY + Math.sin(activeProbe.PoyntingAngle) * arrowLen;
        ctx.lineTo(pEndX, pEndY);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    isPlaying,
    params,
    renderMode,
    showGrid,
    showStreamlines,
    showNodeLabels,
    showSuperimposedHull,
    showCorridorThread,
    nodes,
    activeProbe,
    onParamsChange,
    onNodalUpdate,
  ]);

  // Handle Canvas Mouse Interaction for Probing & Source Dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Scale to canvas coordinate system
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = clientX * scaleX;
    const canvasY = clientY * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const simX = canvasX - cx;
    const simY = canvasY - cy;

    const measurement = calculateFieldAtPoint(simX, simY, timeRef.current, params, nodes);
    setActiveProbe(measurement);
    if (onProbeUpdate) {
      onProbeUpdate(measurement);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = clientX * scaleX;
    const canvasY = clientY * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const simX = canvasX - cx;
    const simY = canvasY - cy;

    const dr = Math.hypot(simX, simY);

    // Shift source N_0 to clicked point and update vectoring mode
    onParamsChange(prev => ({
      ...prev,
      sourceOffsetX: Math.max(-160, Math.min(160, simX)),
      sourceOffsetY: Math.max(-160, Math.min(160, simY)),
      motionPreset: 'static',
      vesselMode: dr > 4 ? 'vectoring_gamma_delta' : 'cruise_gamma_0',
    }));
  };

  const handleResetSource = () => {
    onParamsChange(prev => ({
      ...prev,
      sourceOffsetX: 0,
      sourceOffsetY: 0,
      sourceHeight: 10,
      motionPreset: 'static',
      vesselMode: 'cruise_gamma_0',
    }));
  };

  const isVectoringState = Math.hypot(params.sourceOffsetX, params.sourceOffsetY) >= 4;
  const engineMetrics = calculateVesselEngineMetrics(params);

  return (
    <div
      ref={containerRef}
      id="field-canvas-container"
      className="relative flex flex-col w-full h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl select-none"
    >
      {/* Top Dedicated Toolbar (Relative - Never overlaps canvas) */}
      <div id="canvas-control-header" className="relative z-10 p-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
          <span className="font-semibold text-amber-400 font-mono tracking-tight">
            N₀(t) → S = E × H
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono">
            {GEOMETRY_DEFINITIONS[params.geometry].name}
          </span>
          <span className="text-slate-500">|</span>
          {/* Phase 2 Operational State Badge */}
          <button
            onClick={handleResetSource}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
              !isVectoringState
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title={!isVectoringState ? 'Cruise State (Γ₀): Thread Centred. Click to reset.' : 'Vectoring State (Γ_δ): Thread Bent. Click to Recenter to Cruise.'}
          >
            {!isVectoringState ? 'Γ₀ Cruise (Centred)' : `Γ_δ Vectoring (Δr=${Math.hypot(params.sourceOffsetX, params.sourceOffsetY).toFixed(0)}px)`}
          </button>
          <span className="text-slate-500">|</span>
          {/* Nautical Stage HUD Badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/40"
            title={`Nautical Flight Stage: ${engineMetrics.activeNauticalStage.phaseLabel} — ${engineMetrics.activeNauticalStage.action}\nDoctrine: ${engineMetrics.activeNauticalStage.doctrineQuote}`}
          >
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>{engineMetrics.activeNauticalStage.phaseLabel}</span>
          </div>
          <span className="text-slate-500">|</span>
          {/* Impedance Matching Diagnostic */}
          <div
            className="flex items-center gap-1 font-mono text-[10px]"
            title={`Vessel Wave Impedance: ${engineMetrics.effectiveImpedance.toFixed(1)}Ω vs Corridor Medium: ${engineMetrics.activeCorridor.waveImpedanceOhm}Ω (|ΔZ| = ${engineMetrics.deltaZAbs.toFixed(1)}Ω, SWR = ${engineMetrics.standingWaveRatio.toFixed(2)})`}
          >
            <span className="text-slate-400">Z_v:</span>
            <span className="text-sky-300 font-bold">{engineMetrics.effectiveImpedance.toFixed(0)}Ω</span>
            <span className="text-slate-500">→</span>
            <span className="text-slate-400">Z_c:</span>
            <span className="text-emerald-300 font-bold">{engineMetrics.activeCorridor.waveImpedanceOhm}Ω</span>
            <span className={`px-1 rounded text-[9px] font-bold ${
              engineMetrics.deltaZAbs > 100
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : engineMetrics.deltaZAbs > 40
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              |ΔZ|={engineMetrics.deltaZAbs.toFixed(0)}Ω
            </span>
          </div>
          {/* Ejection Hazard Alarm if elevated */}
          {engineMetrics.ejectionHazardLevel !== 'NOMINAL' && (
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono animate-pulse ${
                engineMetrics.ejectionHazardLevel === 'CRITICAL_EJECTION_HAZARD'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500'
              }`}
              title="Hazard: Extreme impedance mismatch creates massive reflection, severe thermal blooming, and risk of ejection from the thread."
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {engineMetrics.ejectionHazardLevel === 'CRITICAL_EJECTION_HAZARD' ? 'Ejection Hazard' : 'Elevated Heating'}
            </span>
          )}
        </div>

        {/* Render Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            id="btn-mode-streamlines"
            onClick={() => setRenderMode('streamlines')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              renderMode === 'streamlines'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Streamlines of Poynting vector S (The Thread)"
          >
            Thread Streamlines
          </button>
          <button
            id="btn-mode-wavefronts"
            onClick={() => setRenderMode('wavefronts')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              renderMode === 'wavefronts'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="E_z Electric wave phase interference"
          >
            Wavefronts E_z
          </button>
          <button
            id="btn-mode-flux"
            onClick={() => setRenderMode('flux_density')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              renderMode === 'flux_density'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Poynting power flux density |S|"
          >
            Flux Density |S|
          </button>
          <button
            id="btn-mode-vectors"
            onClick={() => setRenderMode('vector_grid')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              renderMode === 'vector_grid'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Vector grid arrows S = E x H"
          >
            Vector Grid
          </button>
        </div>

        {/* View Options & Play/Pause */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            id="btn-toggle-play"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            id="btn-reset-source"
            onClick={handleResetSource}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Recenter Source N_0 to Cruise State (0,0,10)"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
          <button
            id="btn-toggle-corridor-thread"
            onClick={() => setShowCorridorThread(!showCorridorThread)}
            className={`p-1.5 rounded transition-colors ${
              showCorridorThread ? 'text-amber-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Corridor Thread Beam (Cruise vs Vectoring)"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            id="btn-toggle-superimposed-hull"
            onClick={() => setShowSuperimposedHull(!showSuperimposedHull)}
            className={`p-1.5 rounded transition-colors ${
              showSuperimposedHull ? 'text-emerald-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Superimposed Metamaterial Hull Layers"
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            id="btn-toggle-grid"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition-colors ${
              showGrid ? 'text-sky-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Polar Coordinates Grid"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            id="btn-toggle-nodes"
            onClick={() => setShowNodeLabels(!showNodeLabels)}
            className={`p-1.5 rounded transition-colors ${
              showNodeLabels ? 'text-emerald-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Node Identifiers"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High-visibility Ejection Hazard Warning Banner (Integrated below toolbar) */}
      {engineMetrics.ejectionHazardLevel !== 'NOMINAL' && (
        <div
          id="canvas-ejection-hazard-banner"
          className={`relative z-10 m-2 flex items-center justify-between px-3 py-1.5 rounded-lg font-mono text-xs border backdrop-blur-md shadow-xl transition-all ${
            engineMetrics.ejectionHazardLevel === 'CRITICAL_EJECTION_HAZARD'
              ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
              : 'bg-amber-950/90 border-amber-500 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold tracking-wider">
                {engineMetrics.ejectionHazardLevel === 'CRITICAL_EJECTION_HAZARD'
                  ? 'CRITICAL THREAD EJECTION HAZARD'
                  : 'ELEVATED IMPEDANCE THERMAL BLOOMING'}
              </span>
              <span className="mx-2 opacity-50">|</span>
              <span className="text-[11px] opacity-90">
                |ΔZ| = {engineMetrics.deltaZAbs.toFixed(1)}Ω, SWR = {engineMetrics.standingWaveRatio.toFixed(2)}. Reflection coefficient {(engineMetrics.impedanceMismatchCoeff * 100).toFixed(0)}% risks boundary destabilization.
              </span>
            </div>
          </div>
          <button
            onClick={handleResetSource}
            className="px-2.5 py-0.5 bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 rounded border border-rose-400 text-[10px] uppercase tracking-wider font-bold transition-colors whitespace-nowrap cursor-pointer ml-2"
          >
            Phase-Match / Recenter
          </button>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          id="electromagnetic-field-canvas"
          width={640}
          height={560}
          className="w-full h-full object-contain"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setActiveProbe(null);
            if (onProbeUpdate) onProbeUpdate(null);
          }}
          onClick={handleCanvasClick}
        />

        {/* Live Click Hint overlay */}
        <div className="absolute bottom-3 left-3 pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded border border-slate-800">
          Click canvas to reposition source <span className="text-amber-400">N₀(t)</span> • Hover to probe field
        </div>
      </div>

      {/* Probe Telemetry Mini-Strip (Bottom Right) */}
      {activeProbe && (
        <div
          id="probe-telemetry-panel"
          className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-purple-500/40 text-xs shadow-xl pointer-events-none min-w-[240px]"
        >
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
            <span className="font-semibold text-purple-300 flex items-center gap-1 font-mono">
              <Crosshair className="w-3.5 h-3.5" /> Probe (r={Math.hypot(activeProbe.x, activeProbe.y).toFixed(1)}px)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ({activeProbe.x.toFixed(0)}, {activeProbe.y.toFixed(0)})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
            <div className="text-slate-400">
              |S| (Power): <span className="text-amber-400 font-semibold">{activeProbe.PoyntingMag.toFixed(3)} W/m²</span>
            </div>
            <div className="text-slate-400">
              θ_S: <span className="text-sky-300">{((activeProbe.PoyntingAngle * 180) / Math.PI).toFixed(1)}°</span>
            </div>
            <div className="text-slate-400">
              Ez: <span className="text-blue-300">{activeProbe.Ez.toFixed(3)} V/m</span>
            </div>
            <div className="text-slate-400">
              |H|: <span className="text-rose-300">{Math.hypot(activeProbe.Hx, activeProbe.Hy).toFixed(3)} A/m</span>
            </div>
            <div className="text-slate-400">
              Impedance Z: <span className="text-emerald-300">{activeProbe.WaveImpedance.toFixed(1)} Ω</span>
            </div>
            <div className="text-slate-400">
              Phase φ: <span className="text-purple-300">{activeProbe.LocalPhase.toFixed(2)} rad</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
