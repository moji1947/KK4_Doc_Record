import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env";
import { AppError } from "./shared/errors";
import { numberingRoutes } from "./modules/numbering/numbering.route";
import { masterDataRoutes } from "./modules/master-data/master-data.route";
import { documentsRoutes } from "./modules/documents/documents.route";
import { authRoutes } from "./modules/auth/auth.route";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  });

  app.register(cors, { origin: true });

  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "KK4 Doc Record API",
        description: "Document Register & Document Control Platform - SKK-IM-CM26002 (CM24045)",
        version: "0.1.0",
      },
    },
  });
  app.register(swaggerUi, { routePrefix: "/docs" });

  // มาตรฐาน error response เดียวกันทั้งระบบ — ดู docs/skills/04-coding-standards.md
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toResponse());
    }

    app.log.error(error);
    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Something went wrong",
        details: {},
      },
    });
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(authRoutes);
  app.register(numberingRoutes);
  app.register(masterDataRoutes);
  app.register(documentsRoutes);

  return app;
}
