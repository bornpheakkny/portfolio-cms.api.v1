import { Router } from "express";
import { profileSchema } from "../shared";
import { prisma } from "../lib/prisma";
import { triggerRevalidate } from "../lib/revalidate";
import { validate } from "../middleware/validate";

export const profileAdminRouter = Router();

profileAdminRouter.get("/", async (_req, res) => {
  res.json(await prisma.profile.findFirst());
});

/** Upsert the single profile row. */
profileAdminRouter.put("/", validate(profileSchema), async (req, res) => {
  const existing = await prisma.profile.findFirst({ select: { id: true } });
  const profile = existing
    ? await prisma.profile.update({ where: { id: existing.id }, data: req.body })
    : await prisma.profile.create({ data: req.body });
  triggerRevalidate();
  res.json(profile);
});
