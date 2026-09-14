/**
 * CCV-01: Corridor Coupling Vehicle Physics & Systems Engine
 * 
 * Governing Doctrine:
 *   "The hull carries the people; the entire vessel couples to the corridor."
 *   "The geometry is not the ship's shape.
 *    The geometry is the electromagnetic state the ship occupies."
 * 
 * Cross-Section Architecture:
 *   Crew/Payload Spine \subset Field Core \subset Adaptive EM Lattice \subset Protective Hull
 *   "Quiet human core + violent electromagnetic exterior"
 * 
 * Field Mode Decomposition:
 *   \Psi_{vessel} = \sum_k a_k(t) \psi_k(r)
 *   Electromagnetic states: G_3 -> G_6 -> G_\infty
 * 
 * Three Structural Axes:
 *   \hat{m}: Mass Axis (Centre of mass, crew, structural spine)
 *   \hat{\Psi}_V: Field Axis (Where electromagnetic mode is centred)
 *   \hat{\Psi}_R: Corridor Axis (Local direction of external transport field)
 * 
 * In ideal cruise: \hat{m} \parallel \hat{\Psi}_V \parallel \hat{\Psi}_R
 * During manoeuvre: Field axis is intentionally tilted relative to corridor axis,
 * while the physical vehicle barely rotates:
 *   "The ship does not necessarily turn when it changes direction. Its coupling geometry turns."
 */

export type CCVOperatingState =
  | 'acquire'   // \Psi_env -> characterisation
  | 'match'     // Z_V -> Z_R, phi_V -> phi_R
  | 'lock'      // C_pair > C_critical
  | 'cruise'    // F_\perp \approx 0, \tau \approx 0
  | 'vector'    // \delta \Psi \neq 0 (controlled asymmetry)
  | 'release';  // C_pair -> 0 (graceful exit)

export type CCVModeGeometry = 'G3' | 'G6' | 'G_inf';

export type StabilityEnvelopeLevel = 'tight' | 'nominal' | 'wide';

export interface CCVPilotCommands {
  destinationVectorAngleDeg: number; // \theta_D in [-45, +45] degrees
  couplingAuthorityFraction: number; // 0.0 to 1.0 (coupling gain)
  stabilityEnvelope: StabilityEnvelopeLevel;
}

export interface CCVConcentricLayer {
  id: 'spine' | 'field_core' | 'adaptive_lattice' | 'protective_hull';
  name: string;
  radiusMeters: number; // Radial boundary
  description: string;
  fieldIntensityScaled: number; // Electric field magnitude in kV/m
  safetyMarginDb: number; // Shielding isolation in dB
  components: string[];
}

export interface CCVAxesVectors {
  massAxis: [number, number];       // \hat{m} (normalized 2D projection)
  fieldAxis: [number, number];      // \hat{\Psi}_V
  corridorAxis: [number, number];   // \hat{\Psi}_R
  angleMassToFieldDeg: number;      // Tilt between hull & field mode
  angleFieldToCorridorDeg: number;  // Tilt between field mode & rail
}

export interface CCVAuxiliarySystems {
  rcsStatus: 'active' | 'standby' | 'firing';
  rcsFuelPct: number;
  emergencyEngineStatus: 'ready' | 'armed' | 'firing';
  emergencyDeltaVMps: number;
  spineFluxDamIsolation: number; // dB (>120 dB nominal)
}

export interface CCVTelemetry {
  operatingState: CCVOperatingState;
  activeGeometryMode: CCVModeGeometry;
  // Impedance & Coupling
  vesselImpedanceOhm: number;
  corridorImpedanceOhm: number;
  couplingCoeff: number; // C_pair
  criticalCouplingThreshold: number; // C_critical (typically 0.65)
  isLocked: boolean;
  // Forces & Torques
  longitudinalThrustKn: number; // F_\parallel along corridor
  transverseForceKn: number;    // F_\perp (maneuvering force)
  inducedTorqueKnm: number;     // \tau (torque on physical hull)
  // Interior vs Exterior Field
  spineInteriorFieldVpm: number;  // E-field at crew neutral centre (safe < 0.05 V/m)
  exteriorLatticeFieldKvpm: number; // E-field at annular boundary
  poyntingPowerFluxMw: number;
  // Kinetic & Momentum
  corridorVelocityKmS: number;
  slipFraction: number;
  axes: CCVAxesVectors;
  auxiliary: CCVAuxiliarySystems;
}

