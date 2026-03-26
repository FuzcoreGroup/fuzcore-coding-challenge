import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { signJwt } from "../middleware/auth";
import { serverConfig } from "../config";

const SALT_ROUNDS = 10;

export async function signUp(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const inserted = await db
    .insert(users)
    .values({ email, password: hashed })
    .returning();

  const user = inserted[0];
  const token = signJwt({ userId: user.id, email: user.email });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: serverConfig.NODE_ENV === "production",
    maxAge: 12 * 60 * 60 * 1000,
  });

  return res.status(201).json({ token });
}

export async function signIn(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const rows = await db.select().from(users).where(eq(users.email, email));

  if (rows.length === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signJwt({ userId: user.id, email: user.email });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: serverConfig.NODE_ENV === "production",
    maxAge: 12 * 60 * 60 * 1000,
  });

  return res.json({ token });
}

export function signOut(_req: Request, res: Response) {
  res.clearCookie("token");
  return res.status(200).json({ message: "Signed out" });
}
