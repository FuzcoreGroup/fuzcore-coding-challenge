/**
 * @openapi
 * /category:
 *   get:
 *     tags:
 *       - Category
 *     summary: Get paginated categories
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: pageLength
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List categories
 *   post:
 *     tags:
 *       - Category
 *     summary: Create category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *             properties:
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 * /category/{id}:
 *   put:
 *     tags:
 *       - Category
 *     summary: Update category
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *   delete:
 *     tags:
 *       - Category
 *     summary: Delete category
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Category deleted
 */
import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";

const router = Router();

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
