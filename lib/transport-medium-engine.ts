// Rail Layer (R) & Vessel Layer (V) Infrastructure Architecture Engine
// System Doctrine:
// T = R \oplus V
// v_max = f(corridor_strength, stability, phase_coherence, vessel_match)
// "Own the rails, then optimise the vehicle."

export type InfrastructurePhase = 'NATURAL_TOPOLOGY' | 'HYBRID_CANAL' | 'ENGINEERED_GRID';

export interface RailSegment {
  id: string;
  name: string;
  type: 'NATURAL_STREAM' | 'CONFINED_CHANNEL' | 'SUPERCONDUCTING_TRUNK' | 'SYNCHRONOUS_EXPRESS';
  originNode: string;
  destinationNode: string;
  corridorFieldStrengthTesla: number; // e.g. 0.05 to 12.5 T
  carrierFrequencyGhz: number;        // e.g. 1.2 to 240 GHz
  phaseCoherenceRatio: number;        // 0.0 to 1.0 (phase jitter / stability)
  powerGridCapacityMw: number;        // Megawatts delivered to the corridor
  railImpedanceZ0: number;            // Reference impedance (nominal 376.73 Ohms)
  status: 'STABLE_ONLINE' | 'TURBULENT_JITTER' | 'HIGH_VOLTAGE_PULSE';
  activeVesselsCount: number;
}

export interface NetworkHarborJunction {
  id: string;
  name: string;
  archetype: 'TERMINAL_HARBOUR' | 'RELAY_STATION' | 'HEXAGONAL_SWITCHING_JUNCTION' | 'FIELD_INJECTOR_SUBSTATION';
  coordinates: { x: number; y: number };
  gridSubstationPowerGw: number;
  plasmaCollimationArray: string;
  dockingCouplingEfficiency: number; // 0-100%
  connectedRailIds: string[];
}

export interface VesselConfiguration {
  id: string;
  name: string;
  classType: 'PROBE_COUPLED' | 'INTER-SYSTEM_FREIGHTER' | 'EXPRESS_PACKET' | 'PIONEER_SURVEY';
  impedanceZ: number;                 // Vessel impedance in Ohms
  eigenmodeSynthesisScore: number;    // 0.0 to 1.0 (dynamic hull conditioning)
  phaseLockBandwidthMhz: number;      // Tracking bandwidth
  couplingCrossSectionM2: number;     // Physical aperture
  maxStructuralLoadG: number;         // Max acceleration threshold
}

export interface SystemDynamicPairResult {
  vesselName: string;
  railName: string;
  systemCouplingProduct: number;      // 0.0 to 1.0 (Z_match * phase_coherence)
  effectiveThrustKiloNewtons: number;
  maxAttainableVelocityC: number;     // Fraction of c (e.g. 0.02c up to 0.45c)
  impedanceMismatchDb: number;
  energyDissipationLossMw: number;
  transportThroughputTonKmS: number;
  railStressIndexPercent: number;
  operationalRegime: 'SUB-CRITICAL' | 'RESONANT_LOCK' | 'CAVITATION_RISK';
}

export const DEFAULT_JUNCTIONS: NetworkHarborJunction[] = [
  {
    id: 'junc-alpha',
    name: 'Sol Central Substation & Injection Harbour',
    archetype: 'TERMINAL_HARBOUR',
    coordinates: { x: 100, y: 260 },
    gridSubstationPowerGw: 85.0,
    plasmaCollimationArray: 'Phased High-Temperature Pinch Arrays (64 MW/rad)',
    dockingCouplingEfficiency: 99.4,
    connectedRailIds: ['rail-1', 'rail-4']
  },
  {
    id: 'junc-relay-l4',
    name: 'Lagrange L4 Hexagonal Switching Junction',
    archetype: 'HEXAGONAL_SWITCHING_JUNCTION',
    coordinates: { x: 300, y: 150 },
    gridSubstationPowerGw: 42.0,
    plasmaCollimationArray: 'Hexagonal G₆ Synchronous Resonator Loop',
    dockingCouplingEfficiency: 96.8,
    connectedRailIds: ['rail-1', 'rail-2', 'rail-5']
  },
  {
    id: 'junc-heliopause',
    name: 'Heliospheric Current Sheet Tap (Outer Relay)',
    archetype: 'RELAY_STATION',
    coordinates: { x: 520, y: 240 },
    gridSubstationPowerGw: 18.5,
    plasmaCollimationArray: 'Biaxial Magnetic Siphon Stator',
    dockingCouplingEfficiency: 91.2,
    connectedRailIds: ['rail-2', 'rail-3']
  },
  {
    id: 'junc-kuiper-harbour',
    name: 'Kuiper Deep Terminal Harbour & Buffer',
    archetype: 'TERMINAL_HARBOUR',
    coordinates: { x: 740, y: 260 },
    gridSubstationPowerGw: 120.0,
    plasmaCollimationArray: 'Superconducting Solenoid Deceleration Funnel',
    dockingCouplingEfficiency: 98.7,
    connectedRailIds: ['rail-3', 'rail-6']
  },
  {
    id: 'junc-inner-spur',
    name: 'Venus Phase Relay Spur',
    archetype: 'FIELD_INJECTOR_SUBSTATION',
    coordinates: { x: 260, y: 380 },
    gridSubstationPowerGw: 34.0,
    plasmaCollimationArray: 'Coaxial Laser-Sustained Plasma Channel',
    dockingCouplingEfficiency: 93.5,
    connectedRailIds: ['rail-4', 'rail-5', 'rail-6']
  }
];

