import express, { Router } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { educationSchema, experienceSchema, projectSchema, skillSchema } from "./shared";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFound } from "./middleware/error";
import { authRouter } from "./modules/auth";
import { crudRouter } from "./modules/crud";
import { mediaRouter } from "./modules/media";
import { messagesRouter } from "./modules/messages";
import { profileAdminRouter } from "./modules/profile";
import { publicRouter } from "./modules/public";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // Render sits behind a proxy (needed for rate limiting + secure cookies)
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, time: new Date().toISOString() });
  });

  const admin = Router();
  admin.use(requireAuth);
  admin.use("/profile", profileAdminRouter);
  admin.use("/skills", crudRouter(prisma.skill, skillSchema, {
      orderBy: [{ category: "asc" }, { orbitOrder: "asc" }],
      orderField: "orbitOrder",
    }));
  admin.use("/projects", crudRouter(prisma.project, projectSchema));
  admin.use("/experience", crudRouter(prisma.experience, experienceSchema));
  admin.use("/education", crudRouter(prisma.education, educationSchema));
  admin.use("/media", mediaRouter);
  admin.use("/messages", messagesRouter);

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin", admin);
  app.use("/api/v1", publicRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
