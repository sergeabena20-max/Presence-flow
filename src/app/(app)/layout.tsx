import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !session.user.isActive) {
    redirect("/login");
  }

  return (
    <div className="flex">
      <Sidebar
        role={session.user.role}
        firstName={session.user.firstName}
        lastName={session.user.lastName}
      />
      <main className="min-h-screen flex-1 bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
