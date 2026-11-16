-- Mixzine · esquema Postgres (también se aplica solo, ver src/server/db.ts)
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  nombre      TEXT NOT NULL,
  handle      TEXT UNIQUE NOT NULL,
  pass_hash   TEXT,
  foto        TEXT,
  spotify_id  TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fanzines (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data         JSONB NOT NULL,
  titulo       TEXT NOT NULL,
  artista      TEXT NOT NULL,
  genero       TEXT,
  emocion      TEXT NOT NULL,
  visibilidad  TEXT NOT NULL DEFAULT 'privado' CHECK (visibilidad IN ('privado','enlace','publico')),
  borrador     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fanzines_feed_idx ON fanzines (visibilidad, borrador, created_at DESC);
CREATE INDEX IF NOT EXISTS fanzines_user_idx ON fanzines (user_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS likes (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fanzine_id  TEXT NOT NULL REFERENCES fanzines(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, fanzine_id)
);
CREATE TABLE IF NOT EXISTS saved (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fanzine_id  TEXT NOT NULL REFERENCES fanzines(id) ON DELETE CASCADE,
  mensaje     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, fanzine_id)
);
CREATE TABLE IF NOT EXISTS notifs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  texto       TEXT NOT NULL,
  leida       BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifs_user_idx ON notifs (user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS assets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mime        TEXT NOT NULL,
  bytes       BYTEA,
  url         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Premium (pagos con Wompi: cada pago compra un periodo, sin renovación automática)
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_plan  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used    BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS payments (
  reference     TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL CHECK (plan IN ('mensual','anual')),
  amount_cents  BIGINT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'PENDING',
  wompi_id      TEXT,
  aplicado      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id, created_at DESC);

-- Recuperar contraseña (guardamos solo el hash del token)
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id, created_at DESC);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pass_changed_at TIMESTAMPTZ;
