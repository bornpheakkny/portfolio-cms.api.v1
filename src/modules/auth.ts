import { Router, type CookieOptions } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { loginSchema } from "../shared";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { HttpError } from "../lib/http";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";

const REFRESH_COOKIE = "rt";
const cookieOptions: CookieOptions = {
  httpOnly: true,
  // CMS (vercel.app) and API (onrender.com) are different sites → SameSite=None + Secure in prod
  secure: env.isProd,
  sameSite: env.isProd ? "none" : "lax",
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

type User = { id: string; email: string; role: string; tokenVersion: number };

const signAccess = (u: User) =>
  jwt.sign({ sub: u.id, email: u.email, role: u.role }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
const signRefresh = (u: User) =>
  jwt.sign({ sub: u.id, v: u.tokenVersion }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

export const authRouter = Router();

authRouter.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }),
  validate(loginSchema),
  async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }
    res.cookie(REFRESH_COOKIE, signRefresh(user), cookieOptions);
    res.json({ accessToken: signAccess(user), user: { id: user.id, email: user.email, role: user.role } });
  },
);

authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new HttpError(401, "No refresh token");
  let payload: { sub: string; v: number };
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as typeof payload;
  } catch {
    throw new HttpError(401, "Invalid refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.tokenVersion !== payload.v) throw new HttpError(401, "Session revoked");
  res.cookie(REFRESH_COOKIE, signRefresh(user), cookieOptions); // rotate
  res.json({ accessToken: signAccess(user), user: { id: user.id, email: user.email, role: user.role } });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
});

/** Log out everywhere: invalidates every refresh token issued so far. */
authRouter.post("/logout-all", requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: req.user!.sub }, data: { tokenVersion: { increment: 1 } } });
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
