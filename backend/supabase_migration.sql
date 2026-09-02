-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CREATOR', 'REVIEWER', 'CONSOLIDATOR', 'APPROVER', 'CC');

-- CreateTable
CREATE TABLE "project_master" (
    "project_code" TEXT NOT NULL,
    "conzol_project_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "plant" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "project_master_pkey" PRIMARY KEY ("project_code")
);

-- CreateTable
CREATE TABLE "discipline_master" (
    "discipline_code" TEXT NOT NULL,
    "discipline_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "discipline_master_pkey" PRIMARY KEY ("discipline_code")
);

-- CreateTable
CREATE TABLE "document_group_master" (
    "group_code" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "discipline_code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "document_group_master_pkey" PRIMARY KEY ("group_code")
);

-- CreateTable
CREATE TABLE "document_type_master" (
    "type_code" TEXT NOT NULL,
    "type_description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "document_type_master_pkey" PRIMARY KEY ("type_code")
);

-- CreateTable
CREATE TABLE "group_type_mapping" (
    "group_code" TEXT NOT NULL,
    "type_code" TEXT NOT NULL,

    CONSTRAINT "group_type_mapping_pkey" PRIMARY KEY ("group_code","type_code")
);

-- CreateTable
CREATE TABLE "originator_master" (
    "originator_code" TEXT NOT NULL,
    "originator_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "originator_master_pkey" PRIMARY KEY ("originator_code")
);

-- CreateTable
CREATE TABLE "status_master" (
    "status_code" TEXT NOT NULL,
    "status_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "status_master_pkey" PRIMARY KEY ("status_code")
);

-- CreateTable
CREATE TABLE "revision_master" (
    "revision_code" TEXT NOT NULL,
    "revision_description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "revision_master_pkey" PRIMARY KEY ("revision_code")
);

-- CreateTable
CREATE TABLE "return_code_master" (
    "return_code" TEXT NOT NULL,
    "return_description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "return_code_master_pkey" PRIMARY KEY ("return_code")
);

-- CreateTable
CREATE TABLE "purpose_of_issue_master" (
    "purpose_code" TEXT NOT NULL,
    "purpose_description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "purpose_of_issue_master_pkey" PRIMARY KEY ("purpose_code")
);

-- CreateTable
CREATE TABLE "document_register" (
    "document_id" TEXT NOT NULL,
    "document_no" TEXT NOT NULL,
    "project_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originator_code" TEXT NOT NULL,
    "group_code" TEXT NOT NULL,
    "type_code" TEXT NOT NULL,
    "current_revision" TEXT NOT NULL,
    "current_status" TEXT NOT NULL,
    "plan_date" TIMESTAMP(3),
    "remarks" TEXT,
    "erp_synced" BOOLEAN NOT NULL DEFAULT false,
    "erp_synced_at" TIMESTAMP(3),
    "erp_synced_by" TEXT,
    "erp_doc_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_register_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "document_submission" (
    "submission_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "submitted_date" TIMESTAMP(3) NOT NULL,
    "purpose_code" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "received_by" TEXT,
    "return_code" TEXT,
    "attachment_url" TEXT,
    "erp_synced" BOOLEAN NOT NULL DEFAULT false,
    "erp_synced_at" TIMESTAMP(3),
    "erp_synced_by" TEXT,
    "erp_doc_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_submission_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "document_number_sequence" (
    "sequence_key" TEXT NOT NULL,
    "last_sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_number_sequence_pkey" PRIMARY KEY ("sequence_key")
);

-- CreateTable
CREATE TABLE "role_assignment_matrix" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_code" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "role_assignment_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "discipline_code" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_register_document_no_key" ON "document_register"("document_no");

-- CreateIndex
CREATE INDEX "document_register_project_code_idx" ON "document_register"("project_code");

-- CreateIndex
CREATE INDEX "document_register_group_code_idx" ON "document_register"("group_code");

-- CreateIndex
CREATE INDEX "document_register_current_status_idx" ON "document_register"("current_status");

-- CreateIndex
CREATE INDEX "document_register_erp_synced_idx" ON "document_register"("erp_synced");

-- CreateIndex
CREATE INDEX "document_submission_document_id_idx" ON "document_submission"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignment_matrix_user_id_group_code_role_key" ON "role_assignment_matrix"("user_id", "group_code", "role");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- AddForeignKey
ALTER TABLE "document_group_master" ADD CONSTRAINT "document_group_master_discipline_code_fkey" FOREIGN KEY ("discipline_code") REFERENCES "discipline_master"("discipline_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_type_mapping" ADD CONSTRAINT "group_type_mapping_group_code_fkey" FOREIGN KEY ("group_code") REFERENCES "document_group_master"("group_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_type_mapping" ADD CONSTRAINT "group_type_mapping_type_code_fkey" FOREIGN KEY ("type_code") REFERENCES "document_type_master"("type_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_project_code_fkey" FOREIGN KEY ("project_code") REFERENCES "project_master"("project_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_originator_code_fkey" FOREIGN KEY ("originator_code") REFERENCES "originator_master"("originator_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_group_code_fkey" FOREIGN KEY ("group_code") REFERENCES "document_group_master"("group_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_type_code_fkey" FOREIGN KEY ("type_code") REFERENCES "document_type_master"("type_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_current_revision_fkey" FOREIGN KEY ("current_revision") REFERENCES "revision_master"("revision_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_current_status_fkey" FOREIGN KEY ("current_status") REFERENCES "status_master"("status_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_submission" ADD CONSTRAINT "document_submission_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document_register"("document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_submission" ADD CONSTRAINT "document_submission_revision_fkey" FOREIGN KEY ("revision") REFERENCES "revision_master"("revision_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_submission" ADD CONSTRAINT "document_submission_purpose_code_fkey" FOREIGN KEY ("purpose_code") REFERENCES "purpose_of_issue_master"("purpose_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_submission" ADD CONSTRAINT "document_submission_return_code_fkey" FOREIGN KEY ("return_code") REFERENCES "return_code_master"("return_code") ON DELETE SET NULL ON UPDATE CASCADE;

