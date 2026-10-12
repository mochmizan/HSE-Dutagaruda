import { createId } from "@paralleldrive/cuid2";
import { HTTPException } from "hono/http-exception";

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export async function listPage<T extends { id: string }>(args: {
  fetch: (limitPlusOne: number) => Promise<T[]>;
  limit: number;
}): Promise<Page<T>> {
  const rows = await args.fetch(args.limit + 1);
  const hasMore = rows.length > args.limit;
  const items = hasMore ? rows.slice(0, args.limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export function newId(): string {
  return createId();
}

export function duplicateMonth(): HTTPException {
  return new HTTPException(409, {
    message: "Inspeksi bulan tersebut sudah ada untuk aset ini.",
  });
}

export function notFound(nama: string): HTTPException {
  return new HTTPException(404, { message: `${nama} tidak ditemukan.` });
}

export function blockedByChildren(nama: string): HTTPException {
  return new HTTPException(409, {
    message: `${nama} tidak dapat dihapus karena masih memiliki data turunan.`,
  });
}
