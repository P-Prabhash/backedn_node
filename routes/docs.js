const express = require('express');
const router = express.Router();

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Gold & Silver Pawn Loan Management ERP API",
    version: "1.0.0",
    description: "Complete Node.js Express REST API for Gold & Silver Pawn Management ERP system."
  },
  servers: [
    {
      url: "/",
      description: "Current Server"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/auth/login": {
      post: {
        summary: "User Login",
        description: "Authenticate user and return JWT bearer token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "admin123" }
                },
                required: ["username", "password"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Login successful with token and user profile." },
          "401": { description: "Invalid username or password." }
        }
      }
    },
    "/customers/create": {
      post: {
        summary: "Create Customer",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Ramesh Kumar" },
                  mobile: { type: "string", example: "9876543210" },
                  address: { type: "string", example: "123 Main Market Street" },
                  aadhaar_number: { type: "string", example: "123456789012" },
                  pan_number: { type: "string", example: "ABCDE1234F" },
                  photo_url: { type: "string", example: "uploads/customers/customer_123.jpg" }
                },
                required: ["name", "mobile", "address"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Customer created successfully." },
          "409": { description: "Duplicate mobile or Aadhaar number error." }
        }
      }
    },
    "/customers/list": {
      get: {
        summary: "List Customers",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "List of active customers." }
        }
      }
    },
    "/gold/create": {
      post: {
        summary: "Add Gold Item Collateral",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  customer_id: { type: "integer", example: 1 },
                  item_name: { type: "string", example: "Gold Necklace 22K" },
                  purity: { type: "string", example: "22K" },
                  weight: { type: "number", example: 15.5 },
                  remarks: { type: "string", example: "Excellent condition" },
                  photo_url: { type: "string", example: "uploads/gold/gold_123.jpg" }
                },
                required: ["customer_id", "item_name", "weight"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Gold item added successfully." }
        }
      }
    },
    "/loans/create_new": {
      post: {
        summary: "Create New Pawn Loan",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  customer_id: { type: "integer", example: 1 },
                  principal_amount: { type: "number", example: 50000 },
                  monthly_interest_rate: { type: "number", example: 2.0 },
                  initial_interest: { type: "number", example: 1000 },
                  opened_date: { type: "string", example: "2026-10-27" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item_name: { type: "string" },
                        weight: { type: "number" },
                        purity: { type: "string" }
                      }
                    }
                  }
                },
                required: ["customer_id", "principal_amount"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Pawn loan recorded successfully with receipt." }
        }
      }
    },
    "/payments/create": {
      post: {
        summary: "Record Payment / Settlement",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  loan_id: { type: "integer", example: 1 },
                  principal_payment: { type: "number", example: 10000 },
                  manual_interest: { type: "number", example: 200 },
                  payment_mode: { type: "string", example: "CASH" },
                  remarks: { type: "string", example: "Partial payment" }
                },
                required: ["loan_id"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Payment recorded successfully." }
        }
      }
    },
    "/receipts/get": {
      get: {
        summary: "Retrieve Receipt Details",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "receipt_no", in: "query", schema: { type: "string" } },
          { name: "loan_id", in: "query", schema: { type: "integer" } },
          { name: "payment_id", in: "query", schema: { type: "integer" } }
        ],
        responses: {
          "200": { description: "Receipt payload containing financial and collateral details." }
        }
      }
    }
  }
};

// Raw Swagger Spec
router.get(['/swagger.json', '/openapi.json'], (req, res) => {
  res.json(openApiSpec);
});

// Interactive Swagger UI Page
router.get(['/', '/swagger', '/docs'], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Gold Pawn ERP - Swagger API Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    </head>
    <body style="margin:0; background: #fafafa;">
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/api-docs/swagger.json',
            dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
