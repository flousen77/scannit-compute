// Shared cost/profit math for cluster cards AND the portfolio totals bar.
// Framework-agnostic (no React) so it can run in both server (page.jsx) and
// client (ClusterCard.jsx) contexts without duplicating formulas — the whole
// point being that "per-GPU earnings", "cost per GPU", and "profit" can't
// silently drift into two different implementations.

export const HOURS_PER_MONTH = 720;

// cost.value means different things per mode: per_hour is a per-GPU rate,
// per_month is the cluster's total monthly bill (so it needs dividing by
// cardCount too, on top of converting month -> hour).
export function getCostPerGpuPerHour(cost, cardCount) {
  if (!cost) return null;
  if (cost.mode === 'per_hour') return cost.value;
  return cardCount ? cost.value / HOURS_PER_MONTH / cardCount : null;
}

export function deriveSubnetEarnings({ earnings, nodes }) {
  const cardCount = nodes?.combined?.avg_cards ?? null;
  const earningsPerGpuPerHour =
    earnings?.hours && cardCount ? earnings.usd_realized / (earnings.hours * cardCount) : null;
  return { cardCount, earningsPerGpuPerHour };
}

export function deriveContractEarnings({ contract }) {
  return {
    cardCount: contract?.cardCount ?? null,
    earningsPerGpuPerHour: contract?.pricePerHourUsd ?? null,
  };
}

// earningsPerMonthProjectedPerGpu / revenuePerMonthProjectedTotal both derive
// from the same rate; "PerGpu" is what individual cards display, "Total"
// (whole-cluster, scaled by cardCount) is what the portfolio bar needs to sum
// meaningfully across clusters of different sizes.
export function computeProfitMetrics({ earningsPerGpuPerHour, cardCount, cost }) {
  const earningsPerMonthProjectedPerGpu =
    earningsPerGpuPerHour != null ? earningsPerGpuPerHour * HOURS_PER_MONTH : null;
  const revenuePerMonthProjectedTotal =
    earningsPerGpuPerHour != null && cardCount
      ? earningsPerGpuPerHour * cardCount * HOURS_PER_MONTH
      : null;

  const costPerGpuPerHour = getCostPerGpuPerHour(cost, cardCount);
  const profitPerGpuPerHour =
    costPerGpuPerHour != null && earningsPerGpuPerHour != null
      ? earningsPerGpuPerHour - costPerGpuPerHour
      : null;
  const marginPercent =
    profitPerGpuPerHour != null && earningsPerGpuPerHour
      ? (profitPerGpuPerHour / earningsPerGpuPerHour) * 100
      : null;
  const profitPerMonthProjected =
    profitPerGpuPerHour != null && cardCount
      ? profitPerGpuPerHour * cardCount * HOURS_PER_MONTH
      : null;

  return {
    earningsPerMonthProjectedPerGpu,
    revenuePerMonthProjectedTotal,
    costPerGpuPerHour,
    profitPerGpuPerHour,
    marginPercent,
    profitPerMonthProjected,
  };
}

