import { Router } from "express";
import rateLimit from "express-rate-limit";
import { contactSchema } from "../shared";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http";
import { validate } from "../middleware/validate";

export const publicRouter = Router();

const publishedProjects = () =>
  prisma.project.findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { order: "asc" }] });
const skills = () => prisma.skill.findMany({ orderBy: [{ category: "asc" }, { orbitOrder: "asc" }] });
const experience = () => prisma.experience.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] });
const education = () => prisma.education.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] });

/** Everything the portfolio home page needs, in one request. */
publicRouter.get("/portfolio", async (_req, res) => {
  const [profile, s, projects, exp, edu] = await Promise.all([
    prisma.profile.findFirst(),
    skills(),
    publishedProjects(),
    experience(),
    education(),
  ]);
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ profile, skills: s, projects, experience: exp, education: edu });
});

publicRouter.get("/profile", async (_req, res) => res.json(await prisma.profile.findFirst()));
publicRouter.get("/skills", async (_req, res) => res.json(await skills()));
publicRouter.get("/projects", async (_req, res) => res.json(await publishedProjects()));
publicRouter.get("/experience", async (_req, res) => res.json(await experience()));
publicRouter.get("/education", async (_req, res) => res.json(await education()));

publicRouter.get("/projects/:slug", async (req, res) => {
  const project = await prisma.project.findFirst({ where: { slug: req.params.slug, published: true } });
  if (!project) throw new HttpError(404, "Project not found");
  res.json(project);
});

publicRouter.post(
  "/contact",
  rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, message: { error: "Too many messages, try later" } }),
  validate(contactSchema),
  async (req, res) => {
    await prisma.message.create({ data: req.body });
    res.status(201).json({ ok: true });
  },
);
