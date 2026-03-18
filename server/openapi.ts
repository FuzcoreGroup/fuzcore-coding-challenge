export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "FuzCore Accounting API",
    version: "0.1.0",
    description: "Small-business accounting backend (auth, customers, transactions, invoices).",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Auth" },
    { name: "Customers" },
    { name: "Transactions" },
    { name: "Invoices" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          businessName: { type: "string" },
        },
        required: ["id", "email", "businessName"],
      },
      Customer: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          name: { type: "string" },
          email: { type: "string", nullable: true },
          phone: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          amount: { type: "number" },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string" },
          description: { type: "string", nullable: true },
          date: { type: "string", format: "date" },
          customerId: { type: "string", nullable: true },
        },
      },
      InvoiceLineItem: {
        type: "object",
        properties: {
          description: { type: "string" },
          quantity: { type: "integer" },
          unitPrice: { type: "number" },
        },
        required: ["description", "quantity", "unitPrice"],
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  businessName: { type: "string" },
                },
                required: ["email", "password", "businessName"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        responses: {
          "200": { description: "Authenticated user" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        responses: {
          "204": { description: "No content (client should remove token)" },
        },
      },
    },
    "/api/customers": {
      get: {
        tags: ["Customers"],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Customer list" } },
      },
      post: {
        tags: ["Customers"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", nullable: true },
                  phone: { type: "string", nullable: true },
                  address: { type: "string", nullable: true },
                },
                required: ["name"],
              },
            },
          },
        },
        responses: { "201": { description: "Created customer" } },
      },
    },
    "/api/customers/{id}": {
      get: {
        tags: ["Customers"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Customer" }, "404": { description: "Not found" } },
      },
      put: {
        tags: ["Customers"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: { "200": { description: "Updated customer" }, "404": { description: "Not found" } },
      },
      delete: {
        tags: ["Customers"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" }, "404": { description: "Not found" } },
      },
    },
    "/api/transactions": {
      get: {
        tags: ["Transactions"],
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "customerId", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Transaction list" } },
      },
      post: {
        tags: ["Transactions"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  type: { type: "string", enum: ["income", "expense"] },
                  category: { type: "string" },
                  description: { type: "string", nullable: true },
                  date: { type: "string", format: "date" },
                  customerId: { type: "string", nullable: true },
                },
                required: ["amount", "type", "category", "date"],
              },
            },
          },
        },
        responses: { "201": { description: "Created transaction" } },
      },
    },
    "/api/transactions/{id}": {
      get: { tags: ["Transactions"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Transaction" } } },
      put: { tags: ["Transactions"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Transactions"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "204": { description: "Deleted" } } },
    },
    "/api/transactions/categories": {
      get: { tags: ["Transactions"], responses: { "200": { description: "Categories" } } },
    },
    "/api/transactions/summary": {
      get: {
        tags: ["Transactions"],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Income/expense totals" } },
      },
    },
    "/api/invoices": {
      get: { tags: ["Invoices"], parameters: [{ name: "status", in: "query", schema: { type: "string", enum: ["draft", "sent", "paid"] } }], responses: { "200": { description: "Invoices" } } },
      post: {
        tags: ["Invoices"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  customerId: { type: "string" },
                  issueDate: { type: "string", format: "date" },
                  dueDate: { type: "string", format: "date", nullable: true },
                  tax: { type: "number" },
                  notes: { type: "string", nullable: true },
                  items: { type: "array", items: { $ref: "#/components/schemas/InvoiceLineItem" } },
                },
                required: ["customerId", "issueDate", "items"],
              },
            },
          },
        },
        responses: { "201": { description: "Created invoice" } },
      },
    },
    "/api/invoices/next-number": {
      get: { tags: ["Invoices"], responses: { "200": { description: "Next invoice number" } } },
    },
    "/api/invoices/{id}": {
      get: { tags: ["Invoices"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Invoice detail with items" } } },
      delete: { tags: ["Invoices"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "204": { description: "Deleted draft invoice" } } },
    },
    "/api/invoices/{id}/status": {
      patch: {
        tags: ["Invoices"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { status: { type: "string", enum: ["draft", "sent", "paid"] } },
                required: ["status"],
              },
            },
          },
        },
        responses: { "200": { description: "Updated status" } },
      },
    },
  },
};

