-- Modify "User" table
ALTER TABLE "public"."User" ADD COLUMN "passwordHash" character varying(255) NULL;
