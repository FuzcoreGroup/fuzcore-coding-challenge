import { Express } from "express";
import authRoutes from "./authRoutes";
import customersRoutes from "./customersRoutes";
import categoryRoutes from "./categoryRoutes";
import transactionsRoutes from "./transactionsRoutes";
import invoiceRoutes from "./invoiceRoutes";
import dashboardRoutes from "./dashboardRoutes";
import { createTransaction } from "../controllers/transactionsController";
import { requireAuth } from "../middleware/auth";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../docs/swagger";

export async function registerRoutes(_httpServer: any, app: Express) {
  app.use("/api/auth", authRoutes);

  app.use("/api/dashboard", requireAuth, dashboardRoutes);
  app.use("/api/customers", requireAuth, customersRoutes);
  app.use("/api/category", requireAuth, categoryRoutes);
  app.use("/api/transactions", requireAuth, transactionsRoutes);
  app.post("/api/transaction", requireAuth, createTransaction);
  app.use("/api/invoices", requireAuth, invoiceRoutes);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
