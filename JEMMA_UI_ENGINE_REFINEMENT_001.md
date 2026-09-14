# JEMMA UI / ENGINE REFINEMENT 001 — USABLE MODEL PASS
**Document Identifier**: `JEMMA_UI_ENGINE_REFINEMENT_001.md`  
**Target Git Branch**: `jemma/ui-engine-refinement-001`  
**System**: `Electromagnetic Poynting Field Architecture & CCV-01 Propulsion Interface`  
**Execution Objective**: Clean, usable, mobile-first operator workflow with strict thermodynamic/Poynting energy accounting and clear truth/provenance boundaries.

---

## 1. Executive Summary & Core Doctrine

The primary objective of this refinement pass is to **preserve the conceptual architecture, visual identity, terminology, and operator workflow** of the *Electromagnetic Poynting Field Architecture* without redesigning or replacing the product concept. The system remains anchored by the three primary operator domains:

1. **`Field Workbench`**: Dominant 3D/2D field-volume testing ($\Omega_G$) with Poynting vector power flow $\mathbf{S}(\mathbf{r}, t) = \mathbf{E} \times \mathbf{H}$, input/output apertures ($A_{\rm in}, A_{\rm out}$), and live nodal telemetry.
2. **`Phase 2: Vessel as Engine`**: The fundamental physical doctrine:
   $$\Delta p_{\rm vessel} = -\Delta p_{\rm corridor}$$
   $$\text{environmental field} \rightarrow \text{vessel geometry} \rightarrow \text{field redistribution} \rightarrow \text{momentum exchange} \rightarrow \text{motion}$$
   Operating across $\Gamma_0$ (thread-centred cruise) and $\Gamma_\delta$ (thread-offset vectoring) regimes.
3. **`Rail Infrastructure`**: The sovereign transport medium doctrine:
   $$\mathcal{T} = \mathcal{R} \oplus \mathcal{V}$$
   Proving the ship-rail paradox ($\text{primitive vessel} \oplus \text{engineered rail} > \text{advanced vessel} \oplus \text{poor rail}$).

All propulsion telemetry and dynamic corridor acceleration models are formally labeled as `SIMULATED / HYPOTHETICAL` with auditable provenance badges across the entire interface.

---

## 2. Current UX Problems Identified

1. **Inverted Comprehension Hierarchy**:
   The operator interface occasionally interleaved secondary background theory and lengthy explanatory cards above interactive controls, violating the canonical operator sequence:
   $$\boxed{\text{STATE} \rightarrow \text{VISUALISATION} \rightarrow \text{CONTROL} \rightarrow \text{TELEMETRY} \rightarrow \text{INTERPRETATION}}$$
2. **Dominance of 2D Cross-Section over 3D Cavity**:
   The Field Workbench originally defaulted to a 2D planar canvas, isolating the 3D Volumetric Cavity ($\Omega_G$) into a secondary view. The 3D volumetric field-forming cavity is the core physics object and must be the dominant element.
3. **Touch-Target & Mobile Density Issues**:
   - Several selector buttons and chips lacked minimum 44px touch targets on mobile viewports.
   - Multi-column grids (such as 6-column geometry tabs) broke onto tight rows with unpadded borders.
   - Rail Infrastructure corridor map labels and clickable lines were difficult to isolate on touchscreens.
4. **Visual Redundancy & Repeated Headers**:
   Multiple nested panels repeated identical subheadings ("OPERATOR COMMAND CONSOLE", "ACTIVE POLYGON ECOSYSTEM", "CENTRAL AXIS TRAJECTORY"), consuming valuable vertical rhythm.
5. **Hardcoded Optimality Bias**:
   Reference geometry $G_6$ (hexagonal lattice) was occasionally presented with hardcoded "optimal" tags rather than dynamically competing against $G_3, G_4, G_5, G_8, G_\infty$ and 3D Platonic polyhedra under customizable objective weights $J = w_\eta\eta + w_U U - w_L L$.
6. **Energy Balance Ambiguity**:
   Power conservation was not surfaced as an auditable single-equation balance in real-time, obscuring the exact split between through-transmission, reflection, ohmic dissipation, and radiative leakage.
7. **Missing Truth / Provenance Badging**:
   Simulated mathematical outputs (e.g. effective thrust forces in mN, Maxwell stress torques, hyper-relativistic velocity fractions) lacked explicit provenance tags, creating potential confusion between classical Maxwell derivations and speculative macroscopic propulsion applications.

---

## 3. Proposed UI Changes & Design Grammar

### A. Strict Ergonomic Operator Flow
Every primary view organizes elements into this exact order:
1. **STATE**: Compact telemetry strip displaying current mode ($\Gamma_0$ vs $\Gamma_\delta$), active geometry $G_n / \Omega_G$, carrier frequency $\omega_0$, and energy balance status.
2. **VISUALISATION**: Dominant interactive stage (3D Volumetric Cavity $\Omega_G$ with cutaway, Poynting streamlines, and aperture highlights, with quick toggle to 2D nodal flux).
3. **CONTROL**: Tactile, mobile-friendly parameter sliders and preset chips (touch targets $\ge 44$px).
4. **TELEMETRY**: High-contrast, tabular and card readouts with monospaced scientific notation and auditable conservation tallies.
5. **INTERPRETATION**: Contextual physics codex, causal hypotheses, and synthesis dialog situated below the control surface.

### B. Visual Identity & Contrast Discipline
- **Palette**: Slate-950 base background (`#020617`), slate-900 container surfaces (`#0f172a`), cyan/teal accents (`#38bdf8`, `#14b8a6`) for Poynting flux and field vectors, amber/gold (`#f59e0b`, `#fbbf24`) for central thread $N_0(t)$ and rail infrastructure, and emerald (`#10b981`) for locked cruise states.
- **Mathematical Nesting**: Container outer padding strictly exceeds inner element gaps; inner corner radii follow $R_{\rm inner} = R_{\rm outer} - \text{Padding}$.
- **Labels**: Button and chip text enforces `white-space: nowrap` and zero hyphenation.

---

## 4. Component-Level Changes

### 1. `FieldCanvas.tsx` & Field Workbench View
- **Dominant 3D/2D Integration**: Unified viewer component combining 3D polyhedral cavity inspection ($\Omega_G$) and 2D planar Poynting flow with zero layout shift.
- **Interactive Viewport Controls**: Smooth orbital drag-to-rotate, pinch/wheel zoom, interior cutaway toggle, surface face normals ($\hat{n}$), streamline vectors, and input/output aperture highlight rings ($A_{\rm in}, A_{\rm out}$).
- **Energy Balance Ledger**: Inline diagnostic bar proving:
  $$P_{\rm in} = P_{\rm out} + P_{\rm reflected} + P_{\rm ohmic} + P_{\rm leak} + \frac{dU_{\rm field}}{dt}$$
  with a zero-residual check: $|P_{\rm in} - \sum P_i| < 10^{-5}\text{ W}$.

### 2. `OperatorDashboard.tsx`
- **Mobile-First Responsive Refactor**: Controls grouped into accordion-style collapsible field layers ($N_0$ Source Axis, $\hat{G}$ Geometry Operator, Environment Media, Optimality Objective).
- **Dynamic Optimality Preset Matrix**: Interactive switcher between **Balanced**, **Efficiency-First**, **Uniformity-First**, and **Loss-Minimisation** weight presets.
- **Computed Winner**: $G^* = \arg\max_{G_n} J_n$ computed live with dynamic ranking instead of static reference declarations.

### 3. `VesselEngineArchitecture.tsx` & `CCV01VehicleStudio.tsx`
- **Explicit Provenance Tags**: Every propulsion metric carries an explicit `[SIMULATED]` or `[HYPOTHETICAL]` badge.
- **Clarified Three Kinematic Axes**: Mass Axis ($\hat{m}$), Field Axis ($\hat{\Psi}_V$), and Rail Axis ($\hat{\Psi}_R$) with mobile-friendly readout.
- **Direct Momentum Exchange Readout**: Visualizing $\Delta p_{\rm vessel} = -\Delta p_{\rm corridor}$ without internal propellant.

### 4. `TransportMediumView.tsx`
- **Mobile Readability Overhaul**:
  - Increased SVG junction node touch targets ($r \ge 24$px clickable hitboxes).
  - High-visibility node labels with background contrast pills.
  - Interactive corridor selector chips with immediate feedback.
- **Audited Paradox Matrix**: Clear visual cards demonstrating $V_{\rm prim} \oplus R_{\rm eng} > V_{\rm adv} \oplus R_{\rm nat}$ with provenance indicators.

---

## 5. Engine-Level Changes

### A. Layer 1: Source State $N_0(t)$
- Explicit parameters:
  - Amplitude $A_0$ / Input Power $P_{\rm in}$
  - Carrier angular frequency $\omega$
  - Phase $\phi_0$
  - Polarization angle $\alpha_{\rm pol}$ (linear) / helicity (circular/chiral)
  - 3D Position & Trajectory $\mathbf{r}_0(t) = (x_0(t), y_0(t), z_0(t))$

### B. Layer 2: Geometry / Field Operator $\hat{G}(t)$
- Generalized operator formulation:
  $$\Psi_{t+\Delta t} = \hat{G}(t)\Psi_t$$
  Where $\hat{G}(t)$ incorporates:
  - Boundary manifold $\Omega_G$ and surface apertures $A_{\rm in}, A_{\rm out}$
  - Symmetry representation ($C_{nv}, D_{nh}, O_h, T_d, I_h$)
  - Distributed eigenmode state: $\Psi_{\rm vessel} = \sum_k a_k(t)\psi_k(\mathbf{r})$
  - Dynamic wall impedance and boundary phase shift $\delta\phi_{\rm wall}$

