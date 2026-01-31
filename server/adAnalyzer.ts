/**
 * Amazon Ad Analyzer Service
 * Analyzes search term reports and generates optimization suggestions
 * Based on 搜索词报告优化工具V1.10.2 logic
 */

// Configuration parameters (matching the original tool V1.10.2)
export const CONFIG = {
  // 目标ACOS指数 (0.2~2.0) - 目标ACOS = 整体ACOS / targetAcosIndex
  TARGET_ACOS_INDEX: 1.0,
  // 精准否定级别 (0.5~5.0) - 精准否定所需0单点击量
  EXACT_NEGATIVE_LV: 1.0,
  // 短语否定级别 (5.0~50.0) - 短语否定所需0单点击量
  PHRASE_NEGATIVE_LV: 5.0,
  // 可靠性级别 (0.5~10.0) - 提供建议所需最少点击量
  RELIABILITY: 1.0,
  // 提高竞价级别 (0.3~1.0) - 低于此值*目标ACOS建议提高竞价
  INCREASE_BID_LV: 0.7,
  // 降低竞价级别 (1.2~2.0) - 高于此值*目标ACOS建议降低竞价
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

export interface FeatureWord {
  word: string;
  clicks: number;
  orders: number;
  spend: number;
  sales: number;
  conversionRate: number;
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
  problemKeyword?: string;
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
    
    const impressions = parseNumber(row['展示量'] || row['Impressions'] || row['展示次数'] || row['展现量'] || 0);
    const clicks = parseNumber(row['点击量'] || row['Clicks'] || row['点击次数'] || 0);
    const spend = parseNumber(row['花费'] || row['Spend'] || row['支出'] || row['Cost'] || 0);
    const sales = parseNumber(row['销售额'] || row['Sales'] || row['7天总销售额'] || row['7天总销售额(￥)'] || row['7 Day Total Sales'] || 0);
    const orders = parseNumber(row['订单'] || row['Orders'] || row['7天总订单数'] || row['7天总订单数(#)'] || row['7 Day Total Orders (#)'] || row['7 Day Total Orders'] || 0);
    
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
 * Split search term into feature words (特征词拆分)
 * Based on 特征词分析工具V1.12.2 logic
 */
export function splitToFeatureWords(searchTerm: string): string[] {
  // Split by spaces, hyphens, and special characters
  const words = searchTerm
    .toLowerCase()
    .split(/[\s\-_,./\\]+/)
    .filter(word => word.length > 0 && word.length <= 50);
  
  // Remove common stop words
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'for', 'of', 'to', 'in', 'on', 'with', 'by']);
  return words.filter(word => !stopWords.has(word));
}

/**
 * Build feature word statistics from all search terms
 */
export function buildFeatureWordStats(data: SearchTermData[]): Map<string, FeatureWord> {
  const featureStats = new Map<string, FeatureWord>();
  
  for (const term of data) {
    const words = splitToFeatureWords(term.searchTerm);
    
    for (const word of words) {
      const existing = featureStats.get(word);
      if (existing) {
        existing.clicks += term.clicks;
        existing.orders += term.orders;
        existing.spend += term.spend;
        existing.sales += term.sales;
      } else {
        featureStats.set(word, {
          word,
          clicks: term.clicks,
          orders: term.orders,
          spend: term.spend,
          sales: term.sales,
          conversionRate: 0,
        });
      }
    }
  }
  
  // Calculate conversion rate for each feature word
  featureStats.forEach((stats) => {
    stats.conversionRate = stats.clicks > 0 ? (stats.orders / stats.clicks) * 100 : 0;
  });
  
  return featureStats;
}

/**
 * Get the minimum conversion rate among feature words of a search term
 * This is the core logic from V1.10.2
 */
