-- CreateIndex
CREATE INDEX "Trope_parentId_idx" ON "Trope"("parentId");

-- CreateIndex
CREATE INDEX "TropeLike_createdAt_idx" ON "TropeLike"("createdAt");

-- CreateIndex
CREATE INDEX "Work_createdAt_idx" ON "Work"("createdAt");

-- CreateIndex
CREATE INDEX "WorkTropeVote_createdAt_idx" ON "WorkTropeVote"("createdAt");
