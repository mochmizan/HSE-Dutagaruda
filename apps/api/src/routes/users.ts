import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/client.js";
import { member, organization, user } from "../db/auth-schema.js";
import { companyId, requireSession } from "../auth/middleware.js";
import { newId } from "./helpers.js";
import { z } from "zod";

const userBodySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi."),
  email: z.string().email("Surel tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export const usersApp = new Hono()
  .use("*", requireSession)

  .post("/", zValidator("json", userBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  const existing = await db.select().from(user).where(eq(user.email, body.email)).limit(1);
  if (existing.length > 0) {
    throw new HTTPException(409, { message: "Surel tersebut sudah terdaftar." });
  }
  const { auth } = await import("../auth/config.js");
  const created = await auth.api.signUpEmail({
    body: { name: body.name, email: body.email, password: body.password },
  });
  const createdUser = (created as { user?: { id: string } }).user;
  if (!createdUser) throw new HTTPException(500, { message: "Pembuatan pengguna gagal." });
  await db.insert(member).values({
    id: newId(),
    organizationId: owned,
    userId: createdUser.id,
    createdAt: new Date(),
  });
  const org = await db.select().from(organization).where(eq(organization.id, owned)).limit(1);
  if (org.length === 0) throw new HTTPException(404, { message: "Perusahaan tidak ditemukan." });
  return c.json({ id: createdUser.id, email: body.email, name: body.name }, 201);
});
