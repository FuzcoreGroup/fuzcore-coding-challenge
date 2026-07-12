import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fuzcore API",
      version: "1.0.0",
      description:
        "API documentation for users, customers, transactions, and invoices",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./server/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
