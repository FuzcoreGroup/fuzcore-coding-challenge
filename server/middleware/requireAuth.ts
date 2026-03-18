import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
    }

    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAccessToken(token);

    const ar = req as AuthenticatedRequest;
    ar.user = { id: payload.sub };
    return next();
  } catch (e: any) {
    return next(
      Object.assign(
        new Error(e?.message || "Unauthorized"),
        { status: e?.status || 401 },
      ),
    );
  }
}

