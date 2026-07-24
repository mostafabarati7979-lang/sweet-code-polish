import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

export type AdminUserRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  roles: ("admin" | "moderator" | "user")[];
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (usersErr) throw new Error(usersErr.message);

    const userIds = usersData.users.map((u) => u.id);
    const { data: rolesData, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    if (rolesErr) throw new Error(rolesErr.message);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const rolesByUser = new Map<string, AdminUserRow["roles"]>();
    for (const r of rolesData ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role as AdminUserRow["roles"][number]);
      rolesByUser.set(r.user_id, arr);
    }
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    return usersData.users
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        full_name: nameById.get(u.id) ?? null,
        roles: rolesByUser.get(u.id) ?? [],
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  });

const mutateSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "moderator", "user"]),
});

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => mutateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => mutateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.role === "admin") {
      throw new Error("You cannot revoke your own admin role");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
