"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, usersApi } from "@/src/lib/api";

/**
 * Comme ProtectedRoute, mais vérifie en plus que l'utilisateur a le rôle
 * "admin" (via /users/me -> profil.type_profil). Utilisé pour tout ce qui
 * est sous /admin.
 *
 * ⚠️ Toujours pas une vraie sécurité à elle seule : FastAPI doit refuser
 * les endpoints /admin/* aux utilisateurs non-admin même si ce composant
 * est contourné (DevTools, appel direct à l'API, etc.).
 */
export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authorized">("checking");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const token = getToken();
      if (!token) {
        router.replace("/connexion");
        return;
      }

      try {
        const user = await usersApi.getMe();
        const role = user.profil?.type_profil;

        if (role !== "administrateur") {
          router.replace("/acces-refuse");
          return;
        }

        if (!cancelled) setStatus("authorized");
      } catch {
        if (!cancelled) router.replace("/connexion");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status !== "authorized") {
    return null;
  }

  return <>{children}</>;
}