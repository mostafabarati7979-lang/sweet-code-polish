import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Wallet, ShoppingCart, Users, TrendingUp, Sparkles, Server, Activity, Zap,
  Clock, Star, HardDrive, Signal,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { useLang } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  fetchDashboardStats,
  fetchRecentOrders,
  STATUS_LABEL,
  STATUS_STYLES,
} from "@/lib/admin-data";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const revenueData = [
  { m: "فروردین", en: "Jan", rev: 42, exp: 22 },
  { m: "اردیبهشت", en: "Feb", rev: 55, exp: 27 },
  { m: "خرداد", en: "Mar", rev: 61, exp: 30 },
  { m: "تیر", en: "Apr", rev: 78, exp: 34 },
  { m: "مرداد", en: "May", rev: 92, exp: 40 },
  { m: "شهریور", en: "Jun", rev: 118, exp: 46 },
  { m: "مهر", en: "Jul", rev: 134, exp: 52 },
  { m: "آبان", en: "Aug", rev: 156, exp: 58 },
  { m: "آذر", en: "Sep", rev: 172, exp: 61 },
  { m: "دی", en: "Oct", rev: 198, exp: 68 },
  { m: "بهمن", en: "Nov", rev: 224, exp: 74 },
  { m: "اسفند", en: "Dec", rev: 268, exp: 82 },
];

const trafficData = [
  { name: "Direct", value: 42 },
  { name: "Instagram", value: 28 },
  { name: "Google", value: 18 },
  { name: "LinkedIn", value: 8 },
  { name: "Other", value: 4 },
];

const aiUsage = [
  { d: "شنبه", en: "Sat", runway: 12, kling: 8, veo: 5, eleven: 14 },
  { d: "یکشنبه", en: "Sun", runway: 18, kling: 11, veo: 7, eleven: 16 },
  { d: "دوشنبه", en: "Mon", runway: 22, kling: 14, veo: 9, eleven: 20 },
  { d: "سه‌شنبه", en: "Tue", runway: 27, kling: 17, veo: 12, eleven: 22 },
  { d: "چهارشنبه", en: "Wed", runway: 31, kling: 20, veo: 14, eleven: 26 },
  { d: "پنجشنبه", en: "Thu", runway: 24, kling: 15, veo: 10, eleven: 21 },
  { d: "جمعه", en: "Fri", runway: 19, kling: 12, veo: 8, eleven: 18 },
];

const PIE_COLORS = ["#7C3AED", "#A855F7", "#C084FC", "#6366F1", "#EC4899"];

