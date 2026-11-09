CREATE TABLE "telegram_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "botTokenEncrypted" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "telegram_notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "telegram_notifications_userId_key" ON "telegram_notifications"("userId");
ALTER TABLE "telegram_notifications" ADD CONSTRAINT "telegram_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;