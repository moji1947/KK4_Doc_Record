import { prisma } from "../../config/prisma";

// Service สำหรับดึง Master Data ทั้งหมด — ใช้เป็นฐานของ cascading dropdown ฝั่ง frontend
// (Discipline -> Group -> TypeCode) ดู docs/skills/05-ux-principles.md

export function listDisciplines() {
  return prisma.disciplineMaster.findMany({
    where: { active: true },
    orderBy: { disciplineCode: "asc" },
  });
}

export function listGroupsByDiscipline(disciplineCode?: string) {
  return prisma.documentGroupMaster.findMany({
    where: {
      ...(disciplineCode ? { disciplineCode } : {}),
      active: true,
    },
    orderBy: { groupCode: "asc" },
  });
}

export async function listTypesByGroup(groupCode?: string) {
  if (!groupCode) {
    return prisma.documentTypeMaster.findMany({
      where: { active: true },
      orderBy: { typeCode: "asc" },
    });
  }
  const mappings = await prisma.groupTypeMapping.findMany({
    where: { groupCode },
    include: { type: true },
  });
  const mapped = mappings.map((m) => m.type).filter((t) => t.active);
  // ยังไม่มี mapping ที่ยืนยันสำหรับ Group นี้ (เช่น Group ที่ยังไม่เคยใช้งานจริง)
  // ไม่ควรทำให้ dropdown ว่างเปล่าจนสร้างเอกสารไม่ได้ — fallback ไปแสดง Type ทั้งหมดแทน
  if (mapped.length === 0) {
    return listTypesByGroup(undefined);
  }
  return mapped;
}

export function listOriginators() {
  return prisma.originatorMaster.findMany({
    where: { active: true },
    orderBy: { originatorCode: "asc" },
  });
}

export function listStatuses() {
  return prisma.statusMaster.findMany({
    where: { active: true },
    orderBy: { statusCode: "asc" },
  });
}

export function listProjects() {
  return prisma.projectMaster.findMany({
    where: { active: true },
    orderBy: { projectCode: "asc" },
  });
}

export function listRevisions() {
  return prisma.revisionMaster.findMany({
    where: { active: true },
    orderBy: { revisionCode: "asc" },
  });
}

export function listReturnCodes() {
  return prisma.returnCodeMaster.findMany({
    where: { active: true },
    orderBy: { returnCode: "asc" },
  });
}

export function listPurposes() {
  return prisma.purposeOfIssueMaster.findMany({
    where: { active: true },
    orderBy: { purposeCode: "asc" },
  });
}

export async function getAllMasterData() {
  const [
    projects,
    disciplines,
    groups,
    types,
    groupTypeMappings,
    originators,
    statuses,
    revisions,
    returnCodes,
    purposes,
  ] = await Promise.all([
    listProjects(),
    listDisciplines(),
    listGroupsByDiscipline(),
    listTypesByGroup(),
    prisma.groupTypeMapping.findMany(),
    listOriginators(),
    listStatuses(),
    listRevisions(),
    listReturnCodes(),
    listPurposes(),
  ]);

  return {
    projects,
    disciplines,
    groups,
    types,
    groupTypeMappings,
    originators,
    statuses,
    revisions,
    returnCodes,
    purposes,
  };
}
