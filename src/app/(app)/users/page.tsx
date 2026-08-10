import { redirect } from "next/navigation";
import { canManageUsers, getCurrentUserRole, listUsers } from "@/actions/users";
import { UsersManager } from "@/components/users/users-manager";

export default async function UsersPage() {
  const allowed = await canManageUsers();

  if (!allowed) {
    redirect("/dashboard");
  }

  const [role, { users }] = await Promise.all([
    getCurrentUserRole(),
    listUsers({ limit: 100 }),
  ]);

  return <UsersManager initialUsers={users} currentUserRole={role} />;
}
