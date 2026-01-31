import { describe, expect, it } from "vitest";
import { analyzeSearchTerms, parseExcelData } from "./adAnalyzer";

describe("adAnalyzer", () => {
  describe("parseExcelData", () => {
    it("parses Chinese column names correctly", () => {
      const rows = [
        {
          "搜索词": "test keyword",
          "展示量": 1000,
          "点击量": 50,
          "花费": 25.5,
          "销售额": 100,
          "订单": 2,
        },
      ];

      const result = parseExcelData(rows);

      expect(result).toHaveLength(1);
      expect(result[0].searchTerm).toBe("test keyword");
      expect(result[0].impressions).toBe(1000);
      expect(result[0].clicks).toBe(50);
      expect(result[0].spend).toBe(25.5);
      expect(result[0].sales).toBe(100);
      expect(result[0].orders).toBe(2);
    });

    it("parses English column names correctly", () => {
      const rows = [
        {
          "Search Term": "test keyword",
          "Impressions": 500,
          "Clicks": 25,
          "Spend": 12.5,
          "Sales": 50,
          "Orders": 1,
        },
      ];

      const result = parseExcelData(rows);

      expect(result).toHaveLength(1);
      expect(result[0].searchTerm).toBe("test keyword");
      expect(result[0].impressions).toBe(500);
    });

    it("handles string numbers with currency symbols", () => {
      const rows = [
        {
          "搜索词": "test",
          "展示量": "1,000",
          "点击量": "50",
          "花费": "$25.50",
          "销售额": "¥100.00",
          "订单": "2",
        },
      ];

      const result = parseExcelData(rows);

      expect(result[0].impressions).toBe(1000);
      expect(result[0].spend).toBe(25.5);
      expect(result[0].sales).toBe(100);
    });

    it("filters out rows without search terms", () => {
      const rows = [
        { "搜索词": "valid", "展示量": 100 },
        { "展示量": 200 }, // No search term
        { "搜索词": "", "展示量": 300 }, // Empty search term
      ];

      const result = parseExcelData(rows);

      expect(result).toHaveLength(1);
      expect(result[0].searchTerm).toBe("valid");
    });
  });

  describe("analyzeSearchTerms", () => {
    it("calculates overall metrics correctly", () => {
      const data = [
        { searchTerm: "kw1", impressions: 1000, clicks: 50, spend: 25, sales: 100, orders: 2, acos: 25, ctr: 5, cvr: 4, cpc: 0.5 },
        { searchTerm: "kw2", impressions: 2000, clicks: 100, spend: 50, sales: 200, orders: 4, acos: 25, ctr: 5, cvr: 4, cpc: 0.5 },
      ];

      const result = analyzeSearchTerms(data);

      expect(result.totalKeywords).toBe(2);
      expect(result.totalSpend).toBe(75);
      expect(result.totalSales).toBe(300);
      expect(result.totalOrders).toBe(6);
      expect(result.overallAcos).toBe(25); // 75/300 * 100
    });

    it("identifies keywords to increase bid when ACOS is below threshold", () => {
      // With two keywords:
      // - Overall spend: 5 + 100 = 105
      // - Overall sales: 100 + 100 = 200
      // - Overall ACOS: 105/200 * 100 = 52.5%
      // - Target ACOS: 52.5% * 1.0 = 52.5%
      // - Increase threshold: 52.5% * 0.7 = 36.75%
      // - "good kw" has ACOS 5%, which is < 36.75%, so should increase bid
      const data = [
        { searchTerm: "good kw", impressions: 1000, clicks: 100, spend: 5, sales: 100, orders: 5, acos: 5, ctr: 10, cvr: 5, cpc: 0.05 },
        { searchTerm: "baseline", impressions: 1000, clicks: 100, spend: 100, sales: 100, orders: 3, acos: 100, ctr: 10, cvr: 3, cpc: 1 },
      ];

      const result = analyzeSearchTerms(data);

      const goodKwResult = result.results.find(r => r.searchTerm === "good kw");
      expect(goodKwResult?.suggestion).toBe("Increase_Bid");
      expect(result.increaseBidCount).toBeGreaterThanOrEqual(1);
    });

    it("identifies keywords to decrease bid when ACOS is above threshold", () => {
      // With two keywords:
      // - Overall spend: 10 + 300 = 310
      // - Overall sales: 100 + 100 = 200
      // - Overall ACOS: 310/200 * 100 = 155%
      // - Target ACOS: 155% * 1.0 = 155%
      // - Decrease threshold: 155% * 1.4 = 217%
      // - "bad kw" has ACOS 300%, which is > 217%, so should decrease bid
      const data = [
        { searchTerm: "baseline", impressions: 1000, clicks: 100, spend: 10, sales: 100, orders: 5, acos: 10, ctr: 10, cvr: 5, cpc: 0.1 },
        { searchTerm: "bad kw", impressions: 1000, clicks: 100, spend: 300, sales: 100, orders: 2, acos: 300, ctr: 10, cvr: 2, cpc: 3 },
      ];

      const result = analyzeSearchTerms(data);

      const badKwResult = result.results.find(r => r.searchTerm === "bad kw");
      expect(badKwResult?.suggestion).toBe("Decrease_Bid");
      expect(result.decreaseBidCount).toBeGreaterThanOrEqual(1);
    });

    it("identifies keywords for exact negative with high clicks and no conversions", () => {
      // Need enough baseline data to establish conversion rate
      // Then test a keyword with many clicks but no conversions
      const data = [
        // Baseline keyword with conversions to establish overall CVR
        { searchTerm: "converting", impressions: 1000, clicks: 100, spend: 50, sales: 200, orders: 4, acos: 25, ctr: 10, cvr: 4, cpc: 0.5 },
        // Keyword with 50 clicks, no conversions - should be exact negative
        // With CVR of 4%, threshold = ceil(100/4 * 1.0) = 25 clicks
        { searchTerm: "no convert", impressions: 500, clicks: 50, spend: 25, sales: 0, orders: 0, acos: 0, ctr: 10, cvr: 0, cpc: 0.5 },
      ];

      const result = analyzeSearchTerms(data);

      const noConvertResult = result.results.find(r => r.searchTerm === "no convert");
      expect(noConvertResult?.suggestion).toBe("Exact_Negative");
      expect(result.negativeCount).toBe(1);
    });

    it("marks keywords with very few clicks as pending", () => {
      // Need baseline data, then a keyword with minimal clicks
      const data = [
        // Baseline
        { searchTerm: "baseline", impressions: 1000, clicks: 100, spend: 50, sales: 200, orders: 4, acos: 25, ctr: 10, cvr: 4, cpc: 0.5 },
        // Very low clicks - should be pending
        { searchTerm: "low data", impressions: 100, clicks: 2, spend: 1, sales: 0, orders: 0, acos: 0, ctr: 2, cvr: 0, cpc: 0.5 },
      ];

      const result = analyzeSearchTerms(data);

      const lowDataResult = result.results.find(r => r.searchTerm === "low data");
      expect(lowDataResult?.suggestion).toBe("Pending");
    });

    it("marks keywords with moderate ACOS as reasonable", () => {
      // Create scenario where ACOS is between increase and decrease thresholds
      // Overall ACOS will be 50%, target 50%
      // Increase threshold: 50% * 0.7 = 35%
      // Decrease threshold: 50% * 1.4 = 70%
      // A keyword with ACOS 50% should be "Reasonable"
      const data = [
        { searchTerm: "moderate", impressions: 1000, clicks: 100, spend: 50, sales: 100, orders: 3, acos: 50, ctr: 10, cvr: 3, cpc: 0.5 },
      ];

      const result = analyzeSearchTerms(data);

      expect(result.results[0].suggestion).toBe("Reasonable");
      expect(result.reasonableCount).toBe(1);
    });
  });
});
