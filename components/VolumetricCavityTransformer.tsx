'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  PolyhedralCavityType,
  POLYHEDRAL_CATALOG,
  VolumetricSimulationParams,
  calculateVolumetricCavityResponse,
  generateVolumetricStreamlines,
  runComparativeCavityBenchmark,
} from '@/lib/volumetric-cavity-engine';
import {
  Box,
  Layers,
  RotateCw,
  Zap,
  Sliders,
  Maximize2,
  Compass,
  ArrowDown,
  ArrowUp,
  Activity,
  CheckCircle2,
  RefreshCw,
  Eye,
  Play,
  Pause,
} from 'lucide-react';

export const VolumetricCavityTransformer: React.FC = () => {
  const [selectedCavity, setSelectedCavity] = useState<PolyhedralCavityType>('cube');
  const [inputPower, setInputPower] = useState<number>(45.0);
  const [frequency, setFrequency] = useState<number>(2.45);
  const [permittivity, setPermittivity] = useState<number>(2.2);
  const [conductivity, setConductivity] = useState<number>(0.05);
  const [wallPhase, setWallPhase] = useState<number>(0.0);
  const [polarization, setPolarization] = useState<number>(0.0);
  
  // 3D Viewport Controls
  const [rotX, setRotX] = useState<number>(22);
  const [rotY, setRotY] = useState<number>(-35);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showFaceNormals, setShowFaceNormals] = useState<boolean>(false);
  const [showCutaway, setShowCutaway] = useState<boolean>(false);
  const [animating, setAnimating] = useState<boolean>(true);
  const [animTime, setAnimTime] = useState<number>(0);

  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animating) return;
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      setAnimTime(prev => prev + dt);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animating]);

  const params: VolumetricSimulationParams = useMemo(() => ({
    cavityType: selectedCavity,
    inputPower,
    frequency,
    permittivity,
    conductivity,
    wallImpedancePhase: wallPhase,
    sourcePolarizationAngle: polarization,
    apertureAreaFraction: 0.08,
  }), [selectedCavity, inputPower, frequency, permittivity, conductivity, wallPhase, polarization]);

  const metrics = useMemo(() => {
    return calculateVolumetricCavityResponse(params);
  }, [params]);

  const streamlines = useMemo(() => {
    return generateVolumetricStreamlines(params, 16, 30);
  }, [params]);

  const benchmarkResults = useMemo(() => {
    return runComparativeCavityBenchmark(params);
  }, [params]);

  const currentDef = POLYHEDRAL_CATALOG[selectedCavity];

  // Mouse drag handlers for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotY(prev => prev + dx * 0.5);
    setRotX(prev => Math.max(-80, Math.min(80, prev - dy * 0.5)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // 3D Projection Helper (Isometric/Perspective into 2D SVG canvas)
  const project3D = (x: number, y: number, z: number, scale: number = 140, cx: number = 240, cy: number = 220) => {
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    // Rotate around Y axis
    const x1 = x * Math.cos(radY) + z * Math.sin(radY);
    const z1 = -x * Math.sin(radY) + z * Math.cos(radY);

    // Rotate around X axis
    const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

    // Perspective depth
    const fov = 3.2;
    const perspective = fov / (fov + z2 * 0.4);

    return {
      px: cx + x1 * scale * perspective,
      py: cy - y2 * scale * perspective,
      depth: z2,
    };
  };

  return (
    <div id="volumetric-cavity-transformer" className="flex flex-col gap-4 text-xs font-sans">
      {/* Doctrine Banner */}
      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Box className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 font-mono tracking-tight text-xs uppercase">
                Volumetric Field Transformer Paradigm: \Omega_G Cavity
              </span>
              <span className="px-1.5 py-0.2 rounded bg-sky-950 border border-sky-600/50 text-sky-300 text-[10px] font-mono">
                3D Boundary-Value Problem
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Energy enters aperture <code className="text-emerald-300 font-mono">A_in</code>, occupies internal volume <code className="text-sky-300 font-mono">\Omega_G</code> with standing modes and boundary reflections, and exits at <code className="text-amber-300 font-mono">A_out</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 font-mono text-[11px]">
          <span className="px-2.5 py-1 bg-slate-950 rounded border border-slate-800 text-slate-300">
            A_in → Ω_G → {`{E, H}`} → A_out
          </span>
        </div>
      </div>

      {/* Polyhedral Cavity Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
        {(Object.keys(POLYHEDRAL_CATALOG) as PolyhedralCavityType[]).map(type => {
          const item = POLYHEDRAL_CATALOG[type];
          const isSelected = selectedCavity === type;
          return (
            <button
              key={type}
              id={`cavity-select-${type}`}
              onClick={() => setSelectedCavity(type)}
              className={`flex flex-col items-center justify-center p-2 rounded transition-all text-center ${
                isSelected
                  ? 'bg-sky-950/80 border border-sky-500 text-sky-200 shadow-sm'
                  : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="font-bold font-mono text-[11px] capitalize">{type}</span>
              <span className="text-[9px] text-slate-400 mt-0.5">{item.faceCount} faces</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage & Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3D Visualizer Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2 relative">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-200 text-xs uppercase">
                {currentDef.name} ({currentDef.symmetryGroup})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Sphericity: {(currentDef.sphericity * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-toggle-normals"
                onClick={() => setShowFaceNormals(prev => !prev)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                  showFaceNormals
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Normals n̂
              </button>
              <button
                id="btn-toggle-cutaway"
                onClick={() => setShowCutaway(prev => !prev)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                  showCutaway
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Cutaway
              </button>
              <button
                id="btn-toggle-play"
                onClick={() => setAnimating(prev => !prev)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title={animating ? 'Pause Flow' : 'Play Flow'}
              >
                {animating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                id="btn-reset-view"
                onClick={() => { setRotX(22); setRotY(-35); }}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Reset View Orientation"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Interactive SVG 3D Viewport */}
          <div
            className="w-full h-96 bg-slate-900/90 rounded-lg border border-slate-850 relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg className="w-full h-full" viewBox="0 0 480 440">
              <defs>
                <radialGradient id="inletGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </radialGradient>
                <radialGradient id="outletGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </radialGradient>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Grid plane at bottom */}
              {[-1, -0.5, 0, 0.5, 1].map((gx, idx) => {
                const p1 = project3D(gx, -1.1, -1);
                const p2 = project3D(gx, -1.1, 1);
                const p3 = project3D(-1, -1.1, gx);
                const p4 = project3D(1, -1.1, gx);
                return (
                  <g key={`grid-${idx}`}>
                    <line x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1={p3.px} y1={p3.py} x2={p4.px} y2={p4.py} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                  </g>
                );
              })}

              {/* Entry Aperture A_in (Bottom -Z plane) */}
              {(() => {
                const inP = project3D(0, -0.92, 0);
                const ringPts = [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                  const ang = (i * Math.PI) / 4;
                  return project3D(0.25 * Math.cos(ang), -0.92, 0.25 * Math.sin(ang));
                });
                const dPath = ringPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(' ') + ' Z';
                return (
                  <g id="aperture-in-marker">
                    <path d={dPath} fill="url(#inletGlow)" stroke="#10b981" strokeWidth="1.5" />
                    <text x={inP.px + 22} y={inP.py + 4} fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      A_in ({inputPower}W)
                    </text>
                  </g>
                );
              })()}

              {/* Polyhedral Cavity Wireframe / Faces */}
              {(() => {
                // If Cube
                if (selectedCavity === 'cube') {
                  const cubeVerts = [
                    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
                  ];
                  const edges = [
                    [0, 1], [1, 2], [2, 3], [3, 0],
                    [4, 5], [5, 6], [6, 7], [7, 4],
                    [0, 4], [1, 5], [2, 6], [3, 7],
                  ];
                  return (
                    <g id="cavity-hull-cube">
                      {edges.map(([v1, v2], idx) => {
                        const p1 = project3D(cubeVerts[v1][0], cubeVerts[v1][1], cubeVerts[v1][2]);
                        const p2 = project3D(cubeVerts[v2][0], cubeVerts[v2][1], cubeVerts[v2][2]);
                        return (
                          <line
                            key={`edge-${idx}`}
                            x1={p1.px}
                            y1={p1.py}
                            x2={p2.px}
                            y2={p2.py}
                            stroke="#475569"
                            strokeWidth={showCutaway && idx % 3 === 0 ? '0.5' : '1.2'}
                            strokeDasharray={showCutaway && idx % 3 === 0 ? '2 2' : undefined}
                            opacity={showCutaway && idx % 3 === 0 ? 0.3 : 0.85}
                          />
                        );
                      })}
                    </g>
                  );
                }

                // If Octahedron
                if (selectedCavity === 'octahedron') {
                  const octVerts = [
                    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
                  ];
                  const edges = [
                    [0, 2], [2, 1], [1, 3], [3, 0], // equator
                    [0, 4], [1, 4], [2, 4], [3, 4], // top pyramid
                    [0, 5], [1, 5], [2, 5], [3, 5], // bottom pyramid
                  ];
                  return (
                    <g id="cavity-hull-octa">
                      {edges.map(([v1, v2], idx) => {
                        const p1 = project3D(octVerts[v1][0] * 1.1, octVerts[v1][1] * 1.1, octVerts[v1][2] * 1.1);
                        const p2 = project3D(octVerts[v2][0] * 1.1, octVerts[v2][1] * 1.1, octVerts[v2][2] * 1.1);
                        return (
                          <line
                            key={`oct-edge-${idx}`}
                            x1={p1.px}
                            y1={p1.py}
                            x2={p2.px}
                            y2={p2.py}
                            stroke="#475569"
                            strokeWidth="1.2"
                            opacity={0.85}
                          />
                        );
                      })}
                    </g>
                  );
                }

                // If Cylinder
                if (selectedCavity === 'cylinder') {
                  const segs = 16;
                  const topRing: { px: number; py: number; depth: number }[] = [];
                  const botRing: { px: number; py: number; depth: number }[] = [];
                  for (let s = 0; s < segs; s++) {
                    const a = (s * 2 * Math.PI) / segs;
                    topRing.push(project3D(0.85 * Math.cos(a), 0.92, 0.85 * Math.sin(a)));
                    botRing.push(project3D(0.85 * Math.cos(a), -0.92, 0.85 * Math.sin(a)));
                  }
                  return (
                    <g id="cavity-hull-cyl">
                      {topRing.map((p, i) => {
                        const next = topRing[(i + 1) % segs];
                        return <line key={`top-${i}`} x1={p.px} y1={p.py} x2={next.px} y2={next.py} stroke="#475569" strokeWidth="1.2" />;
                      })}
                      {botRing.map((p, i) => {
                        const next = botRing[(i + 1) % segs];
                        return <line key={`bot-${i}`} x1={p.px} y1={p.py} x2={next.px} y2={next.py} stroke="#475569" strokeWidth="1.2" />;
                      })}
                      {[0, 4, 8, 12].map(idx => (
                        <line
                          key={`post-${idx}`}
                          x1={botRing[idx].px}
                          y1={botRing[idx].py}
                          x2={topRing[idx].px}
                          y2={topRing[idx].py}
                          stroke="#475569"
                          strokeWidth="1"
                        />
                      ))}
                    </g>
                  );
                }

                // Sphere, Dodecahedron, Tetrahedron, Icosahedron generic wireframe rings
                const latCount = 5;
                const lonCount = 8;
                return (
                  <g id="cavity-hull-generic">
                    {Array.from({ length: latCount }).map((_, l) => {
                      const vFraction = (l + 1) / (latCount + 1);
                      const yVal = -0.9 + vFraction * 1.8;
                      const rad = Math.sqrt(Math.max(0.05, 1.0 - yVal * yVal * 0.7));
                      const ring = Array.from({ length: lonCount }).map((__, m) => {
                        const a = (m * 2 * Math.PI) / lonCount;
                        return project3D(rad * Math.cos(a), yVal, rad * Math.sin(a));
                      });
                      return (
                        <g key={`lat-${l}`}>
                          {ring.map((p, idx) => {
                            const next = ring[(idx + 1) % lonCount];
                            return (
                              <line
                                key={`ring-edge-${l}-${idx}`}
                                x1={p.px}
                                y1={p.py}
                                x2={next.px}
                                y2={next.py}
                                stroke="#475569"
                                strokeWidth="0.9"
                                opacity={0.7}
                              />
                            );
                          })}
                        </g>
                      );
                    })}
                  </g>
                );
              })()}

              {/* Streamlines of Energy Flow: S(r) = E x H */}
              {streamlines.map(line => {
                // Animate phase shift along streamline
                const offset = (animTime * 1.8) % 1.0;
                const pathString = line.points
                  .map((pt, i) => {
                    // Coordinates: Y-up in 3D is Z in the stream generator
                    const proj = project3D(pt.x, pt.z, pt.y);
                    return `${i === 0 ? 'M' : 'L'} ${proj.px.toFixed(1)} ${proj.py.toFixed(1)}`;
                  })
                  .join(' ');

                // Active pulsed packet along streamline
                const packetIdx = Math.floor(offset * (line.points.length - 1));
                const activePt = line.points[packetIdx];
                const activeProj = activePt ? project3D(activePt.x, activePt.z, activePt.y) : null;

                return (
                  <g key={`streamline-${line.id}`}>
                    <path
                      d={pathString}
                      fill="none"
                      stroke={line.color}
                      strokeWidth="1.2"
                      opacity={0.45}
                    />
                    {activeProj && (
                      <circle
                        cx={activeProj.px}
                        cy={activeProj.py}
                        r="2.5"
                        fill="#ffffff"
                        opacity={0.9}
                      />
                    )}
                  </g>
                );
              })}

              {/* Exit Aperture A_out (Top +Z plane) */}
              {(() => {
                const outP = project3D(0, 0.92, 0);
                const ringPts = [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                  const ang = (i * Math.PI) / 4;
                  return project3D(0.25 * Math.cos(ang), 0.92, 0.25 * Math.sin(ang));
                });
                const dPath = ringPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(' ') + ' Z';
                return (
                  <g id="aperture-out-marker">
                    <path d={dPath} fill="url(#outletGlow)" stroke="#38bdf8" strokeWidth="1.5" />
                    <line
                      x1={outP.px}
                      y1={outP.py}
                      x2={outP.px}
                      y2={outP.py - 30}
                      stroke="#38bdf8"
                      strokeWidth="2"
                      markerEnd="url(#arrow)"
                    />
                    <text x={outP.px + 22} y={outP.py - 12} fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      A_out ({metrics.throughPower.toFixed(2)}W | {(metrics.efficiencyThrough * 100).toFixed(1)}%)
                    </text>
                  </g>
                );
              })()}

              {/* Face Normals Vectors (if enabled) */}
              {showFaceNormals && currentDef.faces.slice(0, 12).map((f, idx) => {
                const [nx, ny, nz] = f.normal;
                const centerP = project3D(nx * 0.9, ny * 0.9, nz * 0.9);
                const tipP = project3D(nx * 1.3, ny * 1.3, nz * 1.3);
                return (
                  <g key={`normal-${idx}`}>
                    <line x1={centerP.px} y1={centerP.py} x2={tipP.px} y2={tipP.py} stroke="#f59e0b" strokeWidth="1.2" />
                    <circle cx={tipP.px} cy={tipP.py} r="1.5" fill="#f59e0b" />
                  </g>
                );
              })}
            </svg>

            {/* Instruction Overlay */}
            <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
              Drag to rotate 3D • Streamlines: S(r) = E × H
            </div>
          </div>
        </div>

        {/* Live Observables & Boundary Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Real-time Telemetry Dashboard */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-tight flex items-center justify-between">
              <span>Volumetric Observables</span>
              <span className="text-sky-400 font-normal">Ω_G = 1000 cm³</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900/90 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[10px]">Through Efficiency η_out:</span>
                <span className="text-sky-300 font-bold text-sm">
                  {(metrics.efficiencyThrough * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  P_out: {metrics.throughPower.toFixed(2)} W
                </span>
              </div>

              <div className="bg-slate-900/90 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[10px]">Cavity Q-Factor:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {metrics.qualityFactorQ.toFixed(0)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Stored U: {metrics.internalEnergyStored.toFixed(2)} J
                </span>
              </div>

              <div className="bg-slate-900/90 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[10px]">Ohmic Dissipation P_abs:</span>
                <span className="text-rose-400 font-bold text-xs">
                  {metrics.absorbedPower.toFixed(2)} W
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {((metrics.absorbedPower / inputPower) * 100).toFixed(1)}% of P_in
                </span>
              </div>

              <div className="bg-slate-900/90 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[10px]">Input Reflected P_refl:</span>
                <span className="text-amber-400 font-bold text-xs">
                  {metrics.reflectedPower.toFixed(2)} W
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {((metrics.reflectedPower / inputPower) * 100).toFixed(1)}% backscatter
                </span>
              </div>
            </div>

            {/* Radiation Force & Torque via Maxwell Stress Tensor */}
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-850 font-mono text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Maxwell Stress Force F:</span>
                <span className="text-slate-200 font-bold">
                  ({metrics.radiationForce[0].toFixed(2)}, {metrics.radiationForce[1].toFixed(2)}, {metrics.radiationForce[2].toFixed(2)}) ×10⁻⁸ N
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Angular Momentum Torque τ:</span>
                <span className="text-amber-300 font-bold">
                  ({metrics.radiationTorque[0].toFixed(2)}, {metrics.radiationTorque[1].toFixed(2)}, {metrics.radiationTorque[2].toFixed(2)}) ×10⁻⁸ N·m
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                <span className="text-slate-500">Dominant Cavity Mode:</span>
                <span className="text-sky-300 font-semibold">{currentDef.dominantCavityMode}</span>
              </div>
            </div>
          </div>

          {/* Boundary Value & Wave Parameter Sliders */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-tight flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Boundary Condition Tuning</span>
            </h4>

            {/* Dynamic Wall Phase Shift (Internal Impedance Steering) */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Internal Wall Phase Shift (Δϕ_wall):</span>
                <span className="text-amber-400 font-bold">
                  {(wallPhase * (180 / Math.PI)).toFixed(0)}° ({wallPhase.toFixed(2)} rad)
                </span>
              </div>
              <input
                id="slider-wall-phase"
                type="range"
                min="0"
                max="6.28"
                step="0.05"
                value={wallPhase}
                onChange={e => setWallPhase(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Demonstrates wave steering via surface impedance without changing outer physical hull geometry.
              </span>
            </div>

            {/* Carrier Frequency omega */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Carrier Frequency (ω):</span>
                <span className="text-sky-300 font-bold">{frequency.toFixed(2)} GHz</span>
              </div>
              <input
                id="slider-frequency"
                type="range"
                min="0.8"
                max="6.0"
                step="0.05"
                value={frequency}
                onChange={e => setFrequency(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Input Power P_in */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Input Aperture Power (P_in):</span>
                <span className="text-emerald-300 font-bold">{inputPower.toFixed(1)} W</span>
              </div>
              <input
                id="slider-power"
                type="range"
                min="10"
                max="100"
                step="1"
                value={inputPower}
                onChange={e => setInputPower(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Dielectric Loss sigma */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Substrate Conductivity (σ):</span>
                <span className="text-rose-400 font-bold">{conductivity.toFixed(2)} S/m</span>
              </div>
              <input
                id="slider-conductivity"
                type="range"
                min="0.0"
                max="0.4"
                step="0.01"
                value={conductivity}
                onChange={e => setConductivity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Polyhedral Cavity Benchmark Table */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-tight">
              Standardized 3D Volumetric Cavity Benchmark (V = 1000 cm³, A_in = A_out = 12.5 cm²)
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Holding internal volume, frequency ({frequency.toFixed(2)} GHz), input power ({inputPower}W), and aperture area strictly constant across all 7 polyhedral geometries.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-2.5">Geometry</th>
                <th className="py-2 px-2.5">Symmetry</th>
                <th className="py-2 px-2.5">Sphericity</th>
                <th className="py-2 px-2.5">P_out (W)</th>
                <th className="py-2 px-2.5">η_through</th>
                <th className="py-2 px-2.5">Q-Factor</th>
                <th className="py-2 px-2.5">Stored U (J)</th>
                <th className="py-2 px-2.5">||F|| (×10⁻⁸ N)</th>
                <th className="py-2 px-2.5">Dominant Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {benchmarkResults.map(res => {
                const isSelected = res.cavityId === selectedCavity;
                const def = POLYHEDRAL_CATALOG[res.cavityId];
                return (
                  <tr
                    key={res.cavityId}
                    onClick={() => setSelectedCavity(res.cavityId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-950/40 text-sky-200 font-semibold' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="py-2 px-2.5 flex items-center gap-1.5">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                      <span className="capitalize">{res.name}</span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-400">{res.symmetryGroup}</td>
                    <td className="py-2 px-2.5">{(def.sphericity * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2.5 text-sky-300">{res.throughPower.toFixed(2)}</td>
                    <td className="py-2 px-2.5 font-bold">
                      <span className={res.efficiencyThrough >= 0.75 ? 'text-emerald-400' : 'text-slate-300'}>
                        {(res.efficiencyThrough * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-emerald-400">{res.qualityFactorQ.toFixed(0)}</td>
                    <td className="py-2 px-2.5">{res.internalEnergyStored.toFixed(2)}</td>
                    <td className="py-2 px-2.5 text-amber-300">{res.radiationForceMag.toFixed(2)}</td>
                    <td className="py-2 px-2.5 text-slate-400 text-[10px]">{def.dominantCavityMode}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
