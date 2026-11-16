import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";

export const messagesRouter = Router();

messagesRouter.get("/", async (_req, res) => {
  res.json(await prisma.message.findMany({ orderBy: { createdAt: "desc" } }));
});

messagesRouter.patch("/:id", validate(z.object({ read: z.boolean() })), async (req, res) => {
  res.json(await prisma.message.update({ where: { id: String(req.params.id) }, data: { read: req.body.read } }));
});

messagesRouter.delete("/:id", async (req, res) => {
  await prisma.message.delete({ where: { id: String(req.params.id) } });
  res.status(204).end();
});
