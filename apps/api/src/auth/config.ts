import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client.js";
import * as authSchema from "../db/auth-schema.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  // Asal mungkin: dev lokal + Tailnet (lihat TRUSTED_ORIGINS bila berbagi).
  // Contoh: TRUSTED_ORIGINS=http://mesin.tailnet.ts.net:5173,http://100.x.y.z:5173
  trustedOrigins: [
    "http://localhost:8080",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://desktop-6srl494.tail2e9cdf.ts.net:5173",
    "https://desktop-6srl494.tail2e9cdf.ts.net",
    "http://100.116.194.92:5173",
    ...(process.env.TRUSTED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
  ],
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: { enabled: true },
  session: { expiresIn: 60 * 60 * 24 * 7 },
  plugins: [organization()],
});
