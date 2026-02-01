import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Ban,
  Minus,
  HelpCircle,
  BarChart3,
  ArrowLeft,
  Download,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import * as XLSX from "xlsx";

interface AnalysisResult {
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
  suggestion: string;
  suggestedAction: string;
  confidence: number;
  estimatedAcos?: number;
  campaign?: string;
  adGroup?: string;
}

interface AnalysisSummary {
  totalKeywords: number;
  increaseBidCount: number;
  decreaseBidCount: number;
  negativeCount: number;
  reasonableCount: number;
  pendingCount: number;
  overallAcos: number;
  overallConversionRate: number;
  averageCpc: number;
  results: AnalysisResult[];
}

// Optimization type badge component
function OptimizationBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    Increase_Bid: { label: "提高竞价", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: TrendingUp },
    Decrease_Bid: { label: "降低竞价", className: "bg-rose-500/20 text-rose-400 border-rose-500/30", icon: TrendingDown },
    Exact_Negative: { label: "精准否定", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Ban },
    Phrase_Negative: { label: "短语否定", className: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Ban },
    Reasonable: { label: "保持现状", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Minus },
    Pending: { label: "待定", className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: HelpCircle },
  };

  const { label, className, icon: Icon } = config[type] || config.Pending;

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
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
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
      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
        )}
        <div>
          <p className="text-lg font-medium">
            {isLoading ? "正在分析..." : "拖拽文件到此处或点击上传"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            支持 .xlsx 和 .xls 格式的搜索词报告
          </p>
        </div>
      </div>
    </div>
  );
}

