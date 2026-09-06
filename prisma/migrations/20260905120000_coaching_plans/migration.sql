CREATE TABLE "CoachingPlan" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "day" TEXT NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0, "state" TEXT NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CoachingPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CoachingPlan_userId_day_key" ON "CoachingPlan"("userId", "day");
ALTER TABLE "CoachingPlan" ADD CONSTRAINT "CoachingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "CoachingEvent" (
  "id" TEXT NOT NULL, "planId" TEXT NOT NULL, "revision" INTEGER NOT NULL,
  "action" TEXT NOT NULL, "snapshot" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachingEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CoachingEvent_planId_revision_key" ON "CoachingEvent"("planId", "revision");
ALTER TABLE "CoachingEvent" ADD CONSTRAINT "CoachingEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "CoachingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
