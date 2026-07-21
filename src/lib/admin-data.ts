import { supabase } from "@/integrations/supabase/client";

export type OrderStatus = "reviewing" | "in_progress" | "completed";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";
export type OrderPriority = "low" | "medium" | "high";
export type CustomerTag = "new" | "loyal" | "vip";

export const STATUS_LABEL: Record<OrderStatus, { fa: string; en: string }> = {
  reviewing: { fa: "در حال بررسی", en: "Reviewing" },
  in_progress: { fa: "در حال انجام", en: "In Progress" },
  completed: { fa: "انجام شده", en: "Completed" },
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  reviewing: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  in_progress: "border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#C084FC]",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

export const STATUS_ORDER: OrderStatus[] = ["reviewing", "in_progress", "completed"];

export interface OrderRow {
  id: string;
  order_code: string;
  status: OrderStatus;
  priority: OrderPriority;
  progress: number;
  amount: number;
  payment_status: PaymentStatus;
  deadline: string | null;
  created_at: string;
  customer: { id: string; name: string; name_fa: string | null } | null;
  package: { code: string; name_fa: string; name_en: string } | null;
  assignee: { id: string; name: string; name_fa: string | null } | null;
}

export interface CustomerRow {
  id: string;
  name: string;
  name_fa: string | null;
  industry: string | null;
  email: string | null;
  phone: string | null;
  tag: CustomerTag;
  score: number;
  ltv: number;
  last_activity_at: string | null;
}

const ORDER_SELECT =
  "id, order_code, status, priority, progress, amount, payment_status, deadline, created_at, customer:customers(id,name,name_fa), package:packages(code,name_fa,name_en), assignee:employees(id,name,name_fa)";

export async function fetchOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}

export async function fetchRecentOrders(limit = 5): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function fetchCustomers(): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("ltv", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerRow[];
}

export interface DashboardStats {
  totalRevenue: number;
  monthRevenue: number;
  activeOrders: number;
  totalCustomers: number;
  vipCustomers: number;
  avgScore: number;
  byStatus: Record<OrderStatus, number>;
  avgLtv: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [ordersRes, custRes] = await Promise.all([
    supabase.from("orders").select("status, amount, payment_status, created_at"),
    supabase.from("customers").select("tag, score, ltv"),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  if (custRes.error) throw custRes.error;

  const orders = ordersRes.data ?? [];
  const customers = custRes.data ?? [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const byStatus: Record<OrderStatus, number> = { reviewing: 0, in_progress: 0, completed: 0 };
  let totalRevenue = 0;
  let monthRevenue = 0;
  for (const o of orders) {
    byStatus[o.status as OrderStatus] = (byStatus[o.status as OrderStatus] ?? 0) + 1;
    if (o.payment_status === "paid" || o.payment_status === "partial") {
      totalRevenue += Number(o.amount ?? 0);
      if (new Date(o.created_at) >= monthStart) monthRevenue += Number(o.amount ?? 0);
    }
  }

  const vip = customers.filter((c) => c.tag === "vip").length;
  const avgScore = customers.length
    ? Math.round(customers.reduce((s, c) => s + Number(c.score ?? 0), 0) / customers.length)
    : 0;
  const avgLtv = customers.length
    ? Math.round(customers.reduce((s, c) => s + Number(c.ltv ?? 0), 0) / customers.length)
    : 0;

  return {
    totalRevenue,
    monthRevenue,
    activeOrders: byStatus.reviewing + byStatus.in_progress,
    totalCustomers: customers.length,
    vipCustomers: vip,
    avgScore,
    byStatus,
    avgLtv,
  };
}
