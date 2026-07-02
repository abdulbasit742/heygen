CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  script TEXT,
  status TEXT DEFAULT 'draft',
  output_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_voice_id TEXT NOT NULL
);

CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  format TEXT DEFAULT 'mp4',
  resolution TEXT DEFAULT '1080x1920',
  created_at TIMESTAMPTZ DEFAULT now()
);
