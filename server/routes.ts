import type { Express } from "express";
import type { Server } from "http";
import { registerAuthRoutes } from "./routes/auth";
import { registerCustomerRoutes } from "./routes/customers";
import { registerTransactionRoutes } from "./routes/transactions";
import { registerInvoiceRoutes } from "./routes/invoices";

export async function registerRoutes(httpServer: Server, app: Express) {
  // NOTE: `httpServer` is currently unused, but kept to preserve the signature.
  void httpServer;

  // Auth first so all subsequent routes can require authentication.
  registerAuthRoutes(app);
  registerCustomerRoutes(app);
  registerTransactionRoutes(app);
  registerInvoiceRoutes(app);
}