function DashboardPage() {
  const [lang] = useLang();
  const isRTL = lang === "fa";
  const t = (fa: string, en: string) => (isRTL ? fa : en);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });
  const { data: recentOrders = [] } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: () => fetchRecentOrders(5),
  });

  const fmt = (n: number) => Number(n).toLocaleString();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("داشبورد اصلی", "Main Dashboard")}
        subtitle={t("خلاصه‌ای زنده از عملکرد کسب‌وکار شما", "A live overview of your business performance")}
        actions={
          <Button variant="outline" className="border-white/10 bg-white/5">
            {t("خروجی PDF", "Export PDF")}
          </Button>
        }
      />

      {/* Stat cards — live from database */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label={t("درآمد کل", "Total Revenue")} value={stats?.totalRevenue ?? 0} suffix={t(" ﷼", " IRR")} icon={Wallet} accent="purple" />
        <StatCard label={t("درآمد این ماه", "This Month")} value={stats?.monthRevenue ?? 0} suffix={t(" ﷼", " IRR")} icon={TrendingUp} accent="violet" />
        <StatCard label={t("سفارش‌های فعال", "Active Orders")} value={stats?.activeOrders ?? 0} icon={ShoppingCart} accent="pink" />
        <StatCard label={t("کل مشتریان", "Total Customers")} value={stats?.totalCustomers ?? 0} icon={Users} accent="blue" />
        <StatCard label={t("در حال بررسی", "Reviewing")} value={stats?.byStatus.reviewing ?? 0} icon={Clock} accent="pink" />
        <StatCard label={t("در حال انجام", "In Progress")} value={stats?.byStatus.in_progress ?? 0} icon={Activity} accent="violet" />
        <StatCard label={t("انجام شده", "Completed")} value={stats?.byStatus.completed ?? 0} icon={Zap} accent="purple" />
        <StatCard label={t("امتیاز میانگین CRM", "Avg. CRM Score")} value={stats?.avgScore ?? 0} suffix="/100" icon={Star} accent="blue" />
      </div>


      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="glass rounded-2xl p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{t("درآمد در برابر هزینه", "Revenue vs Expenses")}</h3>
              <p className="text-xs text-muted-foreground">{t("۱۲ ماه اخیر — میلیون ﷼", "Last 12 months — millions IRR")}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#C084FC]" />{t("درآمد", "Revenue")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6366F1]" />{t("هزینه", "Expenses")}</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C084FC" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey={isRTL ? "m" : "en"} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(15,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="rev" stroke="#C084FC" strokeWidth={2} fill="url(#gRev)" />
                <Area type="monotone" dataKey="exp" stroke="#6366F1" strokeWidth={2} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-base font-semibold">{t("منابع ترافیک", "Traffic Sources")}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{t("۳۰ روز اخیر", "Last 30 days")}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trafficData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {trafficData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(15,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {trafficData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  {s.name}
                </span>
                <span className="font-semibold">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI usage + system */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="glass rounded-2xl p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{t("مصرف موتورهای AI", "AI Engine Usage")}</h3>
              <p className="text-xs text-muted-foreground">{t("۷ روز اخیر — تعداد رندرها", "Last 7 days — render count")}</p>
            </div>
            <Badge className="border-[#7C3AED]/40 bg-[#7C3AED]/20 text-[#C084FC]">Live</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiUsage}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey={isRTL ? "d" : "en"} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(15,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="runway" stackId="a" fill="#7C3AED" radius={[0, 0, 0, 0]} />
                <Bar dataKey="kling" stackId="a" fill="#A855F7" />
                <Bar dataKey="veo" stackId="a" fill="#C084FC" />
                <Bar dataKey="eleven" stackId="a" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 text-base font-semibold">{t("سلامت سیستم", "System Health")}</h3>
          <div className="space-y-4">
            {[
              { label: t("سرور اصلی", "Main Server"), val: 82, icon: Server, tone: "ok" },
              { label: t("پایگاه داده", "Database"), val: 61, icon: HardDrive, tone: "ok" },
              { label: t("پهنای باند", "Bandwidth"), val: 44, icon: Signal, tone: "ok" },
              { label: t("فضای ذخیره‌سازی", "Storage"), val: 76, icon: HardDrive, tone: "warn" },
              { label: t("صف رندر AI", "AI Render Queue"), val: 28, icon: Activity, tone: "ok" },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <r.icon className="h-3.5 w-3.5 text-[#C084FC]" />
                    {r.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{r.val}%</span>
                </div>
                <Progress value={r.val} className="h-1.5 bg-white/5 [&>div]:gradient-primary" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">{t("آخرین سفارش‌ها", "Recent Orders")}</h3>
            <p className="text-xs text-muted-foreground">{t("۵ سفارش اخیر", "5 latest orders")}</p>
          </div>
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm" className="text-[#C084FC]">{t("مشاهده همه", "View all")}</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-3 text-start font-medium">{t("شناسه", "ID")}</th>
                <th className="pb-3 text-start font-medium">{t("مشتری", "Customer")}</th>
                <th className="pb-3 text-start font-medium">{t("پکیج", "Package")}</th>
                <th className="pb-3 text-start font-medium">{t("وضعیت", "Status")}</th>
                <th className="pb-3 text-start font-medium">{t("پیشرفت", "Progress")}</th>
                <th className="pb-3 text-end font-medium">{t("مبلغ", "Amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOrders.map((o) => {
                const cust = isRTL ? (o.customer?.name_fa ?? o.customer?.name ?? "—") : (o.customer?.name ?? "—");
                const pkg = isRTL ? (o.package?.name_fa ?? "—") : (o.package?.name_en ?? "—");
                return (
                  <tr key={o.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="py-3 font-mono text-xs text-[#C084FC]">#{o.order_code}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-white/10 text-[10px]">{(o.customer?.name ?? "?").slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        {cust}
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{pkg}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={`text-xs ${STATUS_STYLES[o.status]}`}>
                        {t(STATUS_LABEL[o.status].fa, STATUS_LABEL[o.status].en)}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={o.progress} className="h-1.5 w-24 bg-white/5 [&>div]:gradient-primary" />
                        <span className="text-xs tabular-nums text-muted-foreground">{o.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-end font-semibold tabular-nums">
                      {fmt(Number(o.amount))} <span className="text-xs text-muted-foreground">{t("﷼", "IRR")}</span>
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">{t("سفارشی یافت نشد", "No orders")}</td></tr>
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
