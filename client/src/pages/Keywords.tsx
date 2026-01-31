/**
 * Keyword Expansion Page
 * Allows users to input seed keywords and get AI-powered keyword suggestions
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Bot,
  Search,
  Sparkles,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  TrendingUp,
  Target,
  Zap,
  Download,
  Copy,
  Check,
  Filter,
} from "lucide-react";

// Type badge component
function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    broad: { label: "广泛匹配", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    phrase: { label: "短语匹配", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    exact: { label: "精准匹配", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    long_tail: { label: "长尾词", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    related: { label: "相关词", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  };
  
  const { label, className } = config[type] || { label: type, className: "bg-gray-500/20 text-gray-400" };
  
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

// Volume badge component
function VolumeBadge({ volume }: { volume: string }) {
  const config: Record<string, { label: string; className: string }> = {
    high: { label: "高", className: "text-emerald-400" },
    medium: { label: "中", className: "text-amber-400" },
    low: { label: "低", className: "text-red-400" },
    unknown: { label: "未知", className: "text-gray-400" },
  };
  
  const { label, className } = config[volume] || { label: volume, className: "text-gray-400" };
  
  return <span className={className}>{label}</span>;
}

export default function Keywords() {
  const { user, loading: authLoading } = useAuth();
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetMarket, setTargetMarket] = useState("US");
  const [maxSuggestions, setMaxSuggestions] = useState(30);
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const expandMutation = trpc.keywords.expand.useMutation({
    onSuccess: () => {
      toast.success("关键词拓展完成！");
    },
    onError: (error) => {
      toast.error(`拓展失败: ${error.message}`);
    },
  });

  const addKeyword = () => {
    const keyword = currentKeyword.trim();
    if (keyword && !seedKeywords.includes(keyword) && seedKeywords.length < 10) {
      setSeedKeywords([...seedKeywords, keyword]);
      setCurrentKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    setSeedKeywords(seedKeywords.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleExpand = () => {
    if (seedKeywords.length === 0) {
      toast.error("请至少输入一个种子关键词");
      return;
    }
    if (productDescription.length < 10) {
      toast.error("请输入产品描述（至少10个字符）");
      return;
    }
    
    expandMutation.mutate({
      seedKeywords,
      productDescription,
      targetMarket,
      maxSuggestions,
    });
  };

  const copyKeyword = (keyword: string, index: number) => {
    navigator.clipboard.writeText(keyword);
    setCopiedIndex(index);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllKeywords = () => {
    if (!expandMutation.data?.suggestions) return;
    const keywords = expandMutation.data.suggestions.map(s => s.keyword).join("\n");
    navigator.clipboard.writeText(keywords);
    toast.success("已复制所有关键词");
  };

  const exportToCSV = () => {
    if (!expandMutation.data?.suggestions) return;
    
    const headers = ["关键词", "类型", "相关度", "搜索量", "竞争度", "推荐理由"];
    const rows = expandMutation.data.suggestions.map(s => [
      s.keyword,
      s.type,
      s.relevance.toString(),
      s.searchVolume,
      s.competition,
      s.reason,
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `关键词拓展_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出CSV文件");
  };

  // Filter suggestions
  const filteredSuggestions = expandMutation.data?.suggestions?.filter(s => 
    filterType === "all" || s.type === filterType
  ) || [];

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>关键词拓展</CardTitle>
            <CardDescription>请先登录以使用关键词拓展功能</CardDescription>
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
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">关键词拓展</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  输入种子关键词
                </CardTitle>
                <CardDescription>
                  输入1-10个核心关键词，AI将为您拓展相关关键词建议
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seed keywords input */}
                <div className="space-y-2">
                  <Label>种子关键词</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入关键词后按回车添加"
                      value={currentKeyword}
                      onChange={(e) => setCurrentKeyword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={seedKeywords.length >= 10}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={addKeyword}
                      disabled={!currentKeyword.trim() || seedKeywords.length >= 10}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {seedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {seedKeywords.map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="flex items-center gap-1 px-3 py-1"
                        >
                          {keyword}
                          <button
                            onClick={() => removeKeyword(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    已添加 {seedKeywords.length}/10 个关键词
                  </p>
                </div>

                {/* Product description */}
                <div className="space-y-2">
                  <Label>产品描述</Label>
                  <Textarea
                    placeholder="请描述您的产品特点、用途、目标人群等信息..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {productDescription.length}/2000 字符
                  </p>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>目标市场</Label>
                    <Select value={targetMarket} onValueChange={setTargetMarket}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">美国 (US)</SelectItem>
                        <SelectItem value="UK">英国 (UK)</SelectItem>
                        <SelectItem value="DE">德国 (DE)</SelectItem>
                        <SelectItem value="JP">日本 (JP)</SelectItem>
                        <SelectItem value="CA">加拿大 (CA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>拓展数量</Label>
                    <Select 
                      value={maxSuggestions.toString()} 
                      onValueChange={(v) => setMaxSuggestions(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20个</SelectItem>
                        <SelectItem value="30">30个</SelectItem>
                        <SelectItem value="50">50个</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Submit button */}
                <Button 
                  className="w-full gap-2" 
                  onClick={handleExpand}
                  disabled={expandMutation.isPending || seedKeywords.length === 0 || productDescription.length < 10}
                >
                  {expandMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI正在拓展关键词...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      开始拓展
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  使用技巧
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• 种子关键词应该是您产品的核心词，如品牌词、品类词</p>
                <p>• 产品描述越详细，拓展结果越精准</p>
                <p>• 建议从高相关度的关键词开始测试投放</p>
                <p>• 长尾词通常竞争较低，转化率较高</p>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {expandMutation.data?.suggestions && expandMutation.data.suggestions.length > 0 ? (
              <>
                {/* Results header */}
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {expandMutation.data.totalSuggestions}
                          </div>
                          <div className="text-xs text-muted-foreground">拓展结果</div>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">全部类型</SelectItem>
                              <SelectItem value="broad">广泛匹配</SelectItem>
                              <SelectItem value="phrase">短语匹配</SelectItem>
                              <SelectItem value="exact">精准匹配</SelectItem>
                              <SelectItem value="long_tail">长尾词</SelectItem>
                              <SelectItem value="related">相关词</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyAllKeywords}>
                          <Copy className="h-4 w-4 mr-1" />
                          复制全部
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToCSV}>
                          <Download className="h-4 w-4 mr-1" />
                          导出CSV
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Results list */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredSuggestions.map((suggestion, index) => (
                    <Card key={index} className="glass-card hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium truncate">{suggestion.keyword}</span>
                              <TypeBadge type={suggestion.type} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {suggestion.reason}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span>
                                相关度: <span className="text-primary font-medium">{suggestion.relevance}%</span>
                              </span>
                              <span>
                                搜索量: <VolumeBadge volume={suggestion.searchVolume} />
                              </span>
                              <span>
                                竞争度: <VolumeBadge volume={suggestion.competition} />
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => copyKeyword(suggestion.keyword, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="glass-card h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>输入种子关键词和产品描述</p>
                  <p className="text-sm">AI将为您拓展相关关键词建议</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
