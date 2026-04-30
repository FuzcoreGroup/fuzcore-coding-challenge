import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import type { User } from "../shared/schema";

// ── Password helpers ────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Passport strategy ───────────────────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase().trim()))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const valid = await comparePasswords(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

// ── Session setup ───────────────────────────────────────────────────
export function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
}

// ── Auth middleware ─────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Unauthorized" });
}
