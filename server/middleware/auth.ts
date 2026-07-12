import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { serverConfig } from "../config";

const JWT_SECRET = serverConfig.JWT_SECRET as string;

type JwtPayload = {
  userId: string;
  email: string;
};

export interface AuthRequest extends Request {
  user?: JwtPayload;
  file?: Express.Multer.File;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: token required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized: invalid or expired token" });
  }
}

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}
