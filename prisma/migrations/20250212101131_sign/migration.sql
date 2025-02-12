-- CreateTable
CREATE TABLE "Sign" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "definition" TEXT,
    "mediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sign_pkey" PRIMARY KEY ("id")
);
