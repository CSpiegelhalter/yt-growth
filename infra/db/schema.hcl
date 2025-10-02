schema "public" {}

table "User" {
  schema = schema.public

  column "id" {
    type = serial
    null = false
  }
  column "email" {
    type = varchar(255)
    null = false
  }
  column "name" {
    type = varchar(255)
    null = true
  }
  column "passwordHash" {
  type = varchar(255)
  null = true
  }
  column "createdAt" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }
  column "updatedAt" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  primary_key {
    columns = [column.id]
  }

  unique "uq_user_email" {
    columns = [column.email]
  }

  index "idx_user_email" {
    columns = [column.email]
  }
}

table "GoogleAccount" {
  schema = schema.public

  column "id" {
    type = serial
    null = false
  }
  column "userId" {
    type = int
    null = false
  }
  column "provider" {
    type    = varchar(50)
    null    = false
    default = "google"
  }
  column "providerAccountId" {
    type = varchar(255)
    null = false
  } // Google sub
  column "refreshTokenEnc" {
    type = text
    null = true
  } // encrypted refresh token
  column "scopes" {
    type = text
    null = true
  } // space-separated scopes
  column "tokenExpiresAt" {
    type = timestamptz
    null = true
  }
  column "createdAt" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }
  column "updatedAt" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  primary_key {
    columns = [column.id]
  }

  unique "uq_google_provider_account" {
    columns = [column.provider, column.providerAccountId]
  }

  foreign_key "fk_google_user" {
    columns     = [column.userId]
    ref_columns = [table.User.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}

table "Channel" {
  schema = schema.public

  column "id" {
    type = serial
    null = false
  }
  column "userId" {
    type = int
    null = false
  } // owner in your app
  column "youtubeChannelId" {
    type = varchar(128)
    null = false
  }
  column "title" {
    type = varchar(255)
    null = true
  }
  column "thumbnailUrl" {
    type = text
    null = true
  }
  column "connectedAt" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }
  column "lastSyncedAt" {
    type = timestamptz
    null = true
  }
  column "syncStatus" {
    type    = varchar(32)
    null    = false
    default = "idle"
  } // idle|running|error
  column "syncError" {
    type = text
    null = true
  }

  primary_key {
    columns = [column.id]
  }

  unique "uq_channel_owner_youtube" {
    columns = [column.userId, column.youtubeChannelId]
  }

  index "idx_channel_user" {
    columns = [column.userId]
  }

  foreign_key "fk_channel_user" {
    columns     = [column.userId]
    ref_columns = [table.User.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}

table "Video" {
  schema = schema.public

  column "id" {
    type = serial
    null = false
  }
  column "channelId" {
    type = int
    null = false
  }
  column "youtubeVideoId" {
    type = varchar(128)
    null = false
  }
  column "title" {
    type = varchar(255)
    null = true
  }
  column "publishedAt" {
    type = timestamptz
    null = true
  }
  column "durationSec" {
    type = int
    null = true
  }
  column "tags" {
    type = text
    null = true
  } // store comma/JSON if you like
  column "createdAt" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }
  column "updatedAt" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  primary_key {
    columns = [column.id]
  }

  unique "uq_video_channel_youtube" {
    columns = [column.channelId, column.youtubeVideoId]
  }

  index "idx_video_channel" {
    columns = [column.channelId]
  }

  foreign_key "fk_video_channel" {
    columns     = [column.channelId]
    ref_columns = [table.Channel.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}

table "OAuthState" {
  schema = schema.public

  column "id" {
    type = serial
    null = false
  }
  column "state" {
    type = varchar(128)
    null = false
  }
  column "userId" {
    type = int
    null = false
  }
  column "createdAt" {
    type = timestamptz
    null = false
    default = sql("now()")
  }
  column "expiresAt" {
    type = timestamptz
    null = false
  }

  primary_key { columns = [column.id] }
  unique "uq_oauthstate_state" { columns = [column.state] }

  foreign_key "fk_oauthstate_user" {
    columns     = [column.userId]
    ref_columns = [table.User.column.id]
    on_delete   = CASCADE
  }
}