// Analysis summary card
function SummaryCard({ summary }: { summary: AnalysisSummary }) {
  const stats = [
    { label: "总搜索词", value: summary.totalKeywords, icon: FileSpreadsheet, color: "text-blue-400" },
    { label: "提高竞价", value: summary.increaseBidCount, icon: TrendingUp, color: "text-emerald-400" },
    { label: "降低竞价", value: summary.decreaseBidCount, icon: TrendingDown, color: "text-rose-400" },
    { label: "否定建议", value: summary.negativeCount, icon: Ban, color: "text-amber-400" },
    { label: "保持现状", value: summary.reasonableCount, icon: Minus, color: "text-blue-400" },
    { label: "待定", value: summary.pendingCount, icon: HelpCircle, color: "text-gray-400" },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          分析摘要
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-lg bg-white/5">
              <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{summary.overallAcos.toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">整体ACOS</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{summary.overallConversionRate.toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">整体转化率</div>
          </div>
          <div>
            <div className="text-lg font-semibold">${summary.averageCpc.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">平均CPC</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Results table component
function ResultsTable({ results, filter }: { results: AnalysisResult[]; filter: string }) {
  const filteredResults = filter === "all" 
    ? results 
    : results.filter(r => r.suggestion === filter || (filter === "negative" && (r.suggestion === "Exact_Negative" || r.suggestion === "Phrase_Negative")));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-white/5">
            <th className="text-left p-3 font-medium">搜索词</th>
            <th className="text-left p-3 font-medium bg-emerald-500/10 border-l border-emerald-500/30">广告活动</th>
            <th className="text-left p-3 font-medium bg-emerald-500/10 border-r border-emerald-500/30">广告组</th>
            <th className="text-right p-3 font-medium">展示量</th>
            <th className="text-right p-3 font-medium">点击</th>
            <th className="text-right p-3 font-medium">花费</th>
            <th className="text-right p-3 font-medium">销售额</th>
            <th className="text-right p-3 font-medium">ACOS</th>
            <th className="text-center p-3 font-medium">建议</th>
            <th className="text-left p-3 font-medium">操作说明</th>
          </tr>
        </thead>
        <tbody>
          {filteredResults.slice(0, 100).map((result, index) => (
            <motion.tr
              key={`${result.searchTerm}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`border-b border-border/30 hover:bg-white/5 ${
                result.suggestion === "Increase_Bid" ? "bg-emerald-500/5" :
                result.suggestion === "Decrease_Bid" ? "bg-rose-500/5" :
                result.suggestion.includes("Negative") ? "bg-amber-500/5" :
                result.suggestion === "Reasonable" ? "bg-blue-500/5" : ""
              }`}
            >
              <td className="p-3 font-medium max-w-[200px] truncate" title={result.searchTerm}>
                {result.searchTerm}
              </td>
              <td className="p-3 max-w-[150px] truncate bg-emerald-500/5 border-l border-emerald-500/20" title={result.campaign || '-'}>
                <span className="text-emerald-400">{result.campaign || '-'}</span>
              </td>
              <td className="p-3 max-w-[120px] truncate bg-emerald-500/5 border-r border-emerald-500/20" title={result.adGroup || '-'}>
                <span className="text-emerald-300">{result.adGroup || '-'}</span>
              </td>
              <td className="p-3 text-right">{result.impressions.toLocaleString()}</td>
              <td className="p-3 text-right">{result.clicks}</td>
              <td className="p-3 text-right">${result.spend.toFixed(2)}</td>
              <td className="p-3 text-right">${result.sales.toFixed(2)}</td>
              <td className="p-3 text-right">{result.acos > 0 ? `${result.acos.toFixed(2)}%` : "-"}</td>
              <td className="p-3 text-center">
                <OptimizationBadge type={result.suggestion} />
              </td>
              <td className="p-3 text-muted-foreground text-xs max-w-[250px] truncate" title={result.suggestedAction}>
                {result.suggestedAction}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {filteredResults.length > 100 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          显示前100条结果，共 {filteredResults.length} 条
        </div>
      )}
    </div>
  );
}

export default function Analyze() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<AnalysisSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [fileName, setFileName] = useState("");

  const createAnalysis = trpc.analysis.create.useMutation({
    onSuccess: (data) => {
      toast.success("分析完成！");
      // Fetch full results
      if (data.reportId) {
        // The summary is already in the response
        setAnalysisResult(prev => prev);
      }
    },
    onError: (error) => {
      toast.error(`分析失败: ${error.message}`);
      setIsAnalyzing(false);
    },
  });

  const handleFileSelect = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setFileName(file.name);
    
    try {
      // Read Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
      
      if (jsonData.length === 0) {
        toast.error("Excel文件为空或格式不正确");
        setIsAnalyzing(false);
        return;
      }

      // Send to server for analysis
      const result = await createAnalysis.mutateAsync({
        fileName: file.name,
        fileData: jsonData,
      });

      // Parse the full analysis from local processing for immediate display
      // (Server stores it, but we also process locally for faster display)
      const localAnalysis = analyzeLocally(jsonData);
      setAnalysisResult(localAnalysis);
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error("File processing error:", error);
      toast.error("文件处理失败，请确保是有效的Excel文件");
      setIsAnalyzing(false);
    }
  }, [createAnalysis]);

  // Local analysis function (mirrors server logic)
  const analyzeLocally = (rows: Record<string, unknown>[]): AnalysisSummary => {
    const data = rows.map(row => {
      const searchTerm = String(row['搜索词'] || row['Search Term'] || row['客户搜索词'] || row['Customer Search Term'] || '');
      const impressions = parseNum(row['展示量'] || row['Impressions'] || row['展示次数'] || 0);
      const clicks = parseNum(row['点击量'] || row['Clicks'] || row['点击次数'] || 0);
      const spend = parseNum(row['花费'] || row['Spend'] || row['支出'] || row['Cost'] || 0);
      const sales = parseNum(row['销售额'] || row['Sales'] || row['7天总销售额'] || row['7 Day Total Sales'] || 0);
      const orders = parseNum(row['订单'] || row['Orders'] || row['7天总订单数'] || row['7天总订单数(#)'] || row['7 Day Total Orders (#)'] || row['7 Day Total Orders'] || 0);
      const campaign = String(row['广告活动名称'] || row['Campaign Name'] || row['广告活动'] || row['Campaign'] || '');
      const adGroup = String(row['广告组名称'] || row['Ad Group Name'] || row['广告组'] || row['Ad Group'] || '');
      
      return { searchTerm, impressions, clicks, spend, sales, orders, campaign, adGroup };
    }).filter(d => d.searchTerm);

    const totalSpend = data.reduce((sum, d) => sum + d.spend, 0);
    const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
    const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
    
    const overallAcos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
    const overallConversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
    const averageCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    const targetAcos = overallAcos * 1.0;
    const exactNegThreshold = Math.ceil((1 / (overallConversionRate || 1) * 100) * 1.0);
    const phraseNegThreshold = Math.ceil((1 / (overallConversionRate || 1) * 100) * 5.0);
    
    let increaseBidCount = 0, decreaseBidCount = 0, negativeCount = 0, reasonableCount = 0, pendingCount = 0;
    
    const results: AnalysisResult[] = data.map(term => {
      const acos = term.sales > 0 ? (term.spend / term.sales) * 100 : 0;
      const ctr = term.impressions > 0 ? (term.clicks / term.impressions) * 100 : 0;
      const cvr = term.clicks > 0 ? (term.orders / term.clicks) * 100 : 0;
      const cpc = term.clicks > 0 ? term.spend / term.clicks : 0;
      
      let suggestion: string = "Pending";
      let suggestedAction = "数据不足，需人工判断相关性";
      let confidence = 0.3;
      
      if (term.orders > 0) {
        if (acos < targetAcos * 0.7) {
          suggestion = "Increase_Bid";
          suggestedAction = `ACOS ${acos.toFixed(2)}% 低于目标，建议提高竞价获取更多流量`;
          confidence = Math.min(0.9, 0.5 + term.orders * 0.1);
          increaseBidCount++;
        } else if (acos > targetAcos * 1.4) {
          suggestion = "Decrease_Bid";
          suggestedAction = `ACOS ${acos.toFixed(2)}% 高于目标，建议降低竞价优化利润`;
          confidence = Math.min(0.9, 0.5 + term.orders * 0.1);
          decreaseBidCount++;
        } else {
          suggestion = "Reasonable";
          suggestedAction = `ACOS ${acos.toFixed(2)}% 在合理范围内，建议保持现状`;
          confidence = Math.min(0.85, 0.4 + term.orders * 0.1);
          reasonableCount++;
        }
      } else if (term.clicks >= phraseNegThreshold) {
        suggestion = "Phrase_Negative";
        suggestedAction = `${term.clicks}次点击0转化，建议短语否定`;
        confidence = 0.8;
        negativeCount++;
      } else if (term.clicks >= exactNegThreshold) {
        suggestion = "Exact_Negative";
        suggestedAction = `${term.clicks}次点击0转化，建议精准否定`;
        confidence = 0.7;
        negativeCount++;
      } else {
        pendingCount++;
      }
      
      return {
        searchTerm: term.searchTerm,
        campaign: term.campaign,
        adGroup: term.adGroup,
        impressions: term.impressions,
        clicks: term.clicks,
        spend: term.spend,
        sales: term.sales,
        orders: term.orders,
        acos,
        ctr,
        cvr,
        cpc,
        suggestion,
        suggestedAction,
        confidence,
      };
    });
    
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
      results,
    };
  };

  const parseNum = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$¥,，%]/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setFileName("");
    setSelectedFilter("all");
  };

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>登录后使用分析功能</CardTitle>
            <CardDescription>
              上传您的搜索词报告，获取专业的广告优化建议
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <a href={getLoginUrl()}>登录 / 注册</a>
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
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回文档
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="font-semibold">广告数据分析</h1>
          </div>
          {user && (
            <div className="text-sm text-muted-foreground">
              {user.name || user.email}
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        <AnimatePresence mode="wait">
          {!analysisResult ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">上传搜索词报告</h2>
                <p className="text-muted-foreground">
                  支持亚马逊广告后台或领星ERP导出的搜索词报告
                </p>
              </div>
              
              <FileDropzone onFileSelect={handleFileSelect} isLoading={isAnalyzing} />
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>支持的列名：搜索词、展示量、点击量、花费、销售额、订单</p>
                <p className="mt-1">（中英文列名均可识别）</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* File info and actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="font-medium">{fileName}</span>
                  <Badge variant="secondary">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    分析完成
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  重新分析
                </Button>
              </div>

              {/* Summary */}
              <SummaryCard summary={analysisResult} />

              {/* Filter tabs */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>详细结果</CardTitle>
                    <div className="flex gap-2">
                      {[
                        { value: "all", label: "全部" },
                        { value: "Increase_Bid", label: "提高竞价" },
                        { value: "Decrease_Bid", label: "降低竞价" },
                        { value: "negative", label: "否定建议" },
                        { value: "Reasonable", label: "保持现状" },
                      ].map((tab) => (
                        <Button
                          key={tab.value}
                          variant={selectedFilter === tab.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedFilter(tab.value)}
                        >
                          {tab.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ResultsTable results={analysisResult.results} filter={selectedFilter} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
