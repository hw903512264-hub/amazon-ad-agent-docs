/**
 * Amazon Ad Analyzer Service
 * Analyzes search term reports and generates optimization suggestions
 */

// Configuration parameters (matching the original tool)
const CONFIG = {
  TARGET_ACOS_INDEX: 1.0,
  EXACT_NEGATIVE_LV: 1.0,
  PHRASE_NEGATIVE_LV: 5.0,
  RELIABILITY: 1.0,
  INCREASE_BID_LV: 0.7,
  DECREASE_BID_LV: 1.4,
};

export interface SearchTermData {
  searchTerm: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  acos: number;
  ctr: number;
  cvr: number;
  cpc: number;
  campaign?: string;
  adGroup?: string;
  matchType?: string;
}

export interface AnalysisResult {
  searchTerm: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  acos: number;
  ctr: number;
  cvr: number;
  cpc: number;
  suggestion: 'Increase_Bid' | 'Decrease_Bid' | 'Exact_Negative' | 'Phrase_Negative' | 'Reasonable' | 'Pending';
  suggestedAction: string;
  confidence: number;
  estimatedAcos?: number;
  campaign?: string;
  adGroup?: string;
}

export interface AnalysisSummary {
  totalKeywords: number;
  increaseBidCount: number;
  decreaseBidCount: number;
  negativeCount: number;
  reasonableCount: number;
  pendingCount: number;
  overallAcos: number;
  overallConversionRate: number;
  averageCpc: number;
  averageOrderValue: number;
  totalSpend: number;
  totalSales: number;
  totalOrders: number;
  results: AnalysisResult[];
}

/**
 * Parse Excel data from uploaded file
 */
export function parseExcelData(rows: Record<string, unknown>[]): SearchTermData[] {
  const data: SearchTermData[] = [];
  
  for (const row of rows) {
    // Try to map common column names (Chinese and English)
    const searchTerm = String(row['搜索词'] || row['Search Term'] || row['客户搜索词'] || row['Customer Search Term'] || '');
    if (!searchTerm) continue;
    
    const impressions = parseNumber(row['展示量'] || row['Impressions'] || row['展示次数'] || 0);
    const clicks = parseNumber(row['点击量'] || row['Clicks'] || row['点击次数'] || 0);
    const spend = parseNumber(row['花费'] || row['Spend'] || row['支出'] || row['Cost'] || 0);
    const sales = parseNumber(row['销售额'] || row['Sales'] || row['7天总销售额'] || row['7 Day Total Sales'] || 0);
    const orders = parseNumber(row['订单'] || row['Orders'] || row['7天总订单数'] || row['7 Day Total Orders (#)'] || 0);
    
    // Calculate metrics
    const acos = sales > 0 ? (spend / sales) * 100 : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cvr = clicks > 0 ? (orders / clicks) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    
    data.push({
      searchTerm,
      impressions,
      clicks,
      spend,
      sales,
      orders,
      acos,
      ctr,
      cvr,
      cpc,
      campaign: String(row['广告活动名称'] || row['Campaign Name'] || ''),
      adGroup: String(row['广告组名称'] || row['Ad Group Name'] || ''),
      matchType: String(row['匹配类型'] || row['Match Type'] || ''),
    });
  }
  
  return data;
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$¥,，%]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Analyze search term data and generate optimization suggestions
 */
