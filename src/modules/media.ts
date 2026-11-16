import { Router } from "express";
import { z } from "zod";
import { mediaCreateSchema } from "../shared";
import { prisma } from "../lib/prisma";
import { destroyAsset, signUpload } from "../lib/cloudinary";
import { validate } from "../middleware/validate";

export const mediaRouter = Router();

/** Step 1 — CMS asks for a signature, then uploads straight to Cloudinary. */
mediaRouter.post("/sign", (_req, res) => {
  res.json(signUpload());
});

/** Step 2 — CMS registers the uploaded asset so it shows in the media library. */
mediaRouter.post("/", validate(mediaCreateSchema), async (req, res) => {
  res.status(201).json(await prisma.media.create({ data: req.body }));
});

mediaRouter.get("/", async (_req, res) => {
  res.json(await prisma.media.findMany({ orderBy: { createdAt: "desc" } }));
});

mediaRouter.patch("/:id", validate(z.object({ alt: z.string() })), async (req, res) => {
  res.json(await prisma.media.update({ where: { id: String(req.params.id) }, data: { alt: req.body.alt } }));
});

mediaRouter.delete("/:id", async (req, res) => {
  const media = await prisma.media.delete({ where: { id: String(req.params.id) } });
  await destroyAsset(media.publicId).catch((e) => console.warn("[cloudinary] destroy failed:", e.message));
  res.status(204).end();
});
