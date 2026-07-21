import { createFileRoute } from "@tanstack/react-router";
import { Construction, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useLang, NAV } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/$section")({
  component: SectionPlaceholder,
});

function SectionPlaceholder() {
  const { section } = Route.useParams();
  const [lang] = useLang();
  const isRTL = lang === "fa";
  const t = (fa: string, en: string) => (isRTL ? fa : en);

  const path = `/admin/${section}`;
  const found = NAV.flatMap((g) => g.items).find((i) => i.to === path);
  const title = found ? (isRTL ? found.fa : found.en) : section;

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={t("این ماژول در حال توسعه است", "This module is under active development")} />

      <div className="glass mx-auto grid max-w-2xl place-items-center rounded-3xl p-12 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl gradient-primary glow-purple">
          <Construction className="h-10 w-10 text-white" />
        </div>
        <h2 className="mt-6 text-2xl font-bold gradient-text">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t(
            "اسکلت این بخش آماده است؛ به‌زودی با جدول‌های تعاملی، نمودارها و اکشن‌های کامل تکمیل می‌شود.",
            "The skeleton for this section is ready — interactive tables, charts and full actions are coming soon.",
          )}
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="border-white/10 bg-white/5">{t("مستندات", "Docs")}</Button>
          <Button className="gradient-primary text-white">
            <Sparkles className="me-2 h-4 w-4" />
            {t("درخواست اولویت", "Request priority")}
          </Button>
        </div>
      </div>
    </div>
  );
}
