import { FastifyInstance } from "fastify";
import * as masterDataService from "./master-data.service";

// ทุก endpoint นี้เป็น read-only lookup สำหรับ populate dropdown ฝั่ง frontend
export async function masterDataRoutes(app: FastifyInstance) {
  app.get("/api/v1/master-data/all", async () => {
    return masterDataService.getAllMasterData();
  });

  app.get("/api/v1/master-data/disciplines", async () => {
    return masterDataService.listDisciplines();
  });

  app.get<{ Querystring: { disciplineCode?: string } }>(
    "/api/v1/master-data/groups",
    async (request) => {
      return masterDataService.listGroupsByDiscipline(request.query.disciplineCode);
    }
  );

  app.get<{ Querystring: { groupCode?: string } }>(
    "/api/v1/master-data/types",
    async (request) => {
      return masterDataService.listTypesByGroup(request.query.groupCode);
    }
  );

  app.get("/api/v1/master-data/originators", async () => {
    return masterDataService.listOriginators();
  });

  app.get("/api/v1/master-data/statuses", async () => {
    return masterDataService.listStatuses();
  });

  app.get("/api/v1/master-data/projects", async () => {
    return masterDataService.listProjects();
  });

  app.get("/api/v1/master-data/revisions", async () => {
    return masterDataService.listRevisions();
  });

  app.get("/api/v1/master-data/return-codes", async () => {
    return masterDataService.listReturnCodes();
  });

  app.get("/api/v1/master-data/purposes", async () => {
    return masterDataService.listPurposes();
  });
}
