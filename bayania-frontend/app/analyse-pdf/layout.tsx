import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AnalysePdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}