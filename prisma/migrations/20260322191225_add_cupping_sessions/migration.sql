-- CreateTable
CREATE TABLE "CuppingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CuppingSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CuppingSessionLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CuppingSessionLot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CuppingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CuppingSessionLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CuppingSessionLot_sessionId_lotId_key" ON "CuppingSessionLot"("sessionId", "lotId");
