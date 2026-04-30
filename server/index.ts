import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Routes
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import transactionRoutes from './routes/transaction.routes.js'
import customerRoutes from "./routes/customer.routes.js"; 
import invoiceRoutes from "./routes/invoice.routes.js";

// Initialize DB (keeps your drizzle/sqlite setup alive)
import "./db/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- Middleware ----------
app.use(cors({
  origin: "http://localhost:5000",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---------- Logger ----------
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ---------- API Routes ----------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/customers", customerRoutes);    
app.use("/api/invoices", invoiceRoutes);

// ---------- Vite Middleware (DEV) ----------
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");

  const vite = await createViteServer({
    server: { middlewareMode: true },
    root: path.resolve(__dirname, "../client"),
  });

  app.use(vite.middlewares);

  // 🔥 Fixes "Cannot GET /"
  app.use(async (req, res, next) => {
  try {
    const url = req.originalUrl;

    // ✅ Read actual index.html
    let template = fs.readFileSync(
      path.resolve(__dirname, "../client/index.html"),
      "utf-8"
    );

    // ✅ Let Vite process it (inject HMR, CSS, etc.)
    template = await vite.transformIndexHtml(url, template);

    res.status(200).set({ "Content-Type": "text/html" }).end(template);
  } catch (e) {
    vite.ssrFixStacktrace(e as Error);
    next(e);
  }
});
} else {
  // ---------- Production ----------
  const distPath = path.resolve(__dirname, "../dist");

  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// ---------- Error Handler ----------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});