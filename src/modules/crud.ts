import { Router } from "express";
import type { ZodObject } from "zod";
import { reorderSchema } from "../shared";
import { prisma } from "../lib/prisma";
import { triggerRevalidate } from "../lib/revalidate";
import { validate } from "../middleware/validate";

// Minimal shape shared by every Prisma model delegate we use here.
type Delegate = {
  findMany(args?: unknown): Promise<unknown[]>;
  findUniqueOrThrow(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};

/**
 * Admin CRUD router for an orderable model:
 * GET / · GET /:id · POST / · PUT /:id (full replace) · PATCH /reorder · DELETE /:id
 */
export function crudRouter(
  delegate: Delegate,
  schema: ZodObject,
  { orderBy = { order: "asc" } as unknown, orderField = "order" } = {},
) {
  const r = Router();
  const id = (p: { id?: string | string[] }) => String(p.id);

  r.get("/", async (_req, res) => {
    res.json(await delegate.findMany({ orderBy }));
  });

  r.get("/:id", async (req, res) => {
    res.json(await delegate.findUniqueOrThrow({ where: { id: id(req.params) } }));
  });

  r.post("/", validate(schema), async (req, res) => {
    const created = await delegate.create({ data: req.body });
    triggerRevalidate();
    res.status(201).json(created);
  });

  r.put("/:id", validate(schema), async (req, res) => {
    const updated = await delegate.update({ where: { id: id(req.params) }, data: req.body });
    triggerRevalidate();
    res.json(updated);
  });

  r.patch("/reorder", validate(reorderSchema), async (req, res) => {
    const ids: string[] = req.body.ids;
    await prisma.$transaction(
      ids.map((rid, index) => delegate.update({ where: { id: rid }, data: { [orderField]: index } }) as never),
    );
    triggerRevalidate();
    res.status(204).end();
  });

  r.delete("/:id", async (req, res) => {
    await delegate.delete({ where: { id: id(req.params) } });
    triggerRevalidate();
    res.status(204).end();
  });

  return r;
}
