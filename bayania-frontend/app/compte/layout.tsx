import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}