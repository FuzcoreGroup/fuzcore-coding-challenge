import type { Express } from "express";
import type { Server } from "http";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import customerRoutes from "./routes/customer.routes.js"; 
import invoiceRoutes from "./routes/invoice.routes.js"

export async function registerRoutes(httpServer: Server, app: Express) {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "Server is running"
    });
  });

  // Register authentication routes
  app.use("/api/auth", authRoutes);
  
  // Register category routes (protected)
  app.use("/api/categories", categoryRoutes);

  // Register transaction routes (protected)
  app.use("/api/transactions", transactionRoutes);

  // Register customer routes (protected)
   app.use("/api/customers", customerRoutes);  

  // Register invoices routes (protected)
  app.use("/api/invoices", invoiceRoutes);

  // app.use("/api/dashboard", dashboardRoutes);

  // 404 handler for API routes - FIXED: removed the invalid wildcard
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.path}` });
    }
    // Let other routes (like Vite) handle non-API requests
  });
}