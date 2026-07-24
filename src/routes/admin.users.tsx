import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, ShieldOff, UserCog, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useLang } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import {
  listAdminUsers,
  grantRole,
  revokeRole,
  type AdminUserRow,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "مدیریت کاربران — AI Motion Studio" },
      { name: "description", content: "اعطا و لغو نقش‌های مدیریتی کاربران" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const [lang] = useLang();
  const isRTL = lang === "fa";
  const t = (fa: string, en: string) => (isRTL ? fa : en);

  const list = useServerFn(listAdminUsers);
  const grant = useServerFn(grantRole);
  const revoke = useServerFn(revokeRole);
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
  });

  const grantMut = useMutation({
    mutationFn: (userId: string) => grant({ data: { userId, role: "admin" } }),
    onSuccess: () => {
      toast.success(t("نقش مدیر اعطا شد", "Admin role granted"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (userId: string) => revoke({ data: { userId, role: "admin" } }),
    onSuccess: () => {
      toast.success(t("نقش مدیر لغو شد", "Admin role revoked"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const rows = usersQ.data ?? [];
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (u) =>
        u.email.toLowerCase().includes(s) ||
        (u.full_name ?? "").toLowerCase().includes(s),
    );
  }, [usersQ.data, q]);

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={t("مدیریت کاربران و نقش‌ها", "Users & Roles")}
        subtitle={t(
          "اعطا یا لغو دسترسی مدیریت برای کاربران",
          "Grant or revoke admin access for users",
        )}
      />

      <div className="glass rounded-2xl p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary glow-purple">
            <UserCog className="h-5 w-5 text-white" />
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("جستجو بر اساس ایمیل یا نام...", "Search by email or name...")}
            className="h-10 max-w-md border-white/10 bg-white/5"
          />
          <div className="ms-auto text-xs text-muted-foreground">
            {t("مجموع", "Total")}: {usersQ.data?.length ?? 0}
          </div>
        </div>

        {usersQ.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            {t("در حال بارگذاری...", "Loading...")}
          </div>
        ) : usersQ.isError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
            {(usersQ.error as Error).message}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-muted-foreground">
                  <th className="py-3 text-start font-medium">{t("کاربر", "User")}</th>
                  <th className="py-3 text-start font-medium">{t("نقش‌ها", "Roles")}</th>
                  <th className="py-3 text-start font-medium">{t("آخرین ورود", "Last sign-in")}</th>
                  <th className="py-3 text-end font-medium">{t("اقدامات", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    lang={lang}
                    onGrant={() => grantMut.mutate(u.id)}
                    onRevoke={() => revokeMut.mutate(u.id)}
                    busy={
                      (grantMut.isPending && grantMut.variables === u.id) ||
                      (revokeMut.isPending && revokeMut.variables === u.id)
                    }
                  />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                      {t("کاربری یافت نشد", "No users found")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({
  user,
  lang,
  onGrant,
  onRevoke,
  busy,
}: {
  user: AdminUserRow;
  lang: "fa" | "en";
  onGrant: () => void;
  onRevoke: () => void;
  busy: boolean;
}) {
  const isRTL = lang === "fa";
  const t = (fa: string, en: string) => (isRTL ? fa : en);
  const isAdmin = user.roles.includes("admin");

  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
      <td className="py-3 pe-4">
        <div className="font-medium text-foreground">{user.full_name || user.email.split("@")[0]}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </td>
      <td className="py-3 pe-4">
        <div className="flex flex-wrap gap-1">
          {user.roles.length === 0 && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {user.roles.map((r) => (
            <Badge
              key={r}
              variant="outline"
              className={
                r === "admin"
                  ? "border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#C084FC]"
                  : r === "moderator"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-white/10 bg-white/5 text-muted-foreground"
              }
            >
              {r}
            </Badge>
          ))}
        </div>
      </td>
      <td className="py-3 pe-4 text-xs text-muted-foreground">
        {user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleString(isRTL ? "fa-IR" : "en-US")
          : "—"}
      </td>
      <td className="py-3 text-end">
        {isAdmin ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={onRevoke}
            className="border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/10"
          >
            {busy ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="me-1.5 h-3.5 w-3.5" />}
            {t("لغو مدیر", "Revoke admin")}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={busy}
            onClick={onGrant}
            className="gradient-primary text-white"
          >
            {busy ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <Shield className="me-1.5 h-3.5 w-3.5" />}
            {t("اعطای مدیر", "Grant admin")}
          </Button>
        )}
      </td>
    </tr>
  );
}
