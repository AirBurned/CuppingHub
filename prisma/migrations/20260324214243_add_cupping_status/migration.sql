-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CuppingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CuppingSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CuppingSession" ("createdAt", "createdById", "date", "id", "name", "notes", "updatedAt") SELECT "createdAt", "createdById", "date", "id", "name", "notes", "updatedAt" FROM "CuppingSession";
DROP TABLE "CuppingSession";
ALTER TABLE "new_CuppingSession" RENAME TO "CuppingSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
