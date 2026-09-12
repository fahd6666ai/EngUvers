-- CreateTable
CREATE TABLE "circuit_projects" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vlxContent" JSONB NOT NULL,
    "thumbnailUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circuit_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "circuit_projects_ownerId_idx" ON "circuit_projects"("ownerId");

-- AddForeignKey
ALTER TABLE "circuit_projects" ADD CONSTRAINT "circuit_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
