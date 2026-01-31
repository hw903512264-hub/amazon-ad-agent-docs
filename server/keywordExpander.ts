/**
 * Keyword Expander Service
 * Uses LLM to expand seed keywords into related keyword suggestions
 */

import { invokeLLM } from "./_core/llm";

export interface KeywordSuggestion {
  keyword: string;
  type: 'broad' | 'phrase' | 'exact' | 'long_tail' | 'related';
  relevance: number; // 0-100
  searchVolume: 'high' | 'medium' | 'low' | 'unknown';
  competition: 'high' | 'medium' | 'low' | 'unknown';
  reason: string;
}

export interface KeywordExpansionResult {
  seedKeywords: string[];
  productDescription: string;
  suggestions: KeywordSuggestion[];
  totalSuggestions: number;
  generatedAt: Date;
}

/**
 * Expand seed keywords using LLM
 */
export async function expandKeywords(
  seedKeywords: string[],
  productDescription: string,
  targetMarket: string = 'US',
  maxSuggestions: number = 30
): Promise<KeywordExpansionResult> {
  const prompt = `你是一位专业的亚马逊广告关键词专家。请根据以下种子关键词和产品描述，拓展相关的广告关键词。

种子关键词：${seedKeywords.join(', ')}

产品描述：${productDescription}

目标市场：${targetMarket}

请生成${maxSuggestions}个相关关键词建议，包括：
1. 广泛匹配关键词 (broad) - 覆盖更多搜索意图
2. 短语匹配关键词 (phrase) - 包含核心词组
3. 精准匹配关键词 (exact) - 高转化潜力
4. 长尾关键词 (long_tail) - 低竞争高转化
5. 相关关键词 (related) - 相关品类或场景

对于每个关键词，请评估：
- relevance: 与产品的相关度 (0-100)
- searchVolume: 预估搜索量 (high/medium/low/unknown)
- competition: 预估竞争程度 (high/medium/low/unknown)
- reason: 推荐理由

请以JSON格式返回结果。`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "你是一位专业的亚马逊广告关键词专家，精通关键词研究和PPC广告优化。请始终以JSON格式返回结果。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "keyword_expansion",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string", description: "拓展的关键词" },
                  type: { 
                    type: "string", 
                    enum: ["broad", "phrase", "exact", "long_tail", "related"],
                    description: "关键词类型"
                  },
                  relevance: { type: "number", description: "相关度 0-100" },
                  searchVolume: { 
                    type: "string", 
                    enum: ["high", "medium", "low", "unknown"],
                    description: "预估搜索量"
                  },
                  competition: { 
                    type: "string", 
                    enum: ["high", "medium", "low", "unknown"],
                    description: "预估竞争程度"
                  },
                  reason: { type: "string", description: "推荐理由" }
                },
                required: ["keyword", "type", "relevance", "searchVolume", "competition", "reason"],
                additionalProperties: false
              }
            }
          },
          required: ["suggestions"],
          additionalProperties: false
        }
      }
    }
  });

  // Parse the response
  const content = response.choices[0]?.message?.content;
  let suggestions: KeywordSuggestion[] = [];
  
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      suggestions = parsed.suggestions || [];
    } catch (e) {
      console.error('Failed to parse LLM response:', e);
      suggestions = [];
    }
  }

  return {
    seedKeywords,
    productDescription,
    suggestions,
    totalSuggestions: suggestions.length,
    generatedAt: new Date()
  };
}

/**
 * Get keyword suggestions from existing search terms
 * Analyzes high-performing search terms to suggest similar keywords
 */
export function suggestFromSearchTerms(
  searchTerms: Array<{
    term: string;
    orders: number;
    acos: number;
    clicks: number;
  }>,
  targetAcos: number = 30
): KeywordSuggestion[] {
  // Filter high-performing terms
  const highPerformers = searchTerms
    .filter(t => t.orders > 0 && t.acos < targetAcos && t.acos > 0)
    .sort((a, b) => a.acos - b.acos)
    .slice(0, 20);

  return highPerformers.map(term => ({
    keyword: term.term,
    type: 'exact' as const,
    relevance: Math.min(100, Math.round((1 - term.acos / targetAcos) * 100)),
    searchVolume: term.clicks > 100 ? 'high' : term.clicks > 30 ? 'medium' : 'low',
    competition: 'unknown' as const,
    reason: `ACOS ${term.acos.toFixed(1)}%, ${term.orders}单, 表现优秀建议加大投放`
  }));
}
