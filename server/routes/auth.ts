import type { Express } from "express";
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { signAccessToken } from "../utils/jwt";
import { requireAuth } from "../middleware/requireAuth";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(1).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function registerAuthRoutes(app: Express) {
  const router = Router();

  router.post("/register", async (req, res) => {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: "Invalid request body", details: body.error.flatten() });
    }

    const existing = await db.select().from(users).where(eq(users.email, body.data.email)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(body.data.password, 10);

    const inserted = await db
      .insert(users)
      .values({
        email: body.data.email,
        passwordHash,
        businessName: body.data.businessName,
      })
      .returning();

    const user = inserted[0];
    const token = signAccessToken(user.id);

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, businessName: user.businessName },
    });
  });

  router.post("/login", async (req, res) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: "Invalid request body", details: body.error.flatten() });
    }

    const existing = await db.select().from(users).where(eq(users.email, body.data.email)).limit(1);
    if (existing.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = existing[0];
    const ok = await bcrypt.compare(body.data.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signAccessToken(user.id);
    return res.json({
      token,
      user: { id: user.id, email: user.email, businessName: user.businessName },
    });
  });

  router.post("/logout", requireAuth, async (_req, res) => {
    // JWT is stateless; client removes token.
    return res.status(204).end();
  });

  router.get("/me", requireAuth, async (req, res) => {
    const userId = (req as any).user?.id;
    if (typeof userId !== "string") {
      return res.status(401).json({ message: "Invalid token" });
    }
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const u = rows[0];
    return res.json({ user: { id: u.id, email: u.email, businessName: u.businessName } });
  });

  app.use("/api/auth", router);
}

