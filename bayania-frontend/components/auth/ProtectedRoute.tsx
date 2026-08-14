"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, usersApi } from "@/src/lib/api";

/**
 * Bloque l'accès aux pages qui l'utilisent tant que l'utilisateur n'a pas
 * un token JWT valide. Le token étant stocké en localStorage, ce contrôle
 * ne peut se faire que côté client (pas dans middleware.ts) : on affiche
 * donc `null` pendant la vérification, pour ne jamais laisser apparaître
 * le contenu protégé avant d'être sûr que l'utilisateur est autorisé.
 *
 * ⚠️ Ceci ne remplace pas la sécurité côté backend : chaque endpoint
 * protégé doit vérifier le JWT (et le rôle si besoin) indépendamment,
 * car un utilisateur peut toujours appeler l'API directement en
 * contournant complètement le frontend.
 */
export default function ProtectedRoute({
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

      // On ne se contente pas de vérifier la présence d'un token : on
      // confirme qu'il est encore valide auprès du backend (un token
      // expiré ou révoqué renverra 401 et sera nettoyé automatiquement
      // par `request()` dans src/lib/api.ts).
      try {
        await usersApi.getMe();
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