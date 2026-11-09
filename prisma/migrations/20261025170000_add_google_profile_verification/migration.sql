ALTER TABLE "users"
ADD COLUMN "googleProfilePicture" TEXT,
ADD COLUMN "googleEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "googleEmailVerifiedAt" TIMESTAMP(3);
