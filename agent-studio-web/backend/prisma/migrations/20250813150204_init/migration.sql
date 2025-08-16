-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'STOPPED',
    "configuration" TEXT,
    "systemPrompt" TEXT,
    "userId" TEXT NOT NULL,
    "lastActivity" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_agents" ("configuration", "createdAt", "description", "id", "lastActivity", "name", "status", "systemPrompt", "type", "updatedAt", "userId") SELECT "configuration", "createdAt", "description", "id", "lastActivity", "name", "status", "systemPrompt", "type", "updatedAt", "userId" FROM "agents";
DROP TABLE "agents";
ALTER TABLE "new_agents" RENAME TO "agents";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
