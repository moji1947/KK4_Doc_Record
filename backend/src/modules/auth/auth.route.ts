import { FastifyInstance } from "fastify";
import { loginSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { AppError } from "../../shared/errors";

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/login", async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid login credentials format", 422, {
        issues: parseResult.error.issues,
      });
    }

    const user = await authService.authenticateUser(parseResult.data);
    const token = app.jwt.sign({
      userId: user.userId,
      email: user.email,
      isAdmin: user.isAdmin,
      disciplineCode: user.disciplineCode,
    });

    return reply.status(200).send({
      token,
      user,
    });
  });

  app.get("/api/v1/auth/me", async (request) => {
    try {
      await request.jwtVerify();
      const payload = request.user as { userId: string };
      const user = await authService.getUserById(payload.userId);
      return { user };
    } catch {
      throw new AppError("UNAUTHORIZED", "Not authenticated", 401);
    }
  });
}