### C. Layer 3: Environment Substrate
- Spatially dependent constitutive tensors:
  $$\epsilon(\mathbf{r}, t), \quad \mu(\mathbf{r}, t), \quad \sigma(\mathbf{r}, t)$$

### D. Layer 4: Energy Accounting & Conservation
- Strictly enforce:
  $$P_{\rm in} \equiv P_{\rm out} + P_{\rm reflected} + P_{\rm ohmic} + P_{\rm leak} + \frac{dU_{\rm field}}{dt}$$
  In steady-state: $\frac{dU_{\rm field}}{dt} = 0$.
- Trace every displayed efficiency $\eta$ directly to this ledger.

---

## 6. Truth & Provenance Boundary System

A standardized provenance taxonomy is implemented across all components:

| Provenance Tag | Definition | Usage Examples |
| :--- | :--- | :--- |
| `[MEASURED]` | Empirically observed physical constants | Speed of light $c$, vacuum permittivity $\epsilon_0$, free-space impedance $Z_0 = 376.73\,\Omega$ |
| `[DERIVED]` | Mathematically derived from classical electrodynamics | Poynting vector $\mathbf{S} = \mathbf{E} \times \mathbf{H}$, boundary normal reflections, Maxwell stress tensor integration |
| `[SIMULATED]` | Computed via numerical model / finite approximation | Cavity quality factor $Q$, streamline trajectories, nodal power capture, radiation torque |
| `[HYPOTHETICAL]`| Speculative space transport extrapolation | Vessel-as-engine macroscopic momentum exchange, cosmic corridor coupling thrust |
| `[STATIC]` | Model geometry definitions and invariant topologies | Polyhedral vertex coordinates, Platonic solid facet count, symmetry group |

**Strict Anti-Fabrication Rules**:
- No synthetic cryptographic hashes or mock verification receipts.
- No hardcoded "OPTIMAL" claims without objective function evaluation.
- No ungrounded propulsion performance presented as experimental fact.

---

## 7. Files Affected

1. `JEMMA_UI_ENGINE_REFINEMENT_001.md` (This document)
2. `lib/physics-engine.ts` (Source state $N_0$, operator $\hat{G}$, energy accounting, provenance metadata, dynamic optimality solver)
3. `lib/volumetric-cavity-engine.ts` (3D cavity apertures, energy balance verification, streamline generators)
4. `components/FieldCanvas.tsx` (3D/2D dominant field volume inspection, toolbar simplification, energy audit banner)
5. `components/OperatorDashboard.tsx` (Mobile-first control grouping, dynamic optimality matrix, provenance tags)
6. `components/VesselEngineArchitecture.tsx` (Refined cockpit, simulated propulsion disclaimers, clear kinematic axes)
7. `components/TransportMediumView.tsx` (Mobile-friendly SVG rail map, legible junction nodes, paradox matrix clarity)
8. `components/CCV01VehicleStudio.tsx` (Concentric layer inspection, provenance tags, ergonomic state machine)
9. `app/page.tsx` (Navigation hierarchy, primary domain layout, non-overlapping header)

---

## 8. Changes That Must NOT Be Made

- Do **not** replace or discard the core conceptual doctrine (*"The hull carries the people; the entire vessel couples to the corridor"*).
- Do **not** remove the 3 primary domains (`Field Workbench`, `Phase 2: Vessel as Engine`, `Rail Infrastructure`).
- Do **not** switch to a light generic SaaS dashboard aesthetic; preserve the dark technical Pathfinder UI with cyan/amber/emerald palette.
- Do **not** add speculative new fictional infrastructure not grounded in the existing corridor matrix.
- Do **not** delete existing 2D polygon formulations or 3D polyhedral models; unify them coherently.

---

## 9. Implementation Order

1. **Phase 1: Architecture & Engine Layering**: Update `physics-engine.ts` and `volumetric-cavity-engine.ts` with explicit source/operator/environment/accounting layers and provenance types.
2. **Phase 2: Field Workbench Refinement**: Embed the dominant 3D cavity visualizer with 2D cross-section toggle directly in `FieldCanvas.tsx` and integrate the strict energy balance ledger.
3. **Phase 3: Operator Controls & Optimality Model**: Update `OperatorDashboard.tsx` with mobile-first hierarchy, 44px touch targets, and dynamic $J_n$ optimality computation.
4. **Phase 4: Vessel Engine & CCV-01 Provenance Audit**: Surface `[SIMULATED / HYPOTHETICAL]` badges, momentum exchange readouts, and kinematic axes in `VesselEngineArchitecture.tsx` and `CCV01VehicleStudio.tsx`.
5. **Phase 5: Rail Infrastructure Usability**: Enhance mobile SVG readability, tap targets, and telemetry grouping in `TransportMediumView.tsx`.
6. **Phase 6: Verification & Compilation**: Validate build via `lint_applet` and `compile_applet`, verifying zero regressions across all views.
