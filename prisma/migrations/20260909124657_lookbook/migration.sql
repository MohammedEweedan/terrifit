-- CreateTable
CREATE TABLE "LookbookLook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "imageUrl" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "productSlugs" TEXT NOT NULL DEFAULT '[]',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LookbookLook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LookbookLook_published_sortOrder_idx" ON "LookbookLook"("published", "sortOrder");