export function analyzeSearchTerms(data: SearchTermData[]): AnalysisSummary {
  // Calculate overall metrics
  const totalSpend = data.reduce((sum, d) => sum + d.spend, 0);
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
  
  const overallAcos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
  const overallConversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
  const averageCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  // Target ACOS based on configuration
  const targetAcos = overallAcos * CONFIG.TARGET_ACOS_INDEX;
  
  // Calculate thresholds
  const exactNegativeClickThreshold = Math.ceil((1 / overallConversionRate * 100) * CONFIG.EXACT_NEGATIVE_LV);
  const phraseNegativeClickThreshold = Math.ceil((1 / overallConversionRate * 100) * CONFIG.PHRASE_NEGATIVE_LV);
  
  // Analyze each search term
  const results: AnalysisResult[] = [];
  let increaseBidCount = 0;
  let decreaseBidCount = 0;
  let negativeCount = 0;
  let reasonableCount = 0;
  let pendingCount = 0;
  
  for (const term of data) {
    let suggestion: AnalysisResult['suggestion'] = 'Pending';
    let suggestedAction = '数据不足，需人工判断相关性';
    let confidence = 0.3;
    let estimatedAcos: number | undefined;
    
    // Calculate estimated ACOS if no orders
    if (term.orders === 0 && term.clicks > 0) {
      // Estimate based on overall conversion rate
      const estimatedOrders = term.clicks * (overallConversionRate / 100);
      const estimatedSales = estimatedOrders * averageOrderValue;
      estimatedAcos = estimatedSales > 0 ? (term.spend / estimatedSales) * 100 : Infinity;
    } else {
      estimatedAcos = term.acos;
    }
    
    // Apply rules
    if (term.orders > 0) {
      // Has conversions - evaluate ACOS
      if (term.acos < targetAcos * CONFIG.INCREASE_BID_LV) {
        suggestion = 'Increase_Bid';
        suggestedAction = `ACOS ${term.acos.toFixed(2)}% 低于目标，建议提高竞价获取更多流量`;
        confidence = Math.min(0.9, 0.5 + term.orders * 0.1);
        increaseBidCount++;
      } else if (term.acos > targetAcos * CONFIG.DECREASE_BID_LV) {
        suggestion = 'Decrease_Bid';
        suggestedAction = `ACOS ${term.acos.toFixed(2)}% 高于目标，建议降低竞价优化利润`;
        confidence = Math.min(0.9, 0.5 + term.orders * 0.1);
        decreaseBidCount++;
      } else {
        suggestion = 'Reasonable';
        suggestedAction = `ACOS ${term.acos.toFixed(2)}% 在合理范围内，建议保持现状`;
        confidence = Math.min(0.85, 0.4 + term.orders * 0.1);
        reasonableCount++;
      }
    } else if (term.clicks >= phraseNegativeClickThreshold) {
      // High clicks, no conversions - phrase negative
      suggestion = 'Phrase_Negative';
      suggestedAction = `${term.clicks}次点击0转化，建议短语否定`;
      confidence = 0.8;
      negativeCount++;
    } else if (term.clicks >= exactNegativeClickThreshold) {
      // Medium clicks, no conversions - exact negative
      suggestion = 'Exact_Negative';
      suggestedAction = `${term.clicks}次点击0转化，建议精准否定`;
      confidence = 0.7;
      negativeCount++;
    } else if (term.clicks > 0) {
      // Low clicks, evaluate estimated ACOS
      if (estimatedAcos !== undefined && estimatedAcos < targetAcos * CONFIG.INCREASE_BID_LV) {
        suggestion = 'Increase_Bid';
        suggestedAction = `预估ACOS ${estimatedAcos.toFixed(2)}% 较低，建议提高竞价`;
        confidence = 0.5;
        increaseBidCount++;
      } else if (estimatedAcos !== undefined && estimatedAcos > targetAcos * CONFIG.DECREASE_BID_LV) {
        suggestion = 'Decrease_Bid';
        suggestedAction = `预估ACOS ${estimatedAcos.toFixed(2)}% 较高，建议降低竞价`;
        confidence = 0.5;
        decreaseBidCount++;
      } else {
        pendingCount++;
      }
    } else {
      pendingCount++;
    }
    
    results.push({
      searchTerm: term.searchTerm,
      impressions: term.impressions,
      clicks: term.clicks,
      spend: term.spend,
      sales: term.sales,
      orders: term.orders,
      acos: term.acos,
      ctr: term.ctr,
      cvr: term.cvr,
      cpc: term.cpc,
      suggestion,
      suggestedAction,
      confidence,
      estimatedAcos,
      campaign: term.campaign,
      adGroup: term.adGroup,
    });
  }
  
  return {
    totalKeywords: data.length,
    increaseBidCount,
    decreaseBidCount,
    negativeCount,
    reasonableCount,
    pendingCount,
    overallAcos,
    overallConversionRate,
    averageCpc,
    averageOrderValue,
    totalSpend,
    totalSales,
    totalOrders,
    results,
  };
}
