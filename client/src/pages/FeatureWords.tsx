/**
 * Feature Words Analysis Page
 * Analyzes search terms by splitting them into feature words and displaying metrics
 * Based on 特征词分析工具V1.12.2 logic
 */

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Link } from "wouter";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  ArrowLeft,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart,
  Hash,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Percent,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";

// Types
interface FeatureWordData {
  word: string;
  count: number;
  totalClicks: number;
  totalOrders: number;
  totalSpend: number;
  totalSales: number;
  totalImpressions: number;
  conversionRate: number;
  acos: number;
  avgCpc: number;
}

interface FeatureWordAnalysisResult {
  totalSearchTerms: number;
  totalFeatureWords: number;
  featureWords: FeatureWordData[];
  analyzedAt: Date;
}

interface KeywordSuggestion {
  keyword: string;
  type: 'high_performer' | 'combination' | 'problem';
  metrics: {
    clicks: number;
    orders: number;
    acos: number;
    conversionRate: number;
  };
  suggestion: string;
}

// Performance badge component
function PerformanceBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    high_performer: { label: "高转化", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: TrendingUp },
    combination: { label: "组合词", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Hash },
    problem: { label: "问题词", className: "bg-rose-500/20 text-rose-400 border-rose-500/30", icon: AlertTriangle },
  };

  const { label, className, icon: Icon } = config[type] || config.problem;

  return (
    <Badge variant="outline" className={`${className} flex items-center gap-1.5 px-2 py-0.5 text-xs`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// File upload dropzone component
function FileDropzone({ onFileSelect, isLoading }: { onFileSelect: (file: File) => void; isLoading: boolean }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileSelect(file);
    } else {
      toast.error("请上传Excel文件 (.xlsx 或 .xls)");
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
        isDragging
          ? "border-primary bg-primary/10"
          : "border-border/50 hover:border-primary/50 hover:bg-white/5"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      <div className="flex flex-col items-center gap-3">
        {isLoading ? (
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Upload className="h-7 w-7 text-primary" />
          </div>
        )}
        <div>
          <p className="text-base font-medium">
            {isLoading ? "正在分析特征词..." : "拖拽文件到此处或点击上传"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            支持 .xlsx 和 .xls 格式的搜索词报告
          </p>
        </div>
      </div>
    </div>
  );
}

// Summary stats component
function SummaryStats({ analysis }: { analysis: FeatureWordAnalysisResult }) {
  const topPerformers = analysis.featureWords.filter(fw => fw.totalOrders > 0 && fw.acos > 0 && fw.acos < 30).length;
  const problemWords = analysis.featureWords.filter(fw => fw.totalClicks >= 10 && fw.totalOrders === 0).length;
  
  const stats = [
    { label: "搜索词数", value: analysis.totalSearchTerms, icon: FileSpreadsheet, color: "text-blue-400" },
    { label: "特征词数", value: analysis.totalFeatureWords, icon: Hash, color: "text-purple-400" },
    { label: "高转化词", value: topPerformers, icon: TrendingUp, color: "text-emerald-400" },
    { label: "问题词", value: problemWords, icon: AlertTriangle, color: "text-rose-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 text-center">
            <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Feature words data table
function FeatureWordsTable({ 
  featureWords, 
  searchTerm, 
  sortBy, 
  sortOrder, 
  onSort 
}: { 
  featureWords: FeatureWordData[]; 
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const filteredWords = useMemo(() => {
    let filtered = featureWords;
    if (searchTerm) {
      filtered = filtered.filter(fw => fw.word.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return filtered;
  }, [featureWords, searchTerm]);

  const SortIcon = sortOrder === 'asc' ? SortAsc : SortDesc;

  const columns = [
    { key: 'word', label: '特征词', align: 'left' },
    { key: 'count', label: '出现次数', align: 'right' },
    { key: 'totalClicks', label: '总点击', align: 'right' },
    { key: 'totalOrders', label: '总订单', align: 'right' },
    { key: 'totalSpend', label: '总花费', align: 'right' },
    { key: 'totalSales', label: '总销售额', align: 'right' },
    { key: 'conversionRate', label: '转化率', align: 'right' },
    { key: 'acos', label: 'ACOS', align: 'right' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-white/5">
            {columns.map((col) => (
              <th 
                key={col.key}
                className={`p-3 font-medium cursor-pointer hover:bg-white/5 transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                onClick={() => onSort(col.key)}
              >
                <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                  {col.label}
                  {sortBy === col.key && <SortIcon className="h-3 w-3" />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredWords.slice(0, 100).map((fw, index) => {
            const isHighPerformer = fw.totalOrders > 0 && fw.acos > 0 && fw.acos < 30;
            const isProblem = fw.totalClicks >= 10 && fw.totalOrders === 0;
            
            return (
              <tr
                key={fw.word}
                className={`border-b border-border/30 hover:bg-white/5 ${
                  isHighPerformer ? "bg-emerald-500/5" :
                  isProblem ? "bg-rose-500/5" : ""
                }`}
              >
                <td className="p-3 font-medium">
                  <div className="flex items-center gap-2">
                    {fw.word}
                    {isHighPerformer && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                    {isProblem && <AlertTriangle className="h-3 w-3 text-rose-400" />}
                  </div>
                </td>
                <td className="p-3 text-right">{fw.count}</td>
                <td className="p-3 text-right">{fw.totalClicks.toLocaleString()}</td>
                <td className="p-3 text-right">{fw.totalOrders}</td>
                <td className="p-3 text-right">${fw.totalSpend.toFixed(2)}</td>
                <td className="p-3 text-right">${fw.totalSales.toFixed(2)}</td>
                <td className="p-3 text-right">
                  <span className={fw.conversionRate > 5 ? "text-emerald-400" : fw.conversionRate > 0 ? "text-amber-400" : "text-muted-foreground"}>
                    {fw.conversionRate.toFixed(2)}%
                  </span>
                </td>
                <td className="p-3 text-right">
                  <span className={fw.acos > 0 && fw.acos < 30 ? "text-emerald-400" : fw.acos > 50 ? "text-rose-400" : "text-muted-foreground"}>
                    {fw.acos > 0 ? `${fw.acos.toFixed(2)}%` : "-"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filteredWords.length > 100 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          显示前100条结果，共 {filteredWords.length} 条
        </div>
      )}
    </div>
  );
}

// Chart 1: Clicks vs Conversion Rate Scatter
function ClicksConversionChart({ featureWords }: { featureWords: FeatureWordData[] }) {
  // Get top 20 feature words by clicks for visualization
  const topWords = useMemo(() => {
    return [...featureWords]
      .filter(fw => fw.totalClicks > 0)
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 20);
  }, [featureWords]);

  const maxClicks = Math.max(...topWords.map(fw => fw.totalClicks), 1);
  const maxCvr = Math.max(...topWords.map(fw => fw.conversionRate), 10);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-primary" />
          特征词点击量 vs 转化率
        </CardTitle>
        <CardDescription>
          气泡大小表示订单数量，颜色表示转化表现
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-80 bg-white/5 rounded-lg p-4">
          {/* Y-axis label */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
            转化率 (%)
          </div>
          {/* X-axis label */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            点击量
          </div>
          
          {/* Chart area */}
          <div className="ml-6 mb-6 h-full relative">
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="border border-border/20" />
              ))}
            </div>
            
            {/* Data points */}
            {topWords.map((fw, index) => {
              const x = (fw.totalClicks / maxClicks) * 90 + 5;
              const y = 95 - (fw.conversionRate / maxCvr) * 90;
              const size = Math.max(8, Math.min(40, fw.totalOrders * 4 + 8));
              const isHighPerformer = fw.conversionRate > 5;
              const isProblem = fw.totalClicks >= 10 && fw.totalOrders === 0;
              
              return (
                <div
                  key={fw.word}
                  className={`absolute rounded-full transition-all duration-300 hover:scale-125 cursor-pointer group ${
                    isHighPerformer ? "bg-emerald-500/60 border-emerald-400" :
                    isProblem ? "bg-rose-500/60 border-rose-400" :
                    "bg-blue-500/60 border-blue-400"
                  } border`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`${fw.word}: ${fw.totalClicks}点击, ${fw.conversionRate.toFixed(2)}%转化率, ${fw.totalOrders}订单`}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="font-medium">{fw.word}</div>
                    <div className="text-muted-foreground">
                      {fw.totalClicks}点击 | {fw.conversionRate.toFixed(2)}%转化 | {fw.totalOrders}单
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500/60 border border-emerald-400" />
              <span>高转化</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-rose-500/60 border border-rose-400" />
              <span>问题词</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500/60 border border-blue-400" />
              <span>普通</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Chart 2: ACOS Distribution Bar Chart
function AcosDistributionChart({ featureWords }: { featureWords: FeatureWordData[] }) {
  // Calculate ACOS distribution
  const distribution = useMemo(() => {
    const ranges = [
      { label: '0-10%', min: 0, max: 10, count: 0, color: 'bg-emerald-500' },
      { label: '10-20%', min: 10, max: 20, count: 0, color: 'bg-emerald-400' },
      { label: '20-30%', min: 20, max: 30, count: 0, color: 'bg-blue-500' },
      { label: '30-50%', min: 30, max: 50, count: 0, color: 'bg-amber-500' },
      { label: '50-100%', min: 50, max: 100, count: 0, color: 'bg-orange-500' },
      { label: '>100%', min: 100, max: Infinity, count: 0, color: 'bg-rose-500' },
      { label: '无转化', min: -1, max: 0, count: 0, color: 'bg-gray-500' },
    ];
    
    featureWords.forEach(fw => {
      if (fw.totalClicks < 5) return; // Only count words with meaningful data
      
      if (fw.acos === 0 && fw.totalOrders === 0) {
        ranges[6].count++;
      } else {
        for (const range of ranges.slice(0, 6)) {
          if (fw.acos >= range.min && fw.acos < range.max) {
            range.count++;
            break;
          }
        }
      }
    });
    
    return ranges;
  }, [featureWords]);

  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChart className="h-5 w-5 text-primary" />
          特征词ACOS分布
        </CardTitle>
        <CardDescription>
          按ACOS区间统计特征词数量（仅统计点击≥5的特征词）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {distribution.map((range) => (
            <div key={range.label} className="flex items-center gap-3">
              <div className="w-16 text-xs text-muted-foreground text-right">{range.label}</div>
              <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${range.color} transition-all duration-500 rounded-lg`}
                  style={{ width: `${(range.count / maxCount) * 100}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                  {range.count}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <Separator className="my-4" />
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-emerald-400 font-semibold">
              {distribution.slice(0, 3).reduce((sum, d) => sum + d.count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">优秀 (&lt;30%)</div>
          </div>
          <div>
            <div className="text-amber-400 font-semibold">
              {distribution.slice(3, 5).reduce((sum, d) => sum + d.count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">需优化 (30-100%)</div>
          </div>
          <div>
            <div className="text-rose-400 font-semibold">
              {distribution[5].count + distribution[6].count}
            </div>
            <div className="text-xs text-muted-foreground">问题 (&gt;100%/无转化)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Keyword suggestions section
function KeywordSuggestions({ suggestions }: { suggestions: KeywordSuggestion[] }) {
  const [filterType, setFilterType] = useState<string>("all");
  
  const filteredSuggestions = filterType === "all" 
    ? suggestions 
    : suggestions.filter(s => s.type === filterType);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              关键词建议
            </CardTitle>
            <CardDescription>
              基于特征词分析生成的关键词投放建议
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              全部
            </Button>
            <Button
              variant={filterType === "high_performer" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("high_performer")}
              className="text-emerald-400"
            >
              高转化
            </Button>
            <Button
              variant={filterType === "problem" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("problem")}
              className="text-rose-400"
            >
              问题词
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.keyword}-${index}`}
              className={`p-3 rounded-lg border ${
                suggestion.type === 'high_performer' ? "bg-emerald-500/5 border-emerald-500/30" :
                suggestion.type === 'problem' ? "bg-rose-500/5 border-rose-500/30" :
                "bg-blue-500/5 border-blue-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{suggestion.keyword}</span>
                <PerformanceBadge type={suggestion.type} />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{suggestion.metrics.clicks}点击</span>
                <span>{suggestion.metrics.orders}订单</span>
                {suggestion.metrics.acos > 0 && (
                  <span>ACOS {suggestion.metrics.acos.toFixed(1)}%</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{suggestion.suggestion}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main component
export default function FeatureWords() {
  const { user, loading: authLoading } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: FeatureWordAnalysisResult;
    suggestions: KeywordSuggestion[];
    highPerformers: FeatureWordData[];
    problemWords: FeatureWordData[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("totalClicks");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fileName, setFileName] = useState("");

  const analyzeMutation = trpc.keywords.analyzeFeatureWordsDirect.useMutation({
    onSuccess: (data) => {
      setAnalysisResult({
        analysis: data.analysis,
        suggestions: data.suggestions,
        highPerformers: data.highPerformers,
        problemWords: data.problemWords,
      });
      setIsAnalyzing(false);
      toast.success("特征词分析完成！");
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`分析失败: ${error.message}`);
    },
  });

  const handleFileSelect = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setFileName(file.name);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Parse search terms from Excel data
      const searchTerms = jsonData.map((row: any) => {
        // Try different column name variations
        const searchTerm = row['客户搜索词'] || row['Search Term'] || row['搜索词'] || row['Customer Search Term'] || '';
        const impressions = parseFloat(row['展示量'] || row['Impressions'] || row['曝光'] || 0);
        const clicks = parseFloat(row['点击量'] || row['Clicks'] || row['点击'] || 0);
        const spend = parseFloat(row['花费'] || row['Spend'] || row['支出'] || 0);
        const sales = parseFloat(row['7天总销售额'] || row['7 Day Total Sales'] || row['销售额'] || row['Sales'] || 0);
        const orders = parseFloat(row['7天总订单数(#)'] || row['7天总订单数'] || row['7 Day Total Orders (#)'] || row['订单'] || row['Orders'] || 0);
        
        return {
          searchTerm: String(searchTerm),
          impressions: isNaN(impressions) ? 0 : impressions,
          clicks: isNaN(clicks) ? 0 : clicks,
          spend: isNaN(spend) ? 0 : spend,
          sales: isNaN(sales) ? 0 : sales,
          orders: isNaN(orders) ? 0 : orders,
        };
      }).filter((t: any) => t.searchTerm && t.searchTerm.trim() !== '');
      
      if (searchTerms.length === 0) {
        throw new Error("未找到有效的搜索词数据，请检查文件格式");
      }
      
      analyzeMutation.mutate({ searchTerms });
    } catch (error) {
      setIsAnalyzing(false);
      toast.error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [analyzeMutation]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedFeatureWords = useMemo(() => {
    if (!analysisResult) return [];
    
    return [...analysisResult.analysis.featureWords].sort((a, b) => {
      const aVal = a[sortBy as keyof FeatureWordData] as number;
      const bVal = b[sortBy as keyof FeatureWordData] as number;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [analysisResult, sortBy, sortOrder]);

  const exportToExcel = () => {
    if (!analysisResult) return;
    
    const wb = XLSX.utils.book_new();
    
    // Feature words sheet
    const fwData = analysisResult.analysis.featureWords.map(fw => ({
      '特征词': fw.word,
      '出现次数': fw.count,
      '总点击': fw.totalClicks,
      '总订单': fw.totalOrders,
      '总花费': fw.totalSpend.toFixed(2),
      '总销售额': fw.totalSales.toFixed(2),
      '转化率': fw.conversionRate.toFixed(2) + '%',
      'ACOS': fw.acos > 0 ? fw.acos.toFixed(2) + '%' : '-',
      '平均CPC': fw.avgCpc.toFixed(2),
    }));
    const ws1 = XLSX.utils.json_to_sheet(fwData);
    XLSX.utils.book_append_sheet(wb, ws1, '特征词分析');
    
    // Suggestions sheet
    const sugData = analysisResult.suggestions.map(s => ({
      '关键词': s.keyword,
      '类型': s.type === 'high_performer' ? '高转化' : s.type === 'problem' ? '问题词' : '组合词',
      '点击': s.metrics.clicks,
      '订单': s.metrics.orders,
      'ACOS': s.metrics.acos > 0 ? s.metrics.acos.toFixed(2) + '%' : '-',
      '建议': s.suggestion,
    }));
    const ws2 = XLSX.utils.json_to_sheet(sugData);
    XLSX.utils.book_append_sheet(wb, ws2, '关键词建议');
    
    XLSX.writeFile(wb, `特征词分析_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("已导出Excel文件");
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Hash className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>特征词分析</CardTitle>
            <CardDescription>请先登录以使用特征词分析功能</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild>
              <a href="/api/oauth/login">登录</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">返回首页</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Hash className="h-5 w-5 text-purple-400" />
            </div>
            <span className="font-semibold">特征词分析</span>
          </div>
          {analysisResult && (
            <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              导出Excel
            </Button>
          )}
        </div>
      </header>

      <main className="container py-8">
        {!analysisResult ? (
          // Upload section
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">特征词分析</h1>
              <p className="text-muted-foreground">
                上传搜索词报告，自动拆分特征词并分析各特征词的表现指标
              </p>
            </div>
            
            <Card className="glass-card">
              <CardContent className="p-6">
                <FileDropzone onFileSelect={handleFileSelect} isLoading={isAnalyzing} />
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">功能说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">特征词拆分：</strong>
                  将搜索词拆分为单独的特征词（如 "magnesium gummies" → "magnesium", "gummies"）
                </p>
                <p>
                  <strong className="text-foreground">指标聚合：</strong>
                  统计每个特征词的总点击、订单、花费、销售额、转化率和ACOS
                </p>
                <p>
                  <strong className="text-foreground">智能识别：</strong>
                  自动识别高转化特征词（ACOS&lt;30%）和问题特征词（高点击0转化）
                </p>
                <p>
                  <strong className="text-foreground">关键词建议：</strong>
                  基于特征词表现生成投放建议，包括高转化词推荐和问题词警告
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Results section
          <div className="space-y-6">
            {/* Summary stats */}
            <SummaryStats analysis={analysisResult.analysis} />
            
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ClicksConversionChart featureWords={analysisResult.analysis.featureWords} />
              <AcosDistributionChart featureWords={analysisResult.analysis.featureWords} />
            </div>
            
            {/* Keyword suggestions */}
            <KeywordSuggestions suggestions={analysisResult.suggestions} />
            
            {/* Data table */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      特征词数据表
                    </CardTitle>
                    <CardDescription>
                      {fileName} - 共 {analysisResult.analysis.totalFeatureWords} 个特征词
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索特征词..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAnalysisResult(null);
                        setFileName("");
                      }}
                    >
                      重新上传
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FeatureWordsTable 
                  featureWords={sortedFeatureWords}
                  searchTerm={searchTerm}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