function getMinFeatureWordConversionRate(
  searchTerm: string,
  featureStats: Map<string, FeatureWord>
): { minCvr: number; hasZeroCvr: boolean; zeroCvrWord: string | null; minClicksWord: string | null; minClicks: number } {
  const words = splitToFeatureWords(searchTerm);
  
  let minCvr = Infinity;
  let hasZeroCvr = false;
  let zeroCvrWord: string | null = null;
  let minClicksWord: string | null = null;
  let minClicks = Infinity;
  
  for (const word of words) {
    const stats = featureStats.get(word);
    if (stats) {
      // Track minimum clicks feature word
      if (stats.clicks < minClicks) {
        minClicks = stats.clicks;
        minClicksWord = word;
      }
      
      // Check for zero conversion rate
      if (stats.clicks > 0 && stats.orders === 0) {
        hasZeroCvr = true;
        if (!zeroCvrWord || stats.clicks > (featureStats.get(zeroCvrWord)?.clicks || 0)) {
          zeroCvrWord = word;
        }
      }
      
      // Track minimum conversion rate (only for words with conversions)
      if (stats.conversionRate > 0 && stats.conversionRate < minCvr) {
        minCvr = stats.conversionRate;
      }
    }
  }
  
  return { minCvr, hasZeroCvr, zeroCvrWord, minClicksWord, minClicks };
}

/**
 * Analyze search term data and generate optimization suggestions
 * Based on 搜索词报告优化工具V1.10.2 logic
 */
