/*
 * Design Style: Data Dashboard Aesthetic
 * - Deep dark background with electric blue accents
 * - Glassmorphism card effects
 * - Color system matching ad optimization types
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Bot,
  Upload,
  BarChart3,
  Search,
  Link2,
  Clock,
  FileSpreadsheet,
  Terminal,
  Settings,
  Rocket,
  Copy,
  Check,
  ChevronRight,
  Zap,
  TrendingUp,
  TrendingDown,
  Ban,
  Minus,
  HelpCircle,
  FolderTree,
  Download,
  Play,
  Server,
  Key,
  Mail,
  Github,
  ArrowRight,
  Sparkles,
  Database,
  RefreshCw,
  FileCode,
  BookOpen,
  Shield,
  Globe,
  Package
} from "lucide-react";

// Code block component with copy functionality
function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("代码已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="code-block text-sm overflow-x-auto">
        <code className="text-emerald-400">{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// Feature card component
function FeatureCard({ icon: Icon, title, description, color }: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="glass-card h-full hover:border-primary/50 transition-all duration-300">
        <CardHeader>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-muted-foreground">{description}</CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Optimization type badge
function OptimizationBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    increase: { label: "提高竞价", className: "badge-increase", icon: TrendingUp },
    decrease: { label: "降低竞价", className: "badge-decrease", icon: TrendingDown },
    negative: { label: "否定建议", className: "badge-negative", icon: Ban },
    reasonable: { label: "保持现状", className: "badge-reasonable", icon: Minus },
    pending: { label: "待定", className: "badge-pending", icon: HelpCircle },
  };

  const { label, className, icon: Icon } = config[type] || config.pending;

  return (
    <Badge variant="outline" className={`${className} flex items-center gap-1.5 px-3 py-1`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

// Navigation sidebar
function Sidebar({ activeSection, onSectionChange }: {
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  const sections = [
    { id: "overview", label: "功能概览", icon: Sparkles },
    { id: "features", label: "功能特点", icon: Zap },
    { id: "structure", label: "目录结构", icon: FolderTree },
    { id: "install", label: "安装部署", icon: Download },
    { id: "usage", label: "使用方法", icon: Play },
    { id: "config", label: "配置参数", icon: Settings },
    { id: "api", label: "领星API接入", icon: Database },
    { id: "report", label: "输出报告", icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-8">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">文档导航</h2>
              <p className="text-xs text-muted-foreground">快速跳转</p>
            </div>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  activeSection === section.id
                    ? "bg-primary/20 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
                {activeSection === section.id && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

// Main content sections
function OverviewSection() {
  return (
    <section id="overview" className="scroll-mt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-purple-500/10 p-8 md:p-12 mb-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary/30 flex items-center justify-center animate-pulse-glow">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1 text-xs">v1.0.0</Badge>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  亚马逊广告优化智能体
                </h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              一个自动化的亚马逊广告优化工具，可以分析搜索词报告、拓展关键词、优化产品链接，并生成带颜色标注的Excel优化报告。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/analyze">
                <Button className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                  <Upload className="h-4 w-4" />
                  在线分析
                </Button>
              </Link>
              <Link href="/keywords">
                <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-500/90 hover:to-teal-600/90">
                  <Search className="h-4 w-4" />
                  关键词拓展
                </Button>
              </Link>
              <Button className="gap-2" variant="outline">
                <Download className="h-4 w-4" />
                下载智能体
              </Button>
              <Button variant="outline" className="gap-2">
                <Github className="h-4 w-4" />
                查看源码
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "支持数据量", value: "10万+", icon: Database },
            { label: "分析维度", value: "20+", icon: BarChart3 },
            { label: "自动化任务", value: "每日", icon: RefreshCw },
            { label: "报告格式", value: "Excel", icon: FileSpreadsheet },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card text-center p-4">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: BarChart3,
      title: "广告数据分析",
      description: "基于搜索词报告分析广告效果，自动生成优化建议",
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      icon: Search,
      title: "关键词拓展",
      description: "使用AI自动拓展相关关键词，发现新的投放机会",
      color: "bg-emerald-500/20 text-emerald-400",
    },
    {
      icon: Link2,
      title: "链接优化",
      description: "分析产品Listing并提供标题、五点描述、关键词优化建议",
      color: "bg-purple-500/20 text-purple-400",
    },
    {
      icon: Database,
      title: "领星数据接入",
      description: "支持从领星ERP API自动获取广告数据",
      color: "bg-amber-500/20 text-amber-400",
    },
    {
      icon: Clock,
      title: "定时自动运行",
      description: "每天定时执行优化任务，生成Excel报告",
      color: "bg-rose-500/20 text-rose-400",
    },
    {
      icon: FileSpreadsheet,
      title: "Excel报告",
      description: "生成带颜色标注的专业优化报告，一目了然",
      color: "bg-cyan-500/20 text-cyan-400",
    },
  ];

  return (
    <section id="features" className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">功能特点</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <FeatureCard {...feature} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function StructureSection() {
  const structure = `amazon_ad_agent/
├── config.py           # 配置文件
├── lingxing_client.py  # 领星API客户端
├── ad_analyzer.py      # 广告分析模块
├── keyword_expander.py # 关键词拓展模块
├── listing_optimizer.py# 链接优化模块
├── report_generator.py # 报告生成模块
├── agent.py            # 主智能体模块
├── scheduler.py        # 定时任务调度器
├── requirements.txt    # 依赖包列表
├── README.md           # 使用说明
├── reports/            # 报告输出目录
└── logs/               # 日志目录`;

  return (
    <section id="structure" className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <FolderTree className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">目录结构</h2>
      </div>
      <Card className="glass-card">
        <CardContent className="p-0">
          <CodeBlock code={structure} language="text" />
        </CardContent>
      </Card>
    </section>
  );
}

function InstallSection() {
  return (
    <section id="install" className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">安装部署</h2>
      </div>

      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</span>
              安装依赖包
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock code="pip install -r requirements.txt" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">2</span>
              配置领星API凭证
            </CardTitle>
            <CardDescription>编辑 config.py 文件，填入您的领星API凭证</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={`LINGXING_APP_ID = "您的AppID"
LINGXING_APP_SECRET = "您的AppSecret"`} language="python" />
            <p className="text-sm text-muted-foreground mt-4">或者设置环境变量：</p>
            <CodeBlock code={`export LINGXING_APP_ID="您的AppID"
export LINGXING_APP_SECRET="您的AppSecret"`} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function UsageSection() {
  return (
    <section id="usage" className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Play className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">使用方法</h2>
      </div>

      <Tabs defaultValue="cli" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="cli">命令行</TabsTrigger>
          <TabsTrigger value="python">Python代码</TabsTrigger>
          <TabsTrigger value="schedule">定时任务</TabsTrigger>
        </TabsList>

        <TabsContent value="cli">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">命令行使用</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">分析本地Excel文件：</p>
                <CodeBlock code="python agent.py -f /path/to/search_terms_report.xlsx" />
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">从领星获取数据并分析：</p>
                <CodeBlock code="python agent.py --days 30" />
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">启动定时任务：</p>
                <CodeBlock code="python scheduler.py" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="python">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Python代码调用</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={`from agent import AmazonAdAgent

# 初始化智能体
agent = AmazonAdAgent()

# 分析本地文件
report_path = agent.analyze_file('/path/to/report.xlsx')

# 运行每日优化
report_path = agent.run_daily_optimization(days=30)

# 拓展关键词
keywords = agent.expand_keywords_for_product(
    ['magnesium gummies', 'magnesium supplement'],
    '镁软糖保健品'
)

# 优化链接
listing_data = {
    'title': '产品标题',
    'bullet_points': ['卖点1', '卖点2'],
    'keywords': ['关键词1', '关键词2']
}
suggestions = agent.optimize_listing(listing_data)`} language="python" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">定时任务配置</CardTitle>
              <CardDescription>默认每天早上8:00运行，可在 config.py 中修改</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={`SCHEDULE_HOUR = 8
SCHEDULE_MINUTE = 0`} language="python" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ConfigSection() {
  const configs = [
    { param: "TARGET_ACOS_INDEX", default: "1.0", desc: "目标ACOS指数 (0.2~2.0)" },
    { param: "EXACT_NEGATIVE_LV", default: "1.0", desc: "精准否定级别" },
    { param: "PHRASE_NEGATIVE_LV", default: "5.0", desc: "短语否定级别" },
    { param: "RELIABILITY", default: "1.0", desc: "可靠性级别" },
    { param: "INCREASE_BID_LV", default: "0.7", desc: "提高竞价级别" },
    { param: "DECREASE_BID_LV", default: "1.4", desc: "降低竞价级别" },
  ];

  return (
    <section id="config" className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">配置参数</h2>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-white/5">
                  <th className="text-left p-4 font-medium">参数</th>
                  <th className="text-left p-4 font-medium">默认值</th>
                  <th className="text-left p-4 font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config, i) => (
                  <tr key={config.param} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                    <td className="p-4">
                      <code className="text-primary text-sm">{config.param}</code>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{config.default}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{config.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ApiSection() {
  return (
    <section id="api" className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">领星API接入</h2>
      </div>

      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <h4 className="font-medium mb-1">登录领星ERP</h4>
              <p className="text-sm text-muted-foreground">
                进入【设置】&gt;【业务配置】&gt;【全局】&gt;【开放接口】
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <h4 className="font-medium mb-1">获取API凭证</h4>
              <p className="text-sm text-muted-foreground">
                获取AppID和AppSecret
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <h4 className="font-medium mb-1">配置IP白名单</h4>
              <p className="text-sm text-muted-foreground">
                添加运行服务器的公网IP
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-primary">4</span>
            </div>
            <div>
              <h4 className="font-medium mb-1">填入凭证</h4>
              <p className="text-sm text-muted-foreground">
                将凭证填入 config.py 或设置环境变量
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ReportSection() {
  const sheets = [
    { name: "优化建议汇总", desc: "整体统计和颜色图例" },
    { name: "需优化搜索词", desc: "需要采取行动的搜索词" },
    { name: "提高竞价", desc: "建议提高竞价的搜索词" },
    { name: "降低竞价", desc: "建议降低竞价的搜索词" },
    { name: "否定建议", desc: "建议否定的搜索词" },
    { name: "全部数据", desc: "完整分析结果" },
    { name: "关键词拓展", desc: "AI拓展的关键词建议（如有）" },
    { name: "链接优化", desc: "Listing优化建议（如有）" },
  ];

  return (
    <section id="report" className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">输出报告</h2>
      </div>

      <div className="space-y-6">
        {/* Optimization types */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">优化建议类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <OptimizationBadge type="increase" />
              <OptimizationBadge type="decrease" />
              <OptimizationBadge type="negative" />
              <OptimizationBadge type="reasonable" />
              <OptimizationBadge type="pending" />
            </div>
          </CardContent>
        </Card>

        {/* Report sheets */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">报告包含的Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {sheets.map((sheet, i) => (
                <div
                  key={sheet.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{sheet.name}</div>
                    <div className="text-xs text-muted-foreground">{sheet.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Main Home component
export default function Home() {
  const [activeSection, setActiveSection] = useState("overview");

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen animated-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold hidden sm:inline">亚马逊广告优化智能体</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => toast.info("功能即将上线")}>
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">API文档</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => toast.info("功能即将上线")}>
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8">
        <div className="flex gap-8">
          <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />

          <div className="flex-1 min-w-0 space-y-12">
            <OverviewSection />
            <FeaturesSection />
            <StructureSection />
            <InstallSection />
            <UsageSection />
            <ConfigSection />
            <ApiSection />
            <ReportSection />

            {/* Footer note */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">注意事项</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 首次使用前请确保已正确配置领星API凭证</li>
                      <li>• 确保服务器IP已添加到领星白名单</li>
                      <li>• 报告文件保存在 reports/ 目录下</li>
                      <li>• 日志文件保存在 logs/ 目录下</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                亚马逊广告优化智能体 © 2026
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>如有问题，请联系开发团队</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
