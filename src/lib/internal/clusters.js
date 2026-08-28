// Hardcoded for the first increment. Will move to a persisted store (JSON/db,
// still undecided) once the selector/add-cluster UI is built.
export function getClusters() {
  return [
    {
      id: 'demo-cluster',
      name: 'Demo Cluster',
      computeType: 'RTX 6000 Pro',
      hostingMode: 'subnet',
      subnet: {
        platform: 'targon',
        uid: process.env.INTERNAL_DEMO_UID || '',
      },
      contract: null,
      costs: {
        powerUsdPerMonth: 0,
        hostingUsdPerMonth: 0,
        hardwareAmortizationUsdPerMonth: 0,
      },
    },
  ];
}
