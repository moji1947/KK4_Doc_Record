import { FastifyInstance } from "fastify";
import { generateDocumentNumberSchema } from "./numbering.schema";
import { generateNextDocumentNumber, peekNextDocumentNumber } from "./numbering.service";
import { AppError } from "../../shared/errors";

export async function numberingRoutes(app: FastifyInstance) {
  // GET /api/v1/numbering/preview (Live Preview without reservation)
  app.get("/api/v1/numbering/preview", async (request) => {
    const parseResult = generateDocumentNumberSchema.safeParse(request.query);
    if (!parseResult.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid input for document numbering preview", 422, {
        issues: parseResult.error.issues,
      });
    }

    const documentNo = await peekNextDocumentNumber(parseResult.data);
    return { documentNo };
  });

  // POST /api/v1/numbering/preview (Live Preview via POST body)
  app.post("/api/v1/numbering/preview", async (request) => {
    const parseResult = generateDocumentNumberSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid input for document numbering preview", 422, {
        issues: parseResult.error.issues,
      });
    }

    const documentNo = await peekNextDocumentNumber(parseResult.data);
    return { documentNo };
  });

  // POST /api/v1/numbering/generate (Atomic generation with row lock)
  app.post("/api/v1/numbering/generate", async (request, reply) => {
    const parseResult = generateDocumentNumberSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid input for document numbering", 422, {
        issues: parseResult.error.issues,
      });
    }

    const documentNo = await generateNextDocumentNumber(parseResult.data);
    return reply.status(200).send({ documentNo });
  });
}
