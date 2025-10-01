-- Create "User" table
CREATE TABLE "public"."User" (
  "id" serial NOT NULL,
  "email" character varying(255) NOT NULL,
  "name" character varying(255) NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_user_email" UNIQUE ("email")
);
-- Create index "idx_user_email" to table: "User"
CREATE INDEX "idx_user_email" ON "public"."User" ("email");
-- Create "Channel" table
CREATE TABLE "public"."Channel" (
  "id" serial NOT NULL,
  "userId" integer NOT NULL,
  "youtubeChannelId" character varying(128) NOT NULL,
  "title" character varying(255) NULL,
  "thumbnailUrl" text NULL,
  "connectedAt" timestamptz NOT NULL DEFAULT now(),
  "lastSyncedAt" timestamptz NULL,
  "syncStatus" character varying(32) NOT NULL DEFAULT 'idle',
  "syncError" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_channel_owner_youtube" UNIQUE ("userId", "youtubeChannelId"),
  CONSTRAINT "fk_channel_user" FOREIGN KEY ("userId") REFERENCES "public"."User" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_channel_user" to table: "Channel"
CREATE INDEX "idx_channel_user" ON "public"."Channel" ("userId");
-- Create "GoogleAccount" table
CREATE TABLE "public"."GoogleAccount" (
  "id" serial NOT NULL,
  "userId" integer NOT NULL,
  "provider" character varying(50) NOT NULL DEFAULT 'google',
  "providerAccountId" character varying(255) NOT NULL,
  "refreshTokenEnc" text NULL,
  "scopes" text NULL,
  "tokenExpiresAt" timestamptz NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_google_provider_account" UNIQUE ("provider", "providerAccountId"),
  CONSTRAINT "fk_google_user" FOREIGN KEY ("userId") REFERENCES "public"."User" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "Video" table
CREATE TABLE "public"."Video" (
  "id" serial NOT NULL,
  "channelId" integer NOT NULL,
  "youtubeVideoId" character varying(128) NOT NULL,
  "title" character varying(255) NULL,
  "publishedAt" timestamptz NULL,
  "durationSec" integer NULL,
  "tags" text NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_video_channel_youtube" UNIQUE ("channelId", "youtubeVideoId"),
  CONSTRAINT "fk_video_channel" FOREIGN KEY ("channelId") REFERENCES "public"."Channel" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_video_channel" to table: "Video"
CREATE INDEX "idx_video_channel" ON "public"."Video" ("channelId");
