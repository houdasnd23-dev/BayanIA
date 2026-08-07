/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // Next.js App Router injecte des scripts inline pour l'hydratation RSC (self.__next_f.push) — limitation connue du framework, cf. https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy pour une solution par nonce si besoin plus tard
              "style-src 'self' 'unsafe-inline'", // Next.js injecte du CSS inline au build ; difficile à éviter sans config avancée
              "img-src 'self' data:",
              "font-src 'self' data:",
              "connect-src 'self' https://bayania-production.up.railway.app",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;