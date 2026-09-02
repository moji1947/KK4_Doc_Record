import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/config/prisma";
import { generateNextDocumentNumber } from "../src/modules/numbering/numbering.service";

// Test นี้ต้องรันกับ PostgreSQL จริง (ไม่ mock) เพราะพิสูจน์พฤติกรรม row-level lock จริง
// รันด้วย: npm test (ต้อง docker compose up -d ก่อน และ migrate schema แล้ว)

const TEST_PARAMS = {
  projectCode: "TESTPRJ",
  originatorCode: "TESTORG",
  groupCode: "TESTGRP",
  typeCode: "TST",
};

describe("generateNextDocumentNumber — concurrency safety", () => {
  beforeAll(async () => {
    // เคลียร์ sequence เดิมของชุดทดสอบนี้ก่อนเริ่ม เผื่อรันซ้ำ
    const key = Object.values(TEST_PARAMS).join("-");
    await prisma.$executeRaw`DELETE FROM "document_number_sequence" WHERE "sequence_key" = ${key}`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("ออกเลขไม่ซ้ำกันเลย แม้ยิง request พร้อมกัน 30 ตัว", async () => {
    const promises = Array.from({ length: 30 }, () => generateNextDocumentNumber(TEST_PARAMS));
    const results = await Promise.all(promises);

    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(30);
  });

  it("เลขต่อเนื่องกันโดยไม่มี gap", async () => {
    const key = Object.values(TEST_PARAMS).join("-");
    await prisma.$executeRaw`DELETE FROM "document_number_sequence" WHERE "sequence_key" = ${key}`;

    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(await generateNextDocumentNumber(TEST_PARAMS));
    }

    const expected = [1, 2, 3, 4, 5].map(
      (n) =>
        `${TEST_PARAMS.projectCode}-${TEST_PARAMS.originatorCode}-${TEST_PARAMS.groupCode}-${TEST_PARAMS.typeCode}-${String(
          n
        ).padStart(4, "0")}`
    );

    expect(results).toEqual(expected);
  });
});
