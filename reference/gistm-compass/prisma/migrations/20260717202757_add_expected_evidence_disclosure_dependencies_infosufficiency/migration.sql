-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN "aiInfoSufficiency" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "finalInfoSufficiency" TEXT;

-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN "expectedEvidence" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "area" TEXT,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "closureEvidence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dependsOnId" TEXT,
    CONSTRAINT "Action_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Action_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Action" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Action" ("area", "assessmentId", "closureEvidence", "createdAt", "description", "dueDate", "id", "priority", "responsible", "status", "updatedAt") SELECT "area", "assessmentId", "closureEvidence", "createdAt", "description", "dueDate", "id", "priority", "responsible", "status", "updatedAt" FROM "Action";
DROP TABLE "Action";
ALTER TABLE "new_Action" RENAME TO "Action";
CREATE TABLE "new_DocumentFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT,
    "areaResponsible" TEXT,
    "confidentiality" TEXT NOT NULL DEFAULT 'INTERNO',
    "validUntil" DATETIME,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extractedText" TEXT,
    "installationId" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetAudience" TEXT,
    "disclosureApproved" BOOLEAN NOT NULL DEFAULT false,
    "disclosureApprovedBy" TEXT,
    "disclosureApprovedAt" DATETIME,
    "previousVersionId" TEXT,
    CONSTRAINT "DocumentFile_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DocumentFile_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "DocumentFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DocumentFile" ("areaResponsible", "confidentiality", "extractedText", "fileName", "filePath", "id", "installationId", "mimeType", "title", "type", "uploadedAt", "validUntil", "version") SELECT "areaResponsible", "confidentiality", "extractedText", "fileName", "filePath", "id", "installationId", "mimeType", "title", "type", "uploadedAt", "validUntil", "version" FROM "DocumentFile";
DROP TABLE "DocumentFile";
ALTER TABLE "new_DocumentFile" RENAME TO "DocumentFile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
