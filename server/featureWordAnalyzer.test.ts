import { describe, it, expect } from 'vitest';
import { 
  splitToFeatureWords, 
  analyzeFeatureWords, 
  getHighPerformingFeatureWords,
  getProblemFeatureWords,
  generateKeywordSuggestions,
  SearchTermInput
} from './featureWordAnalyzer';

describe('splitToFeatureWords', () => {
  it('should split search term into individual words', () => {
    const result = splitToFeatureWords('magnesium gummies for adults');
    expect(result).toContain('magnesium');
    expect(result).toContain('gummies');
    expect(result).toContain('adults');
  });

  it('should filter out stop words', () => {
    const result = splitToFeatureWords('magnesium for the adults');
    expect(result).toContain('magnesium');
    expect(result).toContain('adults');
    expect(result).not.toContain('for');
    expect(result).not.toContain('the');
  });

  it('should handle hyphenated words', () => {
    const result = splitToFeatureWords('sugar-free vitamin-c');
    expect(result).toContain('sugar');
    expect(result).toContain('free');
    expect(result).toContain('vitamin');
  });

  it('should filter out pure numbers', () => {
    const result = splitToFeatureWords('vitamin d3 5000 iu');
    expect(result).toContain('vitamin');
    expect(result).toContain('d3');
    expect(result).toContain('iu');
    expect(result).not.toContain('5000');
  });

  it('should handle empty input', () => {
    expect(splitToFeatureWords('')).toEqual([]);
    expect(splitToFeatureWords(null as unknown as string)).toEqual([]);
  });
});

describe('analyzeFeatureWords', () => {
  const sampleSearchTerms: SearchTermInput[] = [
    { searchTerm: 'magnesium gummies', clicks: 100, orders: 10, spend: 50, sales: 200, impressions: 1000 },
    { searchTerm: 'magnesium supplement', clicks: 80, orders: 5, spend: 40, sales: 100, impressions: 800 },
    { searchTerm: 'gummies for adults', clicks: 60, orders: 3, spend: 30, sales: 60, impressions: 600 },
    { searchTerm: 'vitamin gummies', clicks: 40, orders: 0, spend: 20, sales: 0, impressions: 400 },
  ];

  it('should count feature word occurrences correctly', () => {
    const result = analyzeFeatureWords(sampleSearchTerms);
    
    // 'magnesium' appears in 2 search terms
    const magnesium = result.featureWords.find(fw => fw.word === 'magnesium');
    expect(magnesium?.count).toBe(2);
    
    // 'gummies' appears in 3 search terms
    const gummies = result.featureWords.find(fw => fw.word === 'gummies');
    expect(gummies?.count).toBe(3);
  });

  it('should aggregate metrics correctly', () => {
    const result = analyzeFeatureWords(sampleSearchTerms);
    
    // 'magnesium' total clicks = 100 + 80 = 180
    const magnesium = result.featureWords.find(fw => fw.word === 'magnesium');
    expect(magnesium?.totalClicks).toBe(180);
    expect(magnesium?.totalOrders).toBe(15);
    expect(magnesium?.totalSpend).toBe(90);
    expect(magnesium?.totalSales).toBe(300);
  });

  it('should calculate conversion rate correctly', () => {
    const result = analyzeFeatureWords(sampleSearchTerms);
    
    const magnesium = result.featureWords.find(fw => fw.word === 'magnesium');
    // Conversion rate = 15 / 180 * 100 = 8.33%
    expect(magnesium?.conversionRate).toBeCloseTo(8.33, 1);
  });

  it('should calculate ACOS correctly', () => {
    const result = analyzeFeatureWords(sampleSearchTerms);
    
    const magnesium = result.featureWords.find(fw => fw.word === 'magnesium');
    // ACOS = 90 / 300 * 100 = 30%
    expect(magnesium?.acos).toBeCloseTo(30, 1);
  });

  it('should return total counts', () => {
    const result = analyzeFeatureWords(sampleSearchTerms);
    
    expect(result.totalSearchTerms).toBe(4);
    expect(result.totalFeatureWords).toBeGreaterThan(0);
  });
});

