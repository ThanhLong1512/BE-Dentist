const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "BE-Dentist API",
      version: "1.0.0",
      description:
        "REST API phòng khám nha khoa — auth, đặt lịch theo slot, thanh toán, search Elasticsearch, health check.",
      contact: {
        name: "BE-Dentist"
      }
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Local development"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token JWT (header Authorization: Bearer <token>)"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            status: { type: "string", example: "fail" },
            message: { type: "string" }
          }
        },
        ObjectId: {
          type: "string",
          pattern: "^[a-fA-F0-9]{24}$",
          example: "689c4ab2d1ae9b39e3680005"
        }
      }
    },
    tags: [
      { name: "Health", description: "Health check" },
      { name: "Auth", description: "Đăng ký / đăng nhập / 2FA / OAuth" },
      { name: "Appointments", description: "Hold slot, lịch hẹn, status, reschedule" },
      { name: "Availability", description: "Slot khả dụng theo ngày & dịch vụ" },
      { name: "Payments", description: "COD / MoMo / ZaloPay / VNPay" },
      { name: "Search", description: "Elasticsearch fuzzy search" },
      { name: "Patients", description: "CRUD bệnh nhân" },
      { name: "Services", description: "CRUD dịch vụ" },
      { name: "Shifts", description: "Ca làm việc" },
      { name: "Orders", description: "Đơn hàng" },
      { name: "Reviews", description: "Đánh giá" },
      { name: "Accounts", description: "Tài khoản" },
      { name: "Employees", description: "Nhân viên" },
      { name: "Chat", description: "Conservations & messages" }
    ]
  },
  apis: ["./docs/paths/*.js"]
};

const specs = swaggerJsdoc(options);

module.exports = { specs };
