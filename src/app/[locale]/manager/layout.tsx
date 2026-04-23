import { AppShell } from "@/components/shared/app-shell";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