describe('getHighPerformingFeatureWords', () => {
  it('should filter by minimum clicks and max ACOS', () => {
    const searchTerms: SearchTermInput[] = [
      { searchTerm: 'good keyword', clicks: 100, orders: 20, spend: 50, sales: 200, impressions: 1000 },
      { searchTerm: 'bad keyword', clicks: 100, orders: 1, spend: 100, sales: 50, impressions: 1000 },
      { searchTerm: 'low clicks', clicks: 5, orders: 2, spend: 2, sales: 20, impressions: 50 },
    ];
    
    const analysis = analyzeFeatureWords(searchTerms);
    const highPerformers = getHighPerformingFeatureWords(analysis, 10, 50);
    
    // 'good' should be included (ACOS = 25%)
    const good = highPerformers.find(fw => fw.word === 'good');
    expect(good).toBeDefined();
    
    // 'bad' should be excluded (ACOS = 200%)
    const bad = highPerformers.find(fw => fw.word === 'bad');
    expect(bad).toBeUndefined();
    
    // 'low' should be excluded (clicks < 10)
    const low = highPerformers.find(fw => fw.word === 'low');
    expect(low).toBeUndefined();
  });
});

describe('getProblemFeatureWords', () => {
  it('should find words with high clicks but no conversions', () => {
    const searchTerms: SearchTermInput[] = [
      { searchTerm: 'converting keyword', clicks: 100, orders: 10, spend: 50, sales: 200, impressions: 1000 },
      { searchTerm: 'problem keyword', clicks: 50, orders: 0, spend: 25, sales: 0, impressions: 500 },
    ];
    
    const analysis = analyzeFeatureWords(searchTerms);
    const problemWords = getProblemFeatureWords(analysis, 10);
    
    // 'problem' should be included (0 orders, 50 clicks)
    const problem = problemWords.find(fw => fw.word === 'problem');
    expect(problem).toBeDefined();
    
    // 'converting' should be excluded (has orders)
    const converting = problemWords.find(fw => fw.word === 'converting');
    expect(converting).toBeUndefined();
  });
});

describe('generateKeywordSuggestions', () => {
  it('should generate suggestions from analysis', () => {
    const searchTerms: SearchTermInput[] = [
      { searchTerm: 'magnesium gummies', clicks: 100, orders: 10, spend: 25, sales: 200, impressions: 1000 },
      { searchTerm: 'magnesium supplement', clicks: 80, orders: 8, spend: 20, sales: 160, impressions: 800 },
      { searchTerm: 'problem keyword', clicks: 50, orders: 0, spend: 25, sales: 0, impressions: 500 },
    ];
    
    const analysis = analyzeFeatureWords(searchTerms);
    const suggestions = generateKeywordSuggestions(analysis);
    
    expect(suggestions.length).toBeGreaterThan(0);
    
    // Should have high performer suggestions
    const highPerformers = suggestions.filter(s => s.type === 'high_performer');
    expect(highPerformers.length).toBeGreaterThan(0);
    
    // Should have problem suggestions
    const problems = suggestions.filter(s => s.type === 'problem');
    expect(problems.length).toBeGreaterThan(0);
  });

  it('should generate combination suggestions', () => {
    const searchTerms: SearchTermInput[] = [
      { searchTerm: 'magnesium gummies', clicks: 100, orders: 10, spend: 25, sales: 200, impressions: 1000 },
      { searchTerm: 'vitamin supplement', clicks: 80, orders: 8, spend: 20, sales: 160, impressions: 800 },
    ];
    
    const analysis = analyzeFeatureWords(searchTerms);
    const suggestions = generateKeywordSuggestions(analysis);
    
    // Should have combination suggestions
    const combinations = suggestions.filter(s => s.type === 'combination');
    expect(combinations.length).toBeGreaterThan(0);
  });
});
