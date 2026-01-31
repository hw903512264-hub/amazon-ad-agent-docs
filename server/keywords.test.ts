import { describe, expect, it } from "vitest";
import { suggestFromSearchTerms } from "./keywordExpander";

describe("keywordExpander", () => {
  describe("suggestFromSearchTerms", () => {
    it("should identify high-performing keywords for expansion", () => {
      const searchTerms = [
        { term: "magnesium gummies", orders: 50, acos: 15, clicks: 200 },
        { term: "magnesium supplement", orders: 30, acos: 20, clicks: 150 },
        { term: "vitamin d gummies", orders: 5, acos: 45, clicks: 100 },
        { term: "random term", orders: 0, acos: 0, clicks: 50 },
      ];

      const suggestions = suggestFromSearchTerms(searchTerms, 30);

      // Should include high-performing terms (ACOS < target)
      expect(suggestions.some(s => s.keyword === "magnesium gummies")).toBe(true);
      expect(suggestions.some(s => s.keyword === "magnesium supplement")).toBe(true);
      
      // High performers should have high relevance score
      const magnesiumGummies = suggestions.find(s => s.keyword === "magnesium gummies");
      expect(magnesiumGummies?.relevance).toBeGreaterThan(0);
      expect(magnesiumGummies?.type).toBe("exact");
    });

    it("should exclude zero-order terms", () => {
      const searchTerms = [
        { term: "good keyword", orders: 10, acos: 20, clicks: 100 },
        { term: "zero orders", orders: 0, acos: 0, clicks: 50 },
      ];

      const suggestions = suggestFromSearchTerms(searchTerms, 30);

      expect(suggestions.some(s => s.keyword === "zero orders")).toBe(false);
      expect(suggestions.some(s => s.keyword === "good keyword")).toBe(true);
    });

    it("should calculate relevance based on ACOS ratio", () => {
      const searchTerms = [
        { term: "excellent", orders: 20, acos: 10, clicks: 100 }, // ACOS 10% vs target 30% = high relevance
        { term: "good", orders: 15, acos: 22, clicks: 80 },       // ACOS 22% vs target 30% = medium relevance
        { term: "medium", orders: 10, acos: 28, clicks: 60 },     // ACOS 28% vs target 30% = lower relevance
      ];

      const suggestions = suggestFromSearchTerms(searchTerms, 30);

      const excellent = suggestions.find(s => s.keyword === "excellent");
      const good = suggestions.find(s => s.keyword === "good");
      const medium = suggestions.find(s => s.keyword === "medium");

      // Lower ACOS should have higher relevance
      expect(excellent?.relevance).toBeGreaterThan(good?.relevance || 0);
      expect(good?.relevance).toBeGreaterThan(medium?.relevance || 0);
    });

    it("should return empty array for empty input", () => {
      const suggestions = suggestFromSearchTerms([], 30);
      expect(suggestions).toEqual([]);
    });

    it("should filter out high ACOS terms", () => {
      const searchTerms = [
        { term: "high acos", orders: 5, acos: 50, clicks: 100 },
        { term: "low acos", orders: 10, acos: 15, clicks: 80 },
      ];

      const suggestions = suggestFromSearchTerms(searchTerms, 30);

      expect(suggestions.some(s => s.keyword === "high acos")).toBe(false);
      expect(suggestions.some(s => s.keyword === "low acos")).toBe(true);
    });

    it("should assign correct searchVolume based on clicks", () => {
      const searchTerms = [
        { term: "high clicks", orders: 10, acos: 15, clicks: 150 },
        { term: "medium clicks", orders: 8, acos: 18, clicks: 50 },
        { term: "low clicks", orders: 5, acos: 20, clicks: 20 },
      ];

      const suggestions = suggestFromSearchTerms(searchTerms, 30);

      const highClicks = suggestions.find(s => s.keyword === "high clicks");
      const mediumClicks = suggestions.find(s => s.keyword === "medium clicks");
      const lowClicks = suggestions.find(s => s.keyword === "low clicks");

      expect(highClicks?.searchVolume).toBe("high");
      expect(mediumClicks?.searchVolume).toBe("medium");
      expect(lowClicks?.searchVolume).toBe("low");
    });
  });
});
