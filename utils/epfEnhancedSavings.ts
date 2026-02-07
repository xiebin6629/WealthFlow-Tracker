/**
 * EPF Enhanced Savings Utilities
 * 
 * 基于马来西亚公积金局（EPF）RIA (Retirement Income Adequacy) 框架。
 * 2028 年起，会员在 55 岁前若 EPF 超过 RM 1.3M，可提领超出部分。
 */

// Default constants based on EPF RIA framework
export const EPF_DEFAULT_THRESHOLD = 1300000;  // RM 1.3M
export const EPF_ANNUAL_CONTRIBUTION_LIMIT = 100000;  // RM 100k per year

/**
 * Result of true liquidity calculation
 */
export interface TrueLiquidityResult {
    totalLiquid: number;      // 真实可用流动性 (流动资产 + 可提领 EPF)
    accessibleEpf: number;    // 可提领的 EPF 金额
    isEpfUnlocked: boolean;   // EPF 是否已解锁 (超过门槛)
}

/**
 * 计算当前年份的真实可用流动性
 * 公式：Available_Bridge_Funds = Liquid_Assets + Max(0, EPF_Balance - Threshold)
 * 
 * @param liquidAssets - 流动资产价值
 * @param epfBalance - EPF 余额
 * @param threshold - EPF 提领门槛 (默认 1,300,000)
 * @returns 真实流动性计算结果
 */
export const calculateTrueLiquidity = (
    liquidAssets: number,
    epfBalance: number,
    threshold: number = EPF_DEFAULT_THRESHOLD
): TrueLiquidityResult => {
    const accessibleEpf = epfBalance > threshold ? epfBalance - threshold : 0;

    return {
        totalLiquid: liquidAssets + accessibleEpf,
        accessibleEpf,
        isEpfUnlocked: epfBalance > threshold
    };
};

/**
 * Result of latest top-up start age calculation
 */
export interface TopUpStartAgeResult {
    startAge: number;       // 必须开始缴存的年龄
    yearsNeeded: number;    // 需要缴存的年数
    totalRequired: number;  // 需要填补的总金额
}

/**
 * 计算必须开始自愿缴存的最后年龄
 * 
 * 例如：目标 40 岁退休，预计届时 EPF 为 1.1M，缺口 200k
 *       需要 2 年 (每年 100k)，所以最迟 38 岁开始
 * 
 * @param targetAge - 目标退休年龄
 * @param projectedEpfAtTarget - 目标年龄时的预计 EPF 余额
 * @param threshold - EPF 提领门槛
 * @param annualLimit - 年度自愿缴存上限
 * @returns 开始年龄计算结果，若已自动达标则返回 null
 */
export const getLatestTopUpStartAge = (
    targetAge: number,
    projectedEpfAtTarget: number,
    threshold: number = EPF_DEFAULT_THRESHOLD,
    annualLimit: number = EPF_ANNUAL_CONTRIBUTION_LIMIT
): TopUpStartAgeResult | null => {
    const gap = threshold - projectedEpfAtTarget;

    // 若预计余额已超过门槛，无需额外缴存
    if (gap <= 0) return null;

    const yearsNeeded = Math.ceil(gap / annualLimit);

    return {
        startAge: targetAge - yearsNeeded,
        yearsNeeded,
        totalRequired: gap
    };
};

/**
 * Bridge asset info for transfer simulation
 */
export interface BridgeAssetInfo {
    id: string;
    name: string;
    value: number;
}

/**
 * Yearly transfer plan item
 */
export interface TransferPlanItem {
    year: number;
    age: number;
    transfers: Array<{
        assetId: string;
        assetName: string;
        amount: number;
    }>;
    totalTransfer: number;
    cumulativeTransfer: number;
}

/**
 * 模拟过桥资金的自动搬家逻辑
 * 
 * 从标记为 isEpfBridgeSource 的资产中，按需扣除金额转入 EPF
 * 
 * @param bridgeAssets - 可用于过桥的资产列表
 * @param gapToFill - 需要填补的缺口
 * @param yearsAvailable - 可用年数
 * @param startAge - 开始转移的年龄
 * @param annualLimit - 年度缴存上限
 * @returns 每年的转移计划
 */
export const simulateBridgeTransfer = (
    bridgeAssets: BridgeAssetInfo[],
    gapToFill: number,
    yearsAvailable: number,
    startAge: number,
    annualLimit: number = EPF_ANNUAL_CONTRIBUTION_LIMIT
): TransferPlanItem[] => {
    // 若无缺口，返回空计划
    if (gapToFill <= 0) return [];

    const plan: TransferPlanItem[] = [];
    let remainingGap = gapToFill;
    let cumulativeTransfer = 0;

    // 按价值排序资产（可选：优先从低收益资产转移）
    const sortedAssets = [...bridgeAssets].sort((a, b) => b.value - a.value);

    // 记录每个资产剩余可用金额
    const assetBalances = new Map(sortedAssets.map(a => [a.id, a.value]));

    const currentYear = new Date().getFullYear();

    for (let i = 0; i < yearsAvailable && remainingGap > 0; i++) {
        const yearlyTransferLimit = Math.min(annualLimit, remainingGap);
        let yearlyTotal = 0;
        const transfers: TransferPlanItem['transfers'] = [];

        // 从可用资产中扣除
        for (const asset of sortedAssets) {
            if (yearlyTotal >= yearlyTransferLimit) break;

            const available = assetBalances.get(asset.id) || 0;
            if (available <= 0) continue;

            const toTransfer = Math.min(available, yearlyTransferLimit - yearlyTotal);
            assetBalances.set(asset.id, available - toTransfer);

            if (toTransfer > 0) {
                transfers.push({
                    assetId: asset.id,
                    assetName: asset.name,
                    amount: toTransfer
                });
                yearlyTotal += toTransfer;
            }
        }

        if (yearlyTotal > 0) {
            cumulativeTransfer += yearlyTotal;
            remainingGap -= yearlyTotal;

            plan.push({
                year: currentYear + i,
                age: startAge + i,
                transfers,
                totalTransfer: yearlyTotal,
                cumulativeTransfer
            });
        }
    }

    return plan;
};
