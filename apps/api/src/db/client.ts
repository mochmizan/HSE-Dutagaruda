import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL ?? "";

// Opsi eksplisit. Bawaan postgres-js membuka sampai 10 koneksi dan menunggu
// tanpa batas; satu query lambat bisa menahan seluruh pool sampai request lain
// ikut menggantung. `statement_timeout` memastikan query yang tersangkut gagal
// dengan pesan, bukan menahan koneksi selamanya.
const client = postgres(connectionString, {
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idle_timeout: 30,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
  connection: {
    statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 15_000),
  },
});

export const db = drizzle({ client, schema });

export type Db = typeof db;
