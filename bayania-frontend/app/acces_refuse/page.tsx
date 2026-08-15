import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccesRefusePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-6 text-center">
      <ShieldAlert size={40} className="mb-4 text-red-500" />
      <h1 className="mb-2 text-2xl font-extrabold text-slate-800">Accès refusé</h1>
      <p className="mb-6 max-w-md text-sm text-slate-500">
        Vous n&apos;avez pas les autorisations nécessaires pour accéder à cette page.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-bayan-darkBlue px-5 py-2.5 text-xs font-medium text-white hover:bg-blue-800"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}