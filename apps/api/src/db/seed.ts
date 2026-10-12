import { hashPassword } from "better-auth/crypto";
import { createId } from "@paralleldrive/cuid2";
import { db } from "./client.js";
import { account, member, organization, user } from "./auth-schema.js";
import {
  companies,
  settings,
  sites,
  zones,
} from "./schema.js";

const COMPANY_ID = "seed-perusahaan-1";

const existing = await db
  .select({ id: companies.id })
  .from(companies)
  .limit(1);
if (existing.length > 0) {
  console.log("Benih sudah ada, lewati.");
  process.exit(0);
}

await db.insert(companies).values({
  id: COMPANY_ID,
  name: "PT Contoh Sejahtera",
});

const [site] = await db
  .insert(sites)
  .values({
    id: "seed-lokasi-1",
    companyId: COMPANY_ID,
    name: "Pabrik Utama",
    address: "Jl. Industri No. 1",
  })
  .returning();

await db.insert(zones).values([
  { id: "seed-zona-1", companyId: COMPANY_ID, siteId: site.id, name: "Zona 1" },
  { id: "seed-zona-2", companyId: COMPANY_ID, siteId: site.id, name: "Zona 2" },
  { id: "seed-zona-3", companyId: COMPANY_ID, siteId: site.id, name: "Zona 3" },
]);

await db.insert(settings).values({
  key: "apar_expiry_alert_days",
  value: "30",
});

await db.insert(organization).values({
  id: COMPANY_ID,
  name: "PT Contoh Sejahtera",
  slug: "contoh-sejahtera",
  createdAt: new Date(),
});

await db.insert(user).values({
  id: "seed-pengawas-1",
  name: "Pengawas Demo",
  email: "pengawas@contoh.id",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

await db.insert(member).values({
  id: "seed-anggota-1",
  organizationId: COMPANY_ID,
  userId: "seed-pengawas-1",
  role: "inspector",
  createdAt: new Date(),
});

await db.insert(account).values({
  id: createId(),
  accountId: "seed-pengawas-1",
  providerId: "credential",
  userId: "seed-pengawas-1",
  password: await hashPassword("Pengawas123"),
  createdAt: new Date(),
  updatedAt: new Date(),
});

console.log("Benih selesai: 1 perusahaan, 1 lokasi, 3 zona, pengaturan, pengawas demo.");
process.exit(0);
