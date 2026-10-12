import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { member, organization } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { auth } from "./config.js";
import { and, eq } from "drizzle-orm";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

export const requireSession = createMiddleware<{
  Variables: { user: SessionUser };
}>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || !session.session.activeOrganizationId) {
    throw new HTTPException(401, { message: "Sesi tidak valid. Masuk terlebih dahulu." });
  }
  const rows = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, session.session.activeOrganizationId),
      ),
    )
    .limit(1);
  const org = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, session.session.activeOrganizationId))
    .limit(1);
  if (rows.length === 0 || org.length === 0) {
    throw new HTTPException(401, { message: "Keanggotaan perusahaan tidak ditemukan." });
  }
  c.set("user", {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: rows[0].role,
    companyId: org[0].id,
  });
  await next();
});

export function companyId(c: { get(key: string): SessionUser }): string {
  return (c.get("user") as SessionUser).companyId;
}
