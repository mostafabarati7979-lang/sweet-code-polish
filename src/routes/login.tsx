import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Mail, Lock, Eye, EyeOff, Fingerprint, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/login")({
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
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/admin" }), 700);
  };

  return (
    <div className="admin-theme dark relative min-h-screen overflow-hidden" dir="rtl">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#7C3AED]/40 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#A855F7]/30 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#6366F1]/30 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />
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
            <p className="mt-1 text-sm text-muted-foreground">ورود به پنل مدیریت</p>
          </div>

          <div className="glass rounded-3xl p-6 md:p-8">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-1.5 text-xs">ایمیل</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 ltr:left-3" />
                  <Input id="email" type="email" defaultValue="admin@aimotion.studio" className="h-11 border-white/10 bg-white/5 ps-9" />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="pass" className="text-xs">رمز عبور</Label>
                  <a href="#" className="text-xs text-[#C084FC] hover:underline">فراموشی رمز؟</a>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 ltr:left-3" />
                  <Input
                    id="pass"
                    type={showPass ? "text" : "password"}
                    defaultValue="••••••••"
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

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox defaultChecked />
                <span>مرا به خاطر بسپار</span>
              </label>

              <Button type="submit" disabled={loading} className="h-11 w-full gradient-primary glow-purple text-white">
                {loading ? "در حال ورود..." : "ورود امن به پنل"}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                <div className="relative text-center"><span className="bg-transparent px-2 text-xs text-muted-foreground">یا</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="h-11 border-white/10 bg-white/5">
                  <svg className="me-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.65 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.85 4.15 14.65 3.2 12 3.2 6.9 3.2 2.75 7.35 2.75 12.45S6.9 21.7 12 21.7c6.93 0 9.35-4.87 9.35-8.35 0-.56-.07-.98-.15-1.25z"/></svg>
                  Google
                </Button>
                <Button type="button" variant="outline" className="h-11 border-white/10 bg-white/5">
                  <Fingerprint className="me-2 h-4 w-4" />
                  بیومتریک
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> احراز هویت دو مرحله‌ای فعال است
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-white">بازگشت به وب‌سایت</Link>
            {" · "}
            <a href="#" className="hover:text-white">حریم خصوصی</a>
          </p>
        </div>
      </div>
    </div>
  );
}