export const CCV_OPERATING_STATE_INFO: Record<CCVOperatingState, {
  label: string;
  equation: string;
  summary: string;
  actionRequired: string;
  defaultGeometry: CCVModeGeometry;
}> = {
  acquire: {
    label: 'Acquire',
    equation: '\\Psi_{\\rm env} \\rightarrow \\text{characterisation}',
    summary: 'Probes external corridor phase velocity, wave impedance Z_R, and polarization without drawing reactive power.',
    actionRequired: 'Scan corridor harmonics, calibrate sensor baseline, avoid resonant disturbance.',
    defaultGeometry: 'G3',
  },
  match: {
    label: 'Match',
    equation: 'Z_V \\rightarrow Z_R, \\quad \\phi_V \\rightarrow \\phi_R',
    summary: 'Adjusts vessel surface impedance and internal phase to nullify reflections and thermal blooming.',
    actionRequired: 'Tune dielectric varactors, equalize Poynting impedance across aperture A_in.',
    defaultGeometry: 'G6',
  },
  lock: {
    label: 'Lock',
    equation: 'C_{\\rm pair} > C_{\\rm critical}',
    summary: 'Establishes phase-coherent electromagnetic coupling between the adaptive lattice and transport beam.',
    actionRequired: 'Engage superconducting flux locks, initialize steady-state circulatory modes.',
    defaultGeometry: 'G6',
  },
  cruise: {
    label: 'Cruise',
    equation: 'F_\\perp \\approx 0, \\quad \\tau \\approx 0, \\quad \\hat{m} \\parallel \\hat{\\Psi}_V \\parallel \\hat{\\Psi}_R',
    summary: 'Maintains symmetric longitudinal power transfer through the vehicle volume with zero net lateral torque.',
    actionRequired: 'Maintain G_6 or G_\\infty mode state, preserve neutral crew compartment isolation.',
    defaultGeometry: 'G6',
  },
  vector: {
    label: 'Vector',
    equation: '\\delta\\Psi \\neq 0 \\implies F_\\perp > 0',
    summary: 'Deliberately tilts the field axis \\hat{\\Psi}_V relative to corridor while the physical hull remains aligned.',
    actionRequired: 'Asymmetric eigenmode phase bias. The coupling geometry turns; the ship proceeds smoothly.',
    defaultGeometry: 'G3',
  },
  release: {
    label: 'Release',
    equation: 'C_{\\rm pair} \\rightarrow 0 \\implies \\text{Smooth Decoupling}',
    summary: 'Progressively ramps down coupling authority before corridor boundary exit to prevent inductive kickback.',
    actionRequired: 'Ramp down emitter authority, transition to auxiliary RCS attitude control and ballistics.',
    defaultGeometry: 'G_inf',
  },
};

