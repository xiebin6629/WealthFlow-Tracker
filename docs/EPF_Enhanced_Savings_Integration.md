Requirement: EPF Enhanced Savings (1.3M RIA Rule) Integration
1. 背景 (Context)
根据马来西亚公积金局（EPF）最新的 RIA (Retirement Income Adequacy) 框架，会员在 55 岁之前若存款超过特定门槛（2028 年起定为 RM 1.3M），可随时提领超出部分。此功能旨在优化 WealthFlow-Tracker 的退休演变逻辑，将 EPF 的溢出部分识别为“准流动资产”，从而更精准地预测早期退休（FIRE）的可能性。

2. 功能目标 (Objectives)
解锁流动性： 在模拟 40 岁至 55 岁（过桥期）的现金流时，自动计入 EPF 超过 1.3M 的部分。

策略优化： 提供从低收益安全资产（如 ASM/MMF）搬迁至 EPF 的“搬家”建议。

精准预警： 计算达到 1.3M 门槛的“最后追赶期限”。

3. 详细需求 (Functional Requirements)
3.1 全局配置更新 (System Settings)
RIA 门槛设置： 在 Settings 页面增加 EPF_WITHDRAWAL_THRESHOLD 字段（默认：1,300,000）。

年度限额： 增加 EPF_SELF_CONTRIBUTION_LIMIT 字段（默认：100,000）。

策略开关： 增加 enableEnhancedSavingsStrategy 布尔开关。

3.2 资产模型扩展 (Asset Model)
属性增加： 在 Asset 架构中增加 isEpfBridgeSource: boolean 字段。

逻辑： 用户可标记哪些资产（如 ASNB、Cash）用于在最后阶段填补 EPF 缺口。

3.3 推演引擎升级 (Projection Engine)
过桥基金计算 (Bridge Fund Calculation)：

公式：Available_Bridge_Funds = Liquid_Assets + Max(0, EPF_Balance - 1.3M)。

自动化搬家逻辑 (Auto-Transfer Logic)：

当开启 enableEnhancedSavingsStrategy 时：

检测退休目标年（如 40 岁）的预计 EPF 余额。

若低于 1.3M，向前回溯计算需要多少年（每年 RM 100k）的连续缴存。

在推演至该年份时，自动从标记为 isEpfBridgeSource 的资产中扣除金额转入 EPF。

3.4 UI/UX 组件更新
EPF 进度可视化：

在推演图表中，为 EPF 增加一条 1.3M 的水平参考线（Target Line）。

状态标签：

当 EPF 突破 1.3M 时，在资产看板显示“已激活无限提领（Liquidity Unlocked）”标识。

4. 技术实现逻辑 (Algorithm Snippet)
4.1 核心过桥逻辑 (TypeScript)
/**
 * 计算当前年份的真实可用流动性
 */
export const calculateTrueLiquidity = (
  liquidAssets: number, 
  epfBalance: number, 
  config: FIREConfig
) => {
  const threshold = config.epfThreshold || 1300000;
  const accessibleEpf = epfBalance > threshold ? epfBalance - threshold : 0;
  
  return {
    totalLiquid: liquidAssets + accessibleEpf,
    isEpfUnlocked: epfBalance > threshold
  };
};

4.2 搬家倒计时逻辑
/**
 * 计算必须开始自愿缴存的最后年龄
 */
export const getLatestTopUpStartAge = (
  targetAge: number,
  projectedEpfAtTarget: number,
  threshold: number = 1300000
) => {
  const gap = threshold - projectedEpfAtTarget;
  if (gap <= 0) return null; // 自动达标
  
  const yearsNeeded = Math.ceil(gap / 100000);
  return targetAge - yearsNeeded;
};

5. 验收标准 (Acceptance Criteria)
正确性： 在推演图表中，当 EPF 超过 1.3M 后，用户的 Safe Withdrawal Amount 应显著增加。

安全性： 系统不应自动动用被标记为非过桥来源的资产（如 VOO）。

合规性： 模拟器需严格遵守每年 RM 100,000 的自愿缴存上限。