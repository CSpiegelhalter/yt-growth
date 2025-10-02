-- Create "OAuthState" table
CREATE TABLE "public"."OAuthState" (
  "id" serial NOT NULL,
  "state" character varying(128) NOT NULL,
  "userId" integer NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "expiresAt" timestamptz NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_oauthstate_state" UNIQUE ("state"),
  CONSTRAINT "fk_oauthstate_user" FOREIGN KEY ("userId") REFERENCES "public"."User" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
