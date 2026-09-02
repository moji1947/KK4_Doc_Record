import { FastifyInstance } from "fastify";
import {
  createDocumentSchema,
  updateDocumentSchema,
  createSubmissionSchema,
  listDocumentsQuerySchema,
  syncErpSchema,
  batchSyncErpSchema,
} from "./documents.schema";
import * as documentsService from "./documents.service";
import { AppError } from "../../shared/errors";

export async function documentsRoutes(app: FastifyInstance) {
  // GET /api/v1/documents
  app.get("/api/v1/documents", async (request) => {
    const parseResult = listDocumentsQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid query parameters", 422, {
        issues: parseResult.error.issues,
      });
    }
    return documentsService.listDocuments(parseResult.data);
  });

  // GET /api/v1/documents/:id
  app.get<{ Params: { id: string } }>("/api/v1/documents/:id", async (request) => {
    return documentsService.getDocumentById(request.params.id);
  });

  // POST /api/v1/documents
  app.post("/api/v1/documents", async (request, reply) => {
    const parseResult = createDocumentSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid document payload", 422, {
        issues: parseResult.error.issues,
      });
    }

    const document = await documentsService.createDocument(parseResult.data, "admin@scg.com");
    return reply.status(201).send(document);
  });

  // PATCH /api/v1/documents/:id
  app.patch<{ Params: { id: string } }>("/api/v1/documents/:id", async (request) => {
    const parseResult = updateDocumentSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid update payload", 422, {
        issues: parseResult.error.issues,
      });
    }

    return documentsService.updateDocument(request.params.id, parseResult.data, "admin@scg.com");
  });

  // POST /api/v1/documents/:id/erp-sync (1-click mark as uploaded)
  app.post<{ Params: { id: string } }>(
    "/api/v1/documents/:id/erp-sync",
    async (request, reply) => {
      const parseResult = syncErpSchema.safeParse(request.body || {});
      if (!parseResult.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid ERP sync payload", 422, {
          issues: parseResult.error.issues,
        });
      }

      const updated = await documentsService.setErpSyncStatus(
        request.params.id,
        parseResult.data,
        "admin@scg.com"
      );
      return reply.status(200).send(updated);
    }
  );

  // POST /api/v1/documents/batch-erp-sync (Multi-item mark as uploaded)
  app.post("/api/v1/documents/batch-erp-sync", async (request, reply) => {
    const parseResult = batchSyncErpSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid batch sync payload", 422, {
        issues: parseResult.error.issues,
      });
    }

    const result = await documentsService.batchSetErpSyncStatus(
      parseResult.data,
      "admin@scg.com"
    );
    return reply.status(200).send(result);
  });

  // POST /api/v1/documents/:id/submissions
  app.post<{ Params: { id: string } }>(
    "/api/v1/documents/:id/submissions",
    async (request, reply) => {
      const parseResult = createSubmissionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid submission payload", 422, {
          issues: parseResult.error.issues,
        });
      }

      const submission = await documentsService.addSubmission(
        request.params.id,
        parseResult.data,
        "admin@scg.com"
      );
      return reply.status(201).send(submission);
    }
  );
}
