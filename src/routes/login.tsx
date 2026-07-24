import { createFileRoute, Link, useNavigate, useRouter, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Mail, Lock, Eye, EyeOff, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: search.redirect ?? "/admin" });
    }
  },
  head: () => ({
    meta: [
      { title: "ورود به پنل مدیریت — AI Motion Studio" },
      { name: "description", content: "ورود امن به پنل مدیریت استودیو ویدیو هوش مصنوعی" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("ورود موفق");
        await router.invalidate();
        navigate({ to: search.redirect ?? "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("ثبت‌نام موفق — اکنون وارد شوید");
        setMode("signin");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطای ناشناخته";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-theme dark relative min-h-screen overflow-hidden" dir="rtl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#7C3AED]/40 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#A855F7]/30 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#6366F1]/30 blur-[120px]" />
      </div>

      <div className="relative grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary glow-purple">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              <span className="gradient-text">AI Motion Studio</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? "ورود به پنل مدیریت" : "ایجاد حساب کاربری"}
            </p>
          </div>

          <div className="glass rounded-3xl p-6 md:p-8">
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-lg py-2 text-sm transition ${
                  mode === "signin" ? "gradient-primary text-white" : "text-muted-foreground"
                }`}
              >
                ورود
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg py-2 text-sm transition ${
                  mode === "signup" ? "gradient-primary text-white" : "text-muted-foreground"
                }`}
              >
                ثبت‌نام
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="name" className="mb-1.5 text-xs">نام و نام خانوادگی</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 ltr:left-3" />
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-11 border-white/10 bg-white/5 ps-9"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="mb-1.5 text-xs">ایمیل</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 ltr:left-3" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 border-white/10 bg-white/5 ps-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pass" className="mb-1.5 text-xs">رمز عبور</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 ltr:left-3" />
                  <Input
                    id="pass"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="h-11 border-white/10 bg-white/5 px-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white rtl:left-3 ltr:right-3"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="h-11 w-full gradient-primary glow-purple text-white">
                {loading ? "در حال پردازش..." : mode === "signin" ? "ورود امن به پنل" : "ایجاد حساب"}
              </Button>

              <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> اتصال امن و رمزنگاری‌شده
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-white">بازگشت به وب‌سایت</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
