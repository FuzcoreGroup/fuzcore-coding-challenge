import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export type JwtPayload = {
  sub: string; // userId
};

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  if (!decoded || typeof decoded.sub !== "string") {
    throw Object.assign(new Error("Invalid token payload"), { status: 401 });
  }
  return { sub: decoded.sub as string };
}

