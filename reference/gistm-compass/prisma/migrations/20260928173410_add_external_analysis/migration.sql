-- CreateTable
CREATE TABLE "ExternalAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExternalAnalysis_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExternalAnalysis_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAnalysis_installationId_requirementId_source_key" ON "ExternalAnalysis"("installationId", "requirementId", "source");