export const CCV_CONCENTRIC_LAYERS: CCVConcentricLayer[] = [
  {
    id: 'spine',
    name: 'Crew / Payload Structural Spine',
    radiusMeters: 1.8,
    description: 'Situated precisely at the vessel electromagnetic neutral centre where field gradient vanishes (\\nabla E = 0).',
    fieldIntensityScaled: 0.002, // 2 mV/m - completely safe for humans
    safetyMarginDb: 142,
    components: ['Pressurized Crew Habitat', 'Flight Computer Core', 'Cryogenic Life Support', 'Conventional Fuel Cells'],
  },
  {
    id: 'field_core',
    name: 'Field Excitation Core',
    radiusMeters: 3.2,
    description: 'High-Q resonant transfer bus and superconducting flux bridges coupling power from generators to the lattice.',
    fieldIntensityScaled: 45.0, // 45 kV/m
    safetyMarginDb: 85,
    components: ['Superconducting Flux Bridges', 'RF Cavity Modulators', 'Dielectric Phase Changers', 'Thermal Buffers'],
  },
  {
    id: 'adaptive_lattice',
    name: 'Adaptive EM Lattice (The Engine)',
    radiusMeters: 4.6,
    description: 'Distributed conductors, phased emitters, and metamaterial arrays synthesizing \\Psi_{vessel} = \\sum a_k \\psi_k(r).',
    fieldIntensityScaled: 380.0, // 380 kV/m - intense coupled field
    safetyMarginDb: 35,
    components: ['Phased Annular Emitter Ribs', 'Metamaterial Varactor Arrays', 'Fast Magnetic Sensor Grid', 'Impedance Matchers'],
  },
  {
    id: 'protective_hull',
    name: 'Protective Outer Hull',
    radiusMeters: 5.2,
    description: 'Axisymmetric spindle/ellipsoid outer casing with annular cooling gills and micrometeorite shielding.',
    fieldIntensityScaled: 120.0, // Exterior dissipated boundary
    safetyMarginDb: 0,
    components: ['Boron-Nitride Nanotube Composite', 'Annular Radiator Ribs', 'RCS Attitude Quads', 'Emergency Abort Thruster'],
  },
];

/**
 * Calculates real-time telemetry for CCV-01 based on operational state,
 * geometry mode, and pilot commands.
 */
