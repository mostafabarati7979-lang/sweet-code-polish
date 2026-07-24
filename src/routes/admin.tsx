import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    const { data: isAdmin, error } = await supabase.rpc("has_role", {
      _user_id: sess.session.user.id,
      _role: "admin",
    });
    if (error || !isAdmin) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  head: () => ({
    meta: [
      { title: "پنل مدیریت — AI Motion Studio" },
      { name: "description", content: "پنل مدیریت پیشرفته استودیو تولید ویدیو هوش مصنوعی" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});
