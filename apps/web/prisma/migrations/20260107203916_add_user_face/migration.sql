-- CreateTable
CREATE TABLE "UserFaceReference" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" VARCHAR(64) NOT NULL,
    "storageKey" VARCHAR(512) NOT NULL,
    "mime" VARCHAR(64) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFaceReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_face_ref_user" ON "UserFaceReference"("userId");

-- CreateIndex
CREATE INDEX "idx_user_face_ref_default" ON "UserFaceReference"("userId", "isDefault");