export const DEFAULT_RAILS: RailSegment[] = [
  {
    id: 'rail-1',
    name: 'Sol-L4 Heavy Freight Channel (R₁)',
    type: 'CONFINED_CHANNEL',
    originNode: 'junc-alpha',
    destinationNode: 'junc-relay-l4',
    corridorFieldStrengthTesla: 4.8,
    carrierFrequencyGhz: 24.5,
    phaseCoherenceRatio: 0.94,
    powerGridCapacityMw: 4500,
    railImpedanceZ0: 376.7,
    status: 'STABLE_ONLINE',
    activeVesselsCount: 8
  },
  {
    id: 'rail-2',
    name: 'L4-Heliospheric Current Waveguide (R₂)',
    type: 'NATURAL_STREAM',
    originNode: 'junc-relay-l4',
    destinationNode: 'junc-heliopause',
    corridorFieldStrengthTesla: 1.4,
    carrierFrequencyGhz: 8.2,
    phaseCoherenceRatio: 0.72,
    powerGridCapacityMw: 1800,
    railImpedanceZ0: 382.4,
    status: 'TURBULENT_JITTER',
    activeVesselsCount: 3
  },
  {
    id: 'rail-3',
    name: 'Outer Deep Superconducting Express Trunk (R₃)',
    type: 'SYNCHRONOUS_EXPRESS',
    originNode: 'junc-heliopause',
    destinationNode: 'junc-kuiper-harbour',
    corridorFieldStrengthTesla: 11.2,
    carrierFrequencyGhz: 140.0,
    phaseCoherenceRatio: 0.992,
    powerGridCapacityMw: 12000,
    railImpedanceZ0: 376.73,
    status: 'STABLE_ONLINE',
    activeVesselsCount: 14
  },
  {
    id: 'rail-4',
    name: 'Sol-Venus Magnetic Conduit (R₄)',
    type: 'CONFINED_CHANNEL',
    originNode: 'junc-alpha',
    destinationNode: 'junc-inner-spur',
    corridorFieldStrengthTesla: 3.5,
    carrierFrequencyGhz: 18.0,
    phaseCoherenceRatio: 0.88,
    powerGridCapacityMw: 3200,
    railImpedanceZ0: 374.2,
    status: 'STABLE_ONLINE',
    activeVesselsCount: 5
  },
  {
    id: 'rail-5',
    name: 'L4-Venus Cross-Cut Switching Arc (R₅)',
    type: 'SUPERCONDUCTING_TRUNK',
    originNode: 'junc-relay-l4',
    destinationNode: 'junc-inner-spur',
    corridorFieldStrengthTesla: 6.8,
    carrierFrequencyGhz: 60.0,
    phaseCoherenceRatio: 0.965,
    powerGridCapacityMw: 6800,
    railImpedanceZ0: 376.7,
    status: 'STABLE_ONLINE',
    activeVesselsCount: 6
  },
  {
    id: 'rail-6',
    name: 'Inner-Kuiper High-Tension Bypasser (R₆)',
    type: 'SYNCHRONOUS_EXPRESS',
    originNode: 'junc-inner-spur',
    destinationNode: 'junc-kuiper-harbour',
    corridorFieldStrengthTesla: 9.6,
    carrierFrequencyGhz: 95.0,
    phaseCoherenceRatio: 0.98,
    powerGridCapacityMw: 9500,
    railImpedanceZ0: 376.8,
    status: 'HIGH_VOLTAGE_PULSE',
    activeVesselsCount: 4
  }
];

