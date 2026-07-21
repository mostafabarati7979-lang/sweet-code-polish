import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "پنل مدیریت — AI Motion Studio" },
      { name: "description", content: "پنل مدیریت پیشرفته استودیو تولید ویدیو هوش مصنوعی" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});