export function calculateCCVTelemetry(
  state: CCVOperatingState,
  geometryMode: CCVModeGeometry,
  pilot: CCVPilotCommands,
  corridorBaseZ: number = 377.0, // Free-space / corridor medium impedance
  timeSec: number = 0
): CCVTelemetry {
  const destAngleRad = (pilot.destinationVectorAngleDeg * Math.PI) / 180;
  const authority = Math.max(0, Math.min(1, pilot.couplingAuthorityFraction));

  // Geometry mode characteristics
  const modeImpedanceBias =
    geometryMode === 'G3' ? 48 : geometryMode === 'G6' ? 4 : 12;

  // Operating State parameters
  let couplingGain = 0;
  let isLocked = false;
  let targetVesselZ = corridorBaseZ;
  let speedKmS = 0;

  switch (state) {
    case 'acquire':
      couplingGain = 0.15 * authority;
      targetVesselZ = corridorBaseZ + 85 + modeImpedanceBias;
      isLocked = false;
      speedKmS = 22.0;
      break;
    case 'match':
      couplingGain = 0.52 * authority;
      targetVesselZ = corridorBaseZ + 12 + modeImpedanceBias * 0.2;
      isLocked = false;
      speedKmS = 48.0;
      break;
    case 'lock':
      couplingGain = 0.88 * authority;
      targetVesselZ = corridorBaseZ + modeImpedanceBias * 0.05;
      isLocked = true;
      speedKmS = 180.0;
      break;
    case 'cruise':
      couplingGain = 0.96 * authority;
      targetVesselZ = corridorBaseZ + (geometryMode === 'G6' ? 0.8 : 8.5);
      isLocked = true;
      speedKmS = 450.0;
      break;
    case 'vector':
      couplingGain = 0.82 * authority;
      targetVesselZ = corridorBaseZ + Math.abs(destAngleRad) * 40;
      isLocked = true;
      speedKmS = 420.0;
      break;
    case 'release':
      couplingGain = 0.25 * (1 - authority * 0.5);
      targetVesselZ = corridorBaseZ + 90;
      isLocked = false;
      speedKmS = 210.0;
      break;
  }

  // Coupling coefficient C_pair
  const couplingCoeff = Math.min(0.99, couplingGain * (geometryMode === 'G6' ? 1.0 : geometryMode === 'G_inf' ? 0.94 : 0.82));
  const criticalCoupling = 0.65;

  // Calculate 3-Axes:
  // 1. Corridor Axis: [0, 1] (Nominal travel direction forward)
  const corridorAxis: [number, number] = [0, 1];

  // 2. Field Axis: During vectoring, tilted by destination command * coupling authority
  //    In cruise, aligned with corridor axis [0, 1]
  let fieldAngleRad = 0;
  if (state === 'vector') {
    fieldAngleRad = destAngleRad * authority;
  } else if (state === 'cruise') {
    // Minute jitter or stabilization offset
    fieldAngleRad = 0.005 * Math.sin(timeSec * 2);
  } else {
    fieldAngleRad = destAngleRad * 0.3 * authority;
  }
  const fieldAxis: [number, number] = [
    Math.sin(fieldAngleRad),
    Math.cos(fieldAngleRad),
  ];

  // 3. Mass Axis: The physical hull orientation.
  //    THE CRUCIAL PRINCIPLE: The physical hull does NOT turn with the field!
  //    It remains aligned with momentum, with only a small residual inertial lag.
  const hullDamping = pilot.stabilityEnvelope === 'tight' ? 0.08 : pilot.stabilityEnvelope === 'nominal' ? 0.18 : 0.32;
  const massAngleRad = fieldAngleRad * hullDamping;
  const massAxis: [number, number] = [
    Math.sin(massAngleRad),
    Math.cos(massAngleRad),
  ];

  const angleMassToFieldDeg = ((fieldAngleRad - massAngleRad) * 180) / Math.PI;
  const angleFieldToCorridorDeg = (fieldAngleRad * 180) / Math.PI;

  // Forces and Torques
  const baseThrustKn = isLocked ? 2400.0 * couplingCoeff : 180.0 * couplingCoeff;
  const longitudinalThrustKn = baseThrustKn * Math.cos(fieldAngleRad);
  const transverseForceKn = baseThrustKn * Math.sin(fieldAngleRad) * 0.65;
  // Induced torque is minimized by axisymmetric spindle and central spine placement!
  const inducedTorqueKnm = Math.abs(transverseForceKn) * 0.08 * (1 - (geometryMode === 'G6' ? 0.85 : 0.5));

  // Electromagnetic Field Intensities
  // Spine Interior: Quiet human core protected by active symmetry cancellation & 140dB flux dams
  const spineInteriorFieldVpm = 0.002 + 0.003 * Math.abs(fieldAngleRad);
  const exteriorLatticeFieldKvpm = 250.0 + 150.0 * couplingCoeff;
  const poyntingPowerFluxMw = 48.0 * couplingCoeff * (geometryMode === 'G6' ? 1.05 : 0.9);

  return {
    operatingState: state,
    activeGeometryMode: geometryMode,
    vesselImpedanceOhm: targetVesselZ,
    corridorImpedanceOhm: corridorBaseZ,
    couplingCoeff,
    criticalCouplingThreshold: criticalCoupling,
    isLocked: couplingCoeff >= criticalCoupling,
    longitudinalThrustKn,
    transverseForceKn,
    inducedTorqueKnm,
    spineInteriorFieldVpm,
    exteriorLatticeFieldKvpm,
    poyntingPowerFluxMw,
    corridorVelocityKmS: speedKmS,
    slipFraction: isLocked ? 0.012 : 0.38,
    axes: {
      massAxis,
      fieldAxis,
      corridorAxis,
      angleMassToFieldDeg,
      angleFieldToCorridorDeg,
    },
    auxiliary: {
      rcsStatus: state === 'release' || state === 'acquire' ? 'active' : 'standby',
      rcsFuelPct: 94.2,
      emergencyEngineStatus: 'ready',
      emergencyDeltaVMps: 1850,
      spineFluxDamIsolation: 142.4,
    },
  };
}