export function analyzeSearchTerms(data: SearchTermData[], config: typeof CONFIG = CONFIG): AnalysisSummary {
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
  // Formula: MAX(20%, overallAcos / targetAcosIndex)
  const targetAcos = Math.max(20, overallAcos / config.TARGET_ACOS_INDEX);
  
  // Calculate thresholds based on V1.10.2 formulas
  // exactNegativeClickThreshold = MAX(5, ROUNDUP(exactNegativeLv / totalConversionRate, 0))
  const exactNegativeClickThreshold = Math.max(5, Math.ceil(config.EXACT_NEGATIVE_LV / (overallConversionRate / 100)));
  // phraseNegativeClickThreshold = MAX(50, ROUNDUP(phraseNegativeLv / totalConversionRate, 0))
  const phraseNegativeClickThreshold = Math.max(50, Math.ceil(config.PHRASE_NEGATIVE_LV / (overallConversionRate / 100)));
  // reliabilityClickThreshold = MAX(5, reliability / totalConversionRate)
  const reliabilityClickThreshold = Math.max(5, config.RELIABILITY / (overallConversionRate / 100));
  
  // Build feature word statistics
  const featureStats = buildFeatureWordStats(data);
  
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
    let problemKeyword: string | undefined;
    
    // Get feature word analysis
    const { minCvr, hasZeroCvr, zeroCvrWord, minClicksWord, minClicks } = 
      getMinFeatureWordConversionRate(term.searchTerm, featureStats);
    
    // Priority 1: Check for negative suggestions (否定优先级高于可信度判断)
    if (hasZeroCvr && zeroCvrWord) {
      const zeroCvrStats = featureStats.get(zeroCvrWord);
      if (zeroCvrStats) {
        if (zeroCvrStats.clicks >= phraseNegativeClickThreshold) {
          // Phrase negative
          suggestion = 'Phrase_Negative';
          suggestedAction = `特征词"${zeroCvrWord}"有${zeroCvrStats.clicks}次点击但0转化，建议短语否定`;
          confidence = 0.8;
          problemKeyword = zeroCvrWord;
          negativeCount++;
        } else if (zeroCvrStats.clicks >= exactNegativeClickThreshold) {
          // Exact negative
          suggestion = 'Exact_Negative';
          suggestedAction = `特征词"${zeroCvrWord}"有${zeroCvrStats.clicks}次点击但0转化，建议精准否定`;
          confidence = 0.7;
          problemKeyword = zeroCvrWord;
          negativeCount++;
        } else {
          // Not enough clicks for negative, pending
          suggestion = 'Pending';
          suggestedAction = `特征词"${zeroCvrWord}"有${zeroCvrStats.clicks}次点击0转化，点击量不足以建议否定，需人工判断`;
          problemKeyword = zeroCvrWord;
          pendingCount++;
        }
      }
    }
    // Priority 2: Check for bid adjustments (if not negative)
    else if (term.orders > 0) {
      // Has conversions - use actual ACOS
      const currentAcos = term.acos;
      estimatedAcos = currentAcos;
      
      if (currentAcos < targetAcos * config.INCREASE_BID_LV) {
        suggestion = 'Increase_Bid';
        suggestedAction = `ACOS ${currentAcos.toFixed(2)}% 低于目标${(targetAcos * config.INCREASE_BID_LV).toFixed(2)}%，建议提高竞价获取更多流量`;
        confidence = Math.min(0.99, 0.5 + term.orders * 0.05);
        increaseBidCount++;
      } else if (currentAcos > targetAcos * config.DECREASE_BID_LV) {
        suggestion = 'Decrease_Bid';
        suggestedAction = `ACOS ${currentAcos.toFixed(2)}% 高于目标${(targetAcos * config.DECREASE_BID_LV).toFixed(2)}%，建议降低竞价优化利润`;
        confidence = Math.min(0.99, 0.5 + term.orders * 0.05);
        decreaseBidCount++;
      } else {
        suggestion = 'Reasonable';
        suggestedAction = `ACOS ${currentAcos.toFixed(2)}% 在合理范围内(${(targetAcos * config.INCREASE_BID_LV).toFixed(2)}%~${(targetAcos * config.DECREASE_BID_LV).toFixed(2)}%)，建议保持现状`;
        confidence = Math.min(0.85, 0.4 + term.orders * 0.05);
        reasonableCount++;
      }
    }
    // Priority 3: No conversions but has feature word conversion data
    else if (minCvr < Infinity && minCvr > 0 && term.clicks > 0 && term.cpc > 0) {
      // Calculate estimated ACOS based on minimum feature word conversion rate
      // Formula: estimatedAcos = CPC / (minCvr * averageOrderValue)
      const estimatedCvr = minCvr / 100;
      const estimatedOrdersPerClick = estimatedCvr;
      const estimatedSalesPerClick = estimatedOrdersPerClick * averageOrderValue;
      estimatedAcos = estimatedSalesPerClick > 0 ? (term.cpc / estimatedSalesPerClick) * 100 : Infinity;
      
      // Check reliability threshold
      if (minClicks < reliabilityClickThreshold) {
        suggestion = 'Pending';
        suggestedAction = `特征词"${minClicksWord}"点击量${minClicks}不足${reliabilityClickThreshold.toFixed(0)}，需人工判断`;
        problemKeyword = minClicksWord || undefined;
        pendingCount++;
      } else if (estimatedAcos < targetAcos * config.INCREASE_BID_LV) {
        suggestion = 'Increase_Bid';
        suggestedAction = `预估ACOS ${estimatedAcos.toFixed(2)}% 低于目标，建议提高竞价`;
        confidence = 0.6;
        increaseBidCount++;
      } else if (estimatedAcos > targetAcos * config.DECREASE_BID_LV) {
        suggestion = 'Decrease_Bid';
        suggestedAction = `预估ACOS ${estimatedAcos.toFixed(2)}% 高于目标，建议降低竞价`;
        confidence = 0.6;
        decreaseBidCount++;
      } else {
        suggestion = 'Reasonable';
        suggestedAction = `预估ACOS ${estimatedAcos.toFixed(2)}% 在合理范围内，建议保持现状`;
        confidence = 0.5;
        reasonableCount++;
      }
    }
    // Priority 4: Special cases
    else if (term.clicks === 0 || term.spend === 0) {
      // Zero clicks or zero spend
      if (minCvr < Infinity && minCvr > 0) {
        suggestion = 'Pending';
        suggestedAction = '所有特征词有转化但该搜索词无点击/花费，建议基于相似搜索词评估';
        pendingCount++;
      } else {
        suggestion = 'Pending';
        suggestedAction = '无点击或花费数据，需人工判断相关性';
        pendingCount++;
      }
    }
    // Default: Pending
    else {
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
      problemKeyword,
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
