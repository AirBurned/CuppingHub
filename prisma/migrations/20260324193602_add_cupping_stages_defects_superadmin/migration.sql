-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "aromaGround" REAL,
    "aromaGroundComment" TEXT,
    "aromaBrewed" REAL,
    "aromaBrewedComment" TEXT,
    "flavor" REAL,
    "aftertaste" REAL,
    "acidity" REAL,
    "body" REAL,
    "sweetness" REAL,
    "cleanCup" REAL,
    "overall" REAL,
    "totalScore" REAL,
    "descriptors" TEXT,
    "comment" TEXT,
    "defectScore" REAL,
    "defectComment" TEXT,
    "aroma" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Evaluation" ("acidity", "aftertaste", "aroma", "body", "cleanCup", "comment", "createdAt", "descriptors", "flavor", "id", "lotId", "overall", "sweetness", "totalScore", "updatedAt", "userId") SELECT "acidity", "aftertaste", "aroma", "body", "cleanCup", "comment", "createdAt", "descriptors", "flavor", "id", "lotId", "overall", "sweetness", "totalScore", "updatedAt", "userId" FROM "Evaluation";
DROP TABLE "Evaluation";
ALTER TABLE "new_Evaluation" RENAME TO "Evaluation";
CREATE UNIQUE INDEX "Evaluation_userId_lotId_key" ON "Evaluation"("userId", "lotId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
