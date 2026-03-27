-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "roaster" TEXT NOT NULL,
    "farm" TEXT,
    "variety" TEXT,
    "processing" TEXT NOT NULL,
    "roastLevel" TEXT NOT NULL,
    "roastDate" DATETIME,
    "descriptors" TEXT,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "aroma" REAL NOT NULL,
    "flavor" REAL NOT NULL,
    "aftertaste" REAL NOT NULL,
    "acidity" REAL NOT NULL,
    "body" REAL NOT NULL,
    "sweetness" REAL NOT NULL,
    "cleanCup" REAL NOT NULL,
    "overall" REAL NOT NULL,
    "totalScore" REAL NOT NULL,
    "descriptors" TEXT,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotId" TEXT NOT NULL,
    "brewMethod" TEXT NOT NULL,
    "recipeType" TEXT NOT NULL DEFAULT 'UNOFFICIAL',
    "authorId" TEXT NOT NULL,
    "dose" REAL,
    "yield" REAL,
    "ratio" TEXT,
    "grind" TEXT,
    "temperature" REAL,
    "brewTime" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipe_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recipe_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_userId_lotId_key" ON "Evaluation"("userId", "lotId");
