env "dev" {
  url = "postgres://app:app@postgres:5432/appdb?sslmode=disable"
  migration {
    dir = "file://migrations"
  }
}

env "prod" {
  url = env("DATABASE_URL") # your RDS URL (used by CI/CD apply step)
  migration {
    dir = "file://migrations"
  }
}