export const DEFAULT_VESSELS: VesselConfiguration[] = [
  {
    id: 'vessel-pioneer',
    name: 'Pioneer Survey Hull (Primitive Generation)',
    classType: 'PIONEER_SURVEY',
    impedanceZ: 395.0, // High mismatch against 376.73
    eigenmodeSynthesisScore: 0.45,
    phaseLockBandwidthMhz: 12.0,
    couplingCrossSectionM2: 80.0,
    maxStructuralLoadG: 4.5
  },
  {
    id: 'vessel-standard-freight',
    name: 'Standard System Cargo Hopper ("Rolling Stock Mk II")',
    classType: 'INTER-SYSTEM_FREIGHTER',
    impedanceZ: 378.5,
    eigenmodeSynthesisScore: 0.78,
    phaseLockBandwidthMhz: 85.0,
    couplingCrossSectionM2: 240.0,
    maxStructuralLoadG: 6.0
  },
  {
    id: 'vessel-resonant-express',
    name: 'Hyper-Coherent Express Cutter ("Phase-Racer")',
    classType: 'EXPRESS_PACKET',
    impedanceZ: 376.8, // Nearly exact match
    eigenmodeSynthesisScore: 0.98,
    phaseLockBandwidthMhz: 450.0,
    couplingCrossSectionM2: 120.0,
    maxStructuralLoadG: 18.0
  }
];

/**
 * Calculates the composite System Velocity & Dynamics:
 * T = R \oplus V
 * v_max = f(rail_strength, stability, coherence, vessel_match)
 */
export function computeSystemPairDynamics(
  rail: RailSegment,
  vessel: VesselConfiguration
): SystemDynamicPairResult {
  // 1. Impedance Matching Ratio (Reflection Gamma):
  // Gamma = |(Z_v - Z_0) / (Z_v + Z_0)|
  const z0 = rail.railImpedanceZ0;
  const zv = vessel.impedanceZ;
  const reflectionCoeff = Math.abs((zv - z0) / (zv + z0));
  const transmissionRatio = 1 - reflectionCoeff; // 0 to 1
  const returnLossDb = reflectionCoeff > 0 ? -20 * Math.log10(reflectionCoeff) : 60;

  // 2. System Coupling Product:
  // eta = transmission * rail.phaseCoherence * vessel.eigenmodeScore
  const systemCoupling = transmissionRatio * rail.phaseCoherenceRatio * vessel.eigenmodeSynthesisScore;

  // 3. Maximum Attainable Velocity (fraction of lightspeed c):
  // v_max is fundamentally capped by the rail's synchronous carrier wave speed and field intensity
  // Baseline rail capability:
  const railPotentialC = (rail.corridorFieldStrengthTesla / 12.0) * 0.35 + (rail.powerGridCapacityMw / 15000) * 0.15;
  
  // Actual realized velocity based on pair match:
  const realizedVelocityC = railPotentialC * systemCoupling;

  // 4. Force Generation:
  // F = (P_rail * Coupling * 10^3) / (realized_v * c)
  const effectiveThrustKn = (rail.powerGridCapacityMw * systemCoupling * 1.8) / (1 + realizedVelocityC * 10);

  // 5. Energy Dissipation / Thermal Loss
  const energyLossMw = rail.powerGridCapacityMw * (1 - systemCoupling) * 0.45;

  // 6. Rail Stress Index
  const railStress = (vessel.couplingCrossSectionM2 / 300) * (rail.activeVesselsCount / 12) * 100;

  // 7. Operational Regime
  let regime: 'SUB-CRITICAL' | 'RESONANT_LOCK' | 'CAVITATION_RISK' = 'SUB-CRITICAL';
  if (systemCoupling > 0.82 && returnLossDb > 25) {
    regime = 'RESONANT_LOCK';
  } else if (reflectionCoeff > 0.12 && rail.corridorFieldStrengthTesla > 8.0) {
    regime = 'CAVITATION_RISK';
  }

  // 8. Transport Throughput (ton-km/s proxy)
  const throughput = (realizedVelocityC * 300000) * (vessel.couplingCrossSectionM2 * 1.5) * (1 - reflectionCoeff);

  return {
    vesselName: vessel.name,
    railName: rail.name,
    systemCouplingProduct: systemCoupling,
    effectiveThrustKiloNewtons: effectiveThrustKn,
    maxAttainableVelocityC: realizedVelocityC,
    impedanceMismatchDb: returnLossDb,
    energyDissipationLossMw: energyLossMw,
    transportThroughputTonKmS: throughput,
    railStressIndexPercent: Math.min(100, railStress),
    operationalRegime: regime
  };
}
