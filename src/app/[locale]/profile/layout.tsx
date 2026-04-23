import { AppShell } from "@/components/shared/app-shell";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
