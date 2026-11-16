import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env";
import { HttpError } from "../lib/http";

export type AccessPayload = { sub: string; email: string; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw new HttpError(401, "Missing access token");
  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired access token");
  }
};
