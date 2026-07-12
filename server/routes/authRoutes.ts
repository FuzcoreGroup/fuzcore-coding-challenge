/**
 * @openapi
 * /auth/sign-up:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Sign up a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: JWT token returned
 *       400:
 *         description: Missing credentials
 *       409:
 *         description: Email already exists
 * /api/auth/sign-in:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Sign in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token returned
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 * /auth/sign-out:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Sign out
 *     responses:
 *       200:
 *         description: Signed out
 */
import { Router } from "express";
import { signUp, signIn, signOut } from "../controllers/authController";

const router = Router();

router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/sign-out", signOut);

export default router;
