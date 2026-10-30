CREATE TABLE IF NOT EXISTS jd_screenshots (
  id uuid PRIMARY KEY,
  content_hash text NOT NULL UNIQUE,
  source_path text NOT NULL,
  extracted_text text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('ready', 'failed')),
  error text,
  collected_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_descriptions (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  company text NOT NULL DEFAULT '',
  role_family text NOT NULL CHECK (role_family IN ('ai-architect', 'ai-platform-architect', 'other', 'unclassified')),
  posted_on date,
  collected_on date NOT NULL DEFAULT CURRENT_DATE,
  reviewed boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  source_fingerprint text UNIQUE,
  source_folder text,
  processing_mode text NOT NULL DEFAULT 'manual' CHECK (processing_mode IN ('manual', 'ai-automatic')),
  ai_confidence numeric CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jd_pages (
  screenshot_id uuid PRIMARY KEY REFERENCES jd_screenshots(id),
  job_id uuid NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
  page_order integer NOT NULL CHECK (page_order >= 0),
  UNIQUE (job_id, page_order)
);

CREATE TABLE IF NOT EXISTS technologies (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  category text NOT NULL
);

CREATE TABLE IF NOT EXISTS technology_aliases (
  alias text PRIMARY KEY,
  technology_id uuid NOT NULL REFERENCES technologies(id)
);

CREATE TABLE IF NOT EXISTS jd_technology_mentions (
  job_id uuid NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
  technology_id uuid NOT NULL REFERENCES technologies(id),
  evidence text NOT NULL,
  requirement text NOT NULL CHECK (requirement IN ('required', 'preferred', 'unspecified')),
  confidence numeric CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  PRIMARY KEY (job_id, technology_id)
);

CREATE INDEX IF NOT EXISTS jd_role_date_idx ON job_descriptions(role_family, collected_on);
CREATE INDEX IF NOT EXISTS jd_mentions_technology_idx ON jd_technology_mentions(technology_id);
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS source_fingerprint text;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS source_folder text;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS processing_mode text NOT NULL DEFAULT 'manual';
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS ai_confidence numeric;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE jd_technology_mentions ADD COLUMN IF NOT EXISTS confidence numeric;
CREATE UNIQUE INDEX IF NOT EXISTS jd_source_fingerprint_idx ON job_descriptions(source_fingerprint) WHERE source_fingerprint IS NOT NULL;
