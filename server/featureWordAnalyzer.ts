/**
 * Feature Word Analyzer Service
 * Analyzes search terms by splitting them into feature words and aggregating metrics
 * Based on 特征词分析工具V1.12.2 logic
 */

export interface FeatureWordData {
  word: string;
  count: number;           // Number of search terms containing this word
  totalClicks: number;
  totalOrders: number;
  totalSpend: number;
  totalSales: number;
  totalImpressions: number;
  conversionRate: number;  // orders / clicks * 100
  acos: number;            // spend / sales * 100
  avgCpc: number;          // spend / clicks
}

export interface FeatureWordAnalysisResult {
  totalSearchTerms: number;
  totalFeatureWords: number;
  featureWords: FeatureWordData[];
  analyzedAt: Date;
}

export interface SearchTermInput {
  searchTerm: string;
  impressions?: number;
  clicks?: number;
  spend?: number;
  sales?: number;
  orders?: number;
  reviews?: number;  // For product title analysis
}

/**
 * Split search term into feature words
 * Based on 特征词分析工具V1.12.2 logic
 */
export function splitToFeatureWords(text: string): string[] {
  if (!text) return [];
  
  // Convert to lowercase and split by various delimiters
  const words = text
    .toLowerCase()
    // Split by spaces, hyphens, underscores, commas, periods, slashes
    .split(/[\s\-_,./\\|&+()[\]{}'"!?;:]+/)
    // Filter out empty strings and very short words
    .filter(word => word.length > 1 && word.length <= 50)
    // Remove pure numbers
    .filter(word => !/^\d+$/.test(word));
  
  // Remove common stop words (English)
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'for', 'of', 'to', 'in', 'on', 'with', 'by',
    'at', 'from', 'as', 'is', 'it', 'be', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'am', 'not'
  ]);
  
  return words.filter(word => !stopWords.has(word));
}

/**
 * Analyze search terms and extract feature word statistics
 * This implements the core logic of 特征词分析工具V1.12.2
 */
export function analyzeFeatureWords(searchTerms: SearchTermInput[]): FeatureWordAnalysisResult {
  const featureWordMap = new Map<string, FeatureWordData>();
  
  for (const term of searchTerms) {
    const words = splitToFeatureWords(term.searchTerm);
    
    for (const word of words) {
      const existing = featureWordMap.get(word);
      
      if (existing) {
        existing.count++;
        existing.totalClicks += term.clicks || 0;
        existing.totalOrders += term.orders || 0;
        existing.totalSpend += term.spend || 0;
        existing.totalSales += term.sales || 0;
        existing.totalImpressions += term.impressions || 0;
      } else {
        featureWordMap.set(word, {
          word,
          count: 1,
          totalClicks: term.clicks || 0,
          totalOrders: term.orders || 0,
          totalSpend: term.spend || 0,
          totalSales: term.sales || 0,
          totalImpressions: term.impressions || 0,
          conversionRate: 0,
          acos: 0,
          avgCpc: 0,
        });
      }
    }
  }
  
  // Calculate derived metrics for each feature word
  const featureWords: FeatureWordData[] = [];
  
  featureWordMap.forEach((data) => {
    // Conversion rate = orders / clicks * 100
    data.conversionRate = data.totalClicks > 0 
      ? (data.totalOrders / data.totalClicks) * 100 
      : 0;
    
    // ACOS = spend / sales * 100
    data.acos = data.totalSales > 0 
      ? (data.totalSpend / data.totalSales) * 100 
      : 0;
    
    // Average CPC = spend / clicks
    data.avgCpc = data.totalClicks > 0 
      ? data.totalSpend / data.totalClicks 
      : 0;
    
    featureWords.push(data);
  });
  
  // Sort by total clicks (most clicked first)
  featureWords.sort((a, b) => b.totalClicks - a.totalClicks);
  
  return {
    totalSearchTerms: searchTerms.length,
    totalFeatureWords: featureWords.length,
    featureWords,
    analyzedAt: new Date(),
  };
}

/**
 * Get high-performing feature words for keyword expansion
 * Returns feature words with good conversion rates
 */
export function getHighPerformingFeatureWords(
  analysisResult: FeatureWordAnalysisResult,
  minClicks: number = 10,
  maxAcos: number = 50
): FeatureWordData[] {
  return analysisResult.featureWords
    .filter(fw => 
      fw.totalClicks >= minClicks && 
      fw.totalOrders > 0 && 
      fw.acos > 0 && 
      fw.acos <= maxAcos
    )
    .sort((a, b) => a.acos - b.acos);
}

/**
 * Get feature words that need attention (high clicks, no conversions)
 */
export function getProblemFeatureWords(
  analysisResult: FeatureWordAnalysisResult,
  minClicks: number = 10
): FeatureWordData[] {
  return analysisResult.featureWords
    .filter(fw => 
      fw.totalClicks >= minClicks && 
      fw.totalOrders === 0
    )
    .sort((a, b) => b.totalClicks - a.totalClicks);
}

/**
 * Generate keyword suggestions based on feature word analysis
 * Combines high-performing feature words to create new keyword suggestions
 */
export function generateKeywordSuggestions(
  analysisResult: FeatureWordAnalysisResult,
  topN: number = 20
): Array<{
  keyword: string;
  type: 'high_performer' | 'combination' | 'problem';
  metrics: {
    clicks: number;
    orders: number;
    acos: number;
    conversionRate: number;
  };
  suggestion: string;
}> {
  const suggestions: Array<{
    keyword: string;
    type: 'high_performer' | 'combination' | 'problem';
    metrics: {
      clicks: number;
      orders: number;
      acos: number;
      conversionRate: number;
    };
    suggestion: string;
  }> = [];
  
  // Get high performers
  const highPerformers = getHighPerformingFeatureWords(analysisResult);
  
  for (const fw of highPerformers.slice(0, topN)) {
    suggestions.push({
      keyword: fw.word,
      type: 'high_performer',
      metrics: {
        clicks: fw.totalClicks,
        orders: fw.totalOrders,
        acos: fw.acos,
        conversionRate: fw.conversionRate,
      },
      suggestion: `高转化特征词，ACOS ${fw.acos.toFixed(1)}%，建议作为核心关键词投放`,
    });
  }
  
  // Get problem words
  const problemWords = getProblemFeatureWords(analysisResult);
  
  for (const fw of problemWords.slice(0, 10)) {
    suggestions.push({
      keyword: fw.word,
      type: 'problem',
      metrics: {
        clicks: fw.totalClicks,
        orders: fw.totalOrders,
        acos: 0,
        conversionRate: 0,
      },
      suggestion: `${fw.totalClicks}次点击0转化，建议否定或检查相关性`,
    });
  }
  
  // Generate combinations from top performers
  if (highPerformers.length >= 2) {
    const topWords = highPerformers.slice(0, 5);
    for (let i = 0; i < topWords.length; i++) {
      for (let j = i + 1; j < topWords.length; j++) {
        const combo = `${topWords[i].word} ${topWords[j].word}`;
        const avgAcos = (topWords[i].acos + topWords[j].acos) / 2;
        const totalClicks = topWords[i].totalClicks + topWords[j].totalClicks;
        const totalOrders = topWords[i].totalOrders + topWords[j].totalOrders;
        
        suggestions.push({
          keyword: combo,
          type: 'combination',
          metrics: {
            clicks: totalClicks,
            orders: totalOrders,
            acos: avgAcos,
            conversionRate: totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0,
          },
          suggestion: `高转化特征词组合，预估ACOS ${avgAcos.toFixed(1)}%，建议测试投放`,
        });
      }
    }
  }
  
  return suggestions;
}
