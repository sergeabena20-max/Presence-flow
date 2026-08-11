import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { listAdminsWithPermissions } from "@/actions/permissions";
import { PermissionsManager } from "@/components/users/permissions-manager";

export default async function PermissionsPage() {
  try {
    await requireRole("SUPER_ADMIN");
  } catch {
    redirect("/dashboard");
  }

  const admins = await listAdminsWithPermissions();

  return <PermissionsManager initialAdmins={admins} />;
}
