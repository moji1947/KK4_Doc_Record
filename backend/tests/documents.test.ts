import { describe, it, expect } from "vitest";
import { createDocumentSchema, listDocumentsQuerySchema } from "../src/modules/documents/documents.schema";

describe("Document Schemas Validation", () => {
  it("validates correct document creation payload", () => {
    const validPayload = {
      projectCode: "CM24045",
      title: "Main Mechanical Assembly",
      originatorCode: "EPS",
      groupCode: "ME06",
      typeCode: "FD",
      planDate: "2026-09-15T00:00:00.000Z",
      remarks: "Initial issuance",
    };

    const result = createDocumentSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Main Mechanical Assembly");
      expect(result.data.initialRevision).toBe("A1");
    }
  });

  it("fails validation if required fields are missing", () => {
    const invalidPayload = {
      projectCode: "CM24045",
      // missing title, originatorCode, groupCode, typeCode
    };

    const result = createDocumentSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it("validates document list query defaults", () => {
    const result = listDocumentsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(100);
      expect(result.data.sortBy).toBe("createdAt");
      expect(result.data.sortOrder).toBe("desc");
    }
  });
});
