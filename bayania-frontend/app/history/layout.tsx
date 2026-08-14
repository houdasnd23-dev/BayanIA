import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}