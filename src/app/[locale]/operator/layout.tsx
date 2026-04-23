import { AppShell } from "@/components/shared/app-shell";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
