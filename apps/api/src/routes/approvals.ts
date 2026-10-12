import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { ApprovalAction, ApprovalStatus } from "@viaannn/shared";
import { HTTPException } from "hono/http-exception";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client.js";
import {
  aparInspections,
  hydrantInspections,
  p3kInspections,
  safetyPatrolReports,
} from "../db/schema.js";
import { companyId, requireSession, type SessionUser } from "../auth/middleware.js";
import { notFound } from "./helpers.js";

const approvalBodySchema = z.object({
  action: z.enum(["ajukan", "ketahui", "setujui", "kembalikan"]),
});

const categoryParamSchema = z.object({
  category: z.enum(["hydrant", "apar", "p3k", "patrol"]),
  refId: z.string().min(1),
});

const TRANSITIONS: Record<ApprovalAction, ApprovalStatus[]> = {
  ajukan: ["DRAFT"],
  ketahui: ["DIAJUKAN"],
  setujui: ["DIKETAHUI"],
  kembalikan: ["DIAJUKAN", "DIKETAHUI", "DISETUJUI"],
};

const NEXT_STATUS: Record<ApprovalAction, ApprovalStatus> = {
  ajukan: "DIAJUKAN",
  ketahui: "DIKETAHUI",
  setujui: "DISETUJUI",
  kembalikan: "DRAFT",
};

const LABELS: Record<"hydrant" | "apar" | "p3k" | "patrol", string> = {
  hydrant: "Inspeksi hidran",
  apar: "Inspeksi APAR",
  p3k: "Inspeksi P3K",
  patrol: "Laporan patroli",
};

interface ApprovalHead {
  status: ApprovalStatus;
  submittedBy: string | null;
}

async function loadHead(
  category: "hydrant" | "apar" | "p3k" | "patrol",
  refId: string,
  owned: string,
): Promise<ApprovalHead | null> {
  switch (category) {
    case "hydrant": {
      const [row] = await db
        .select({
          status: hydrantInspections.approvalStatus,
          submittedBy: hydrantInspections.approvalSubmittedById,
        })
        .from(hydrantInspections)
        .where(and(eq(hydrantInspections.id, refId), eq(hydrantInspections.companyId, owned)))
        .limit(1);
      return row ?? null;
    }
    case "apar": {
      const [row] = await db
        .select({
          status: aparInspections.approvalStatus,
          submittedBy: aparInspections.approvalSubmittedById,
        })
        .from(aparInspections)
        .where(and(eq(aparInspections.id, refId), eq(aparInspections.companyId, owned)))
        .limit(1);
      return row ?? null;
    }
    case "p3k": {
      const [row] = await db
        .select({
          status: p3kInspections.approvalStatus,
          submittedBy: p3kInspections.approvalSubmittedById,
        })
        .from(p3kInspections)
        .where(and(eq(p3kInspections.id, refId), eq(p3kInspections.companyId, owned)))
        .limit(1);
      return row ?? null;
    }
    case "patrol": {
      const [row] = await db
        .select({
          status: safetyPatrolReports.approvalStatus,
          submittedBy: safetyPatrolReports.approvalSubmittedById,
        })
        .from(safetyPatrolReports)
        .where(and(eq(safetyPatrolReports.id, refId), eq(safetyPatrolReports.companyId, owned)))
        .limit(1);
      return row ?? null;
    }
  }
}

async function applyDecision(
  category: "hydrant" | "apar" | "p3k" | "patrol",
  refId: string,
  owned: string,
  patch: {
    approvalStatus: ApprovalStatus;
    approvalSubmittedById: string | null;
    approvalActorId: string;
    approvalActedAt: Date;
  },
): Promise<void> {
  switch (category) {
    case "hydrant":
      await db
        .update(hydrantInspections)
        .set(patch)
        .where(and(eq(hydrantInspections.id, refId), eq(hydrantInspections.companyId, owned)));
      return;
    case "apar":
      await db
        .update(aparInspections)
        .set(patch)
        .where(and(eq(aparInspections.id, refId), eq(aparInspections.companyId, owned)));
      return;
    case "p3k":
      await db
        .update(p3kInspections)
        .set(patch)
        .where(and(eq(p3kInspections.id, refId), eq(p3kInspections.companyId, owned)));
      return;
    case "patrol":
      await db
        .update(safetyPatrolReports)
        .set(patch)
        .where(and(eq(safetyPatrolReports.id, refId), eq(safetyPatrolReports.companyId, owned)));
      return;
  }
}

export const approvalsApp = new Hono<{ Variables: { user: SessionUser } }>();
approvalsApp.use("*", requireSession);

approvalsApp.post(
  "/:category/:refId/approval",
  zValidator("param", categoryParamSchema),
  zValidator("json", approvalBodySchema),
  async (c) => {
    const { category, refId } = c.req.valid("param");
    const { action } = c.req.valid("json");
    const owned = companyId(c);
    const user = c.get("user");

    const head = await loadHead(category, refId, owned);
    if (!head) throw notFound(LABELS[category]);
    if (!TRANSITIONS[action].includes(head.status)) {
      throw new HTTPException(400, {
        message: `Tindakan "${action}" tidak valid untuk status persetujuan ${head.status}.`,
      });
    }
    if (action === "setujui" && head.submittedBy === user.id) {
      throw new HTTPException(403, {
        message: "Pengajuan tidak dapat disetujui oleh pengirimnya sendiri.",
      });
    }

    const next = NEXT_STATUS[action];
    const submittedBy = action === "ajukan" ? user.id : head.submittedBy;
    const actedAt = new Date();
    await applyDecision(category, refId, owned, {
      approvalStatus: next,
      approvalSubmittedById: submittedBy,
      approvalActorId: user.id,
      approvalActedAt: actedAt,
    });

    return c.json({
      id: refId,
      approvalStatus: next,
      approvalSubmittedById: submittedBy,
      approvalActorId: user.id,
      approvalActedAt: actedAt.toISOString(),
    });
  },
);