// Fleet-wide rollup for the portfolio totals bar. USD only (TAO isn't
// meaningful to sum across mixed subnet/contract clusters). MRR (revenue) is
// summed across every cluster with a known rate, regardless of whether cost
// is tracked — profit obviously can't be computed without cost, but revenue
// can, and gating it behind cost-tracking would understate MRR for any
// cluster that just hasn't had cost configured yet. The margin % denominator
// is a separate, narrower revenue sum restricted to cost-tracked clusters
// only, so that percentage stays internally consistent with the profit
// figures it's dividing.
//
// Forecast clusters always get their own subtotals (so the Forecast segment
// card always has numbers), but only fold into the Total figures when
// `includeForecast` is set — they're hypothetical, not live, so Total
// defaults to excluding them.
export function computePortfolioTotals(clustersWithData, { includeForecast = false } = {}) {
  let totalClusters = 0;
  let subnetCount = 0;
  let contractCount = 0;
  let forecastCount = 0;
  let clustersWithCost = 0;
  let clustersWithRevenue = 0;
  let totalProfitPerMonth = 0;
  let subnetProfitPerMonth = 0;
  let contractProfitPerMonth = 0;
  let forecastProfitPerMonth = 0;
  let totalRevenuePerMonth = 0;
  let subnetRevenuePerMonth = 0;
  let contractRevenuePerMonth = 0;
  let forecastRevenuePerMonth = 0;
  let revenueForMarginDenominator = 0;
  let subnetRevenueForMargin = 0;
  let contractRevenueForMargin = 0;
  let forecastRevenueForMargin = 0;

  for (const { cluster, earnings, nodes } of clustersWithData) {
    totalClusters += 1;
    const mode = cluster.hostingMode;
    if (mode === 'subnet') subnetCount += 1;
    else if (mode === 'contract') contractCount += 1;
    else forecastCount += 1;

    const { cardCount, earningsPerGpuPerHour } = mode === 'subnet'
      ? deriveSubnetEarnings({ earnings, nodes })
      : deriveContractEarnings({ contract: cluster.contract });

    const { profitPerMonthProjected, revenuePerMonthProjectedTotal } = computeProfitMetrics({
      earningsPerGpuPerHour,
      cardCount,
      cost: cluster.cost,
    });

    const countsTowardTotal = mode !== 'forecast' || includeForecast;

    if (revenuePerMonthProjectedTotal != null) {
      clustersWithRevenue += 1;
      if (countsTowardTotal) totalRevenuePerMonth += revenuePerMonthProjectedTotal;
      if (mode === 'subnet') subnetRevenuePerMonth += revenuePerMonthProjectedTotal;
      else if (mode === 'contract') contractRevenuePerMonth += revenuePerMonthProjectedTotal;
      else forecastRevenuePerMonth += revenuePerMonthProjectedTotal;
    }

    if (!cluster.cost || profitPerMonthProjected == null) continue;

    clustersWithCost += 1;
    if (countsTowardTotal) {
      totalProfitPerMonth += profitPerMonthProjected;
      revenueForMarginDenominator += revenuePerMonthProjectedTotal;
    }
    if (mode === 'subnet') {
      subnetProfitPerMonth += profitPerMonthProjected;
      subnetRevenueForMargin += revenuePerMonthProjectedTotal;
    } else if (mode === 'contract') {
      contractProfitPerMonth += profitPerMonthProjected;
      contractRevenueForMargin += revenuePerMonthProjectedTotal;
    } else {
      forecastProfitPerMonth += profitPerMonthProjected;
      forecastRevenueForMargin += revenuePerMonthProjectedTotal;
    }
  }

  const hasCostData = clustersWithCost > 0;
  const hasRevenueData = clustersWithRevenue > 0;

  return {
    totalClusters,
    subnetCount,
    contractCount,
    forecastCount,
    clustersWithCost,
    clustersWithRevenue,
    totalProfitPerMonth: hasCostData ? totalProfitPerMonth : null,
    subnetProfitPerMonth: hasCostData ? subnetProfitPerMonth : null,
    contractProfitPerMonth: hasCostData ? contractProfitPerMonth : null,
    forecastProfitPerMonth: hasCostData ? forecastProfitPerMonth : null,
    totalRevenuePerMonth: hasRevenueData ? totalRevenuePerMonth : null,
    subnetRevenuePerMonth: hasRevenueData ? subnetRevenuePerMonth : null,
    contractRevenuePerMonth: hasRevenueData ? contractRevenuePerMonth : null,
    forecastRevenuePerMonth: hasRevenueData ? forecastRevenuePerMonth : null,
    totalMarginPercent:
      hasCostData && revenueForMarginDenominator
        ? (totalProfitPerMonth / revenueForMarginDenominator) * 100
        : null,
    subnetMarginPercent:
      hasCostData && subnetRevenueForMargin
        ? (subnetProfitPerMonth / subnetRevenueForMargin) * 100
        : null,
    contractMarginPercent:
      hasCostData && contractRevenueForMargin
        ? (contractProfitPerMonth / contractRevenueForMargin) * 100
        : null,
    forecastMarginPercent:
      hasCostData && forecastRevenueForMargin
        ? (forecastProfitPerMonth / forecastRevenueForMargin) * 100
        : null,
  };
}
