import * as React from 'react';
import { TrendingUp, Sparkles, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Pie,
  PieChart,
  Line,
  LineChart,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

/* =========================================================================
   1. CHART AREA GRADIENT
   ========================================================================= */
export const areaChartData = [
  { month: 'January', quickCommerce: 186, wholesale: 80 },
  { month: 'February', quickCommerce: 305, wholesale: 200 },
  { month: 'March', quickCommerce: 237, wholesale: 120 },
  { month: 'April', quickCommerce: 173, wholesale: 190 },
  { month: 'May', quickCommerce: 289, wholesale: 130 },
  { month: 'June', quickCommerce: 314, wholesale: 140 },
];

const areaChartConfig = {
  quickCommerce: {
    label: 'Quick-Commerce Orders',
    color: 'var(--chart-1)',
  },
  wholesale: {
    label: 'Wholesale B2B Orders',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function ChartAreaGradient() {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-[#fd3706]" /> Area Chart - Stream Gradient
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Quick-Commerce (Blinkit/Zepto) vs Wholesale order velocity (last 6 months)
            </CardDescription>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#fd3706] border border-orange-200">
            Gradient Fill
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={areaChartConfig} className="h-60 w-full aspect-auto">
          <AreaChart
            data={areaChartData}
            margin={{
              top: 10,
              left: 10,
              right: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: '#71717a' }}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillQuickCommerce" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillWholesale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.7} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              dataKey="wholesale"
              type="natural"
              fill="url(#fillWholesale)"
              fillOpacity={0.4}
              stroke="var(--chart-2)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="quickCommerce"
              type="natural"
              fill="url(#fillQuickCommerce)"
              fillOpacity={0.4}
              stroke="var(--chart-1)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Trending up by 18.4% this quarter</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Jan - Jun 2026 Telemetry
        </div>
      </CardFooter>
    </Card>
  );
}

/* =========================================================================
   2. CHART RADAR GRID FILL
   ========================================================================= */
export const radarChartData = [
  { metric: 'Dispatch SLA', score: 98 },
  { metric: 'FEFO Rules', score: 100 },
  { metric: 'Fill Rate', score: 96 },
  { metric: 'Bin Utilization', score: 84 },
  { metric: 'Low Stock Buffer', score: 78 },
  { metric: 'OCR Accuracy', score: 99 },
];

const radarChartConfig = {
  score: {
    label: 'Operational Score (%)',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ChartRadarGridFill() {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" /> Radar Chart - Operational Health
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Multi-axis FMCG fulfillment, FEFO adherence, and OCR parsing score
            </CardDescription>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Grid Filled
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={radarChartConfig}
          className="mx-auto aspect-square max-h-[240px] w-full"
        >
          <RadarChart data={radarChartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <PolarGrid stroke="#e2e8f0" strokeDasharray="2 2" className="fill-[#fd3706]/10" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
            <Radar
              name="Operational Score"
              dataKey="score"
              fill="#fd3706"
              fillOpacity={0.45}
              stroke="#fd3706"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Composite Score: 92.5/100</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Tier-1 FMCG SLA Standard
        </div>
      </CardFooter>
    </Card>
  );
}

/* =========================================================================
   3. CHART PIE STACKED
   ========================================================================= */
const categoryInnerData = [
  { channel: 'Blinkit', volume: 340, fill: '#fd3706' },
  { channel: 'Zepto', volume: 280, fill: '#1c1b20' },
  { channel: 'Swiggy', volume: 220, fill: '#6366f1' },
  { channel: 'Direct', volume: 160, fill: '#10b981' },
];

const categoryOuterData = [
  { category: 'Confectionery', volume: 350, fill: '#fd3706' },
  { category: 'Staples', volume: 230, fill: '#1c1b20' },
  { category: 'Snacks & Packaged', volume: 220, fill: '#6366f1' },
  { category: 'Beverages', volume: 200, fill: '#10b981' },
];

const pieChartConfig = {
  volume: {
    label: 'Volume (Units)',
  },
  confectionery: {
    label: 'Confectionery',
    color: 'var(--chart-1)',
  },
  staples: {
    label: 'Staples',
    color: 'var(--chart-2)',
  },
  snacks: {
    label: 'Snacks',
    color: 'var(--chart-3)',
  },
  beverages: {
    label: 'Beverages',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

export function ChartPieStacked() {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <PieIcon className="h-4 w-4 text-indigo-500" /> Pie Chart - Stacked Dual Ring
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Inner ring: Channel Share (Blinkit/Zepto) • Outer ring: Category Mix
            </CardDescription>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Dual Stacked
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-0 flex-1">
        <ChartContainer
          config={pieChartConfig}
          className="mx-auto aspect-square max-h-[240px] w-full"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="channel"
                  labelKey="volume"
                  indicator="line"
                />
              }
            />
            {/* Inner Ring: Channel Share */}
            <Pie
              data={categoryInnerData}
              dataKey="volume"
              nameKey="channel"
              innerRadius={35}
              outerRadius={58}
              paddingAngle={2}
            />
            {/* Outer Ring: Category Breakdown */}
            <Pie
              data={categoryOuterData}
              dataKey="volume"
              nameKey="category"
              innerRadius={66}
              outerRadius={85}
              paddingAngle={2}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span className="h-2 w-2 rounded-full bg-[#fd3706]"></span>
          <span>Inner: Quick-Commerce • Outer: Categories</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          1,000 Total Units
        </div>
      </CardFooter>
    </Card>
  );
}

/* =========================================================================
   4. CHART LINE MULTIPLE
   ========================================================================= */
export const lineChartData = [
  { month: 'January', grossRevenue: 48, netCollected: 42 },
  { month: 'February', grossRevenue: 62, netCollected: 58 },
  { month: 'March', grossRevenue: 75, netCollected: 69 },
  { month: 'April', grossRevenue: 68, netCollected: 65 },
  { month: 'May', grossRevenue: 84, netCollected: 78 },
  { month: 'June', grossRevenue: 92, netCollected: 88 },
];

const lineChartConfig = {
  grossRevenue: {
    label: 'Gross Invoiced Revenue (₹k)',
    color: 'var(--chart-1)',
  },
  netCollected: {
    label: 'Net Cash Collected (₹k)',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function ChartLineMultiple() {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-emerald-500" /> Line Chart - Invoiced vs Collected
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Dual-stream trajectory tracking revenue realization & aging receivables
            </CardDescription>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Multi-Line
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={lineChartConfig} className="h-60 w-full aspect-auto">
          <LineChart
            data={lineChartData}
            margin={{
              top: 10,
              left: 10,
              right: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: '#71717a' }}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="grossRevenue"
              type="monotone"
              stroke="#fd3706"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#fd3706', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              dataKey="netCollected"
              type="monotone"
              stroke="#1c1b20"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#1c1b20', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Realization Rate: 95.6%</span>
        </div>
        <div className="text-[11px] text-slate-400">
          ₹92k Invoiced / ₹88k Collected (June)
        </div>
      </CardFooter>
    </Card>
  );
}
