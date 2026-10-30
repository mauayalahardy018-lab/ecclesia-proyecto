CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE states (
  code char(2) PRIMARY KEY,
  name text NOT NULL
);
CREATE TABLE municipalities (
  code char(5) PRIMARY KEY,
  state_code char(2) NOT NULL REFERENCES states(code),
  name text NOT NULL
);
CREATE INDEX municipalities_state_idx ON municipalities(state_code, name);
CREATE TABLE localities (
  code char(9) PRIMARY KEY,
  municipality_code char(5) NOT NULL REFERENCES municipalities(code),
  name text NOT NULL
);
CREATE INDEX localities_municipality_idx ON localities(municipality_code, name);

CREATE TABLE churches (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('catedral','basilica','parroquia','templo','capilla','santuario')),
  state_code char(2) NOT NULL REFERENCES states(code),
  municipality_code char(5) NOT NULL REFERENCES municipalities(code),
  locality_code char(9) NOT NULL REFERENCES localities(code),
  address text NOT NULL,
  capacity integer CHECK (capacity >= 0),
  construction_year integer CHECK (construction_year BETWEEN 1 AND 2100),
  phone text,
  email text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  timezone text NOT NULL DEFAULT 'America/Mexico_City',
  status text NOT NULL DEFAULT 'activa' CHECK (status IN ('activa','cerrada')),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX churches_public_filters_idx ON churches(state_code, municipality_code, locality_code, type) WHERE status = 'activa';
CREATE INDEX churches_name_idx ON churches(lower(name));

CREATE TABLE users (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('coordinacion','administrador_iglesia','tesorero')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_churches (
  user_id bigint NOT NULL REFERENCES users(id),
  church_id bigint NOT NULL REFERENCES churches(id),
  PRIMARY KEY (user_id, church_id)
);

CREATE TABLE heritage_criteria (
  id bigserial PRIMARY KEY,
  version text NOT NULL UNIQUE,
  reference_year integer NOT NULL,
  config jsonb NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX heritage_one_active_idx ON heritage_criteria(active) WHERE active;
CREATE TABLE heritage_objects (
  id bigserial PRIMARY KEY,
  church_id bigint NOT NULL REFERENCES churches(id),
  name text NOT NULL,
  type text NOT NULL,
  year_built integer,
  century integer,
  material text NOT NULL,
  conservation text NOT NULL,
  location_in_church text NOT NULL,
  inah_catalogued boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'vigente' CHECK (status IN ('vigente','perdido','prestado','baja')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((year_built IS NOT NULL) <> (century IS NOT NULL)),
  CHECK (year_built IS NULL OR year_built BETWEEN 1 AND 2100),
  CHECK (century IS NULL OR century BETWEEN 1 AND 21)
);
CREATE INDEX heritage_church_status_idx ON heritage_objects(church_id, status);

CREATE TABLE services (
  id bigserial PRIMARY KEY,
  church_id bigint NOT NULL REFERENCES churches(id),
  name text NOT NULL,
  requirements text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  appointment_required boolean NOT NULL DEFAULT false,
  price_kind text NOT NULL CHECK (price_kind IN ('fijo','gratuito','donativo')),
  price_cents bigint CHECK (price_cents >= 0),
  schedule_text text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  CHECK ((price_kind = 'fijo' AND price_cents IS NOT NULL) OR (price_kind <> 'fijo' AND price_cents IS NULL))
);
CREATE TABLE talks (
  id bigserial PRIMARY KEY,
  church_id bigint NOT NULL REFERENCES churches(id),
  type text NOT NULL,
  weekdays integer[] NOT NULL,
  local_time time NOT NULL,
  sessions integer NOT NULL CHECK (sessions > 0),
  price_cents bigint NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  capacity integer NOT NULL CHECK (capacity > 0),
  place text NOT NULL,
  instructor text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE priests (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE priest_churches (
  priest_id bigint NOT NULL REFERENCES priests(id),
  church_id bigint NOT NULL REFERENCES churches(id),
  PRIMARY KEY (priest_id, church_id)
);
CREATE TABLE mass_schedules (
  id bigserial PRIMARY KEY,
  church_id bigint NOT NULL REFERENCES churches(id),
  priest_id bigint NOT NULL REFERENCES priests(id),
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  local_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 1 AND 1440),
  kind text NOT NULL CHECK (kind IN ('diaria','dominical','especial')),
  language text NOT NULL DEFAULT 'español',
  active boolean NOT NULL DEFAULT true
);
CREATE INDEX mass_schedule_priest_idx ON mass_schedules(priest_id, weekday, local_time);
CREATE TABLE celebrations (
  id bigserial PRIMARY KEY,
  church_id bigint NOT NULL REFERENCES churches(id),
  schedule_id bigint REFERENCES mass_schedules(id),
  local_date date NOT NULL,
  starts_at timestamptz NOT NULL,
  planned_priest_id bigint REFERENCES priests(id),
  actual_priest_id bigint NOT NULL REFERENCES priests(id),
  substitution_reason text,
  changed_by bigint REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, local_date),
  CHECK ((planned_priest_id IS NULL OR planned_priest_id = actual_priest_id) OR (substitution_reason IS NOT NULL AND changed_by IS NOT NULL))
);

CREATE TABLE tithes (
  id bigserial PRIMARY KEY,
  celebration_id bigint NOT NULL UNIQUE REFERENCES celebrations(id),
  church_id bigint NOT NULL REFERENCES churches(id),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  captured_by bigint NOT NULL REFERENCES users(id),
  captured_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tithe_changes (
  id bigserial PRIMARY KEY,
  tithe_id bigint NOT NULL REFERENCES tithes(id),
  old_amount_cents bigint NOT NULL,
  new_amount_cents bigint NOT NULL,
  changed_by bigint NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tithes_church_idx ON tithes(church_id);

CREATE TABLE space_types (
  id bigserial PRIMARY KEY,
  church_id bigint NOT NULL REFERENCES churches(id),
  type text NOT NULL CHECK (type IN ('cripta','nicho','columbario','osario')),
  active boolean NOT NULL DEFAULT true,
  UNIQUE(church_id, type)
);
CREATE TABLE space_requests (
  id bigserial PRIMARY KEY,
  church_id bigint NOT NULL REFERENCES churches(id),
  space_type_id bigint NOT NULL REFERENCES space_types(id),
  folio text NOT NULL UNIQUE,
  access_key_hash text NOT NULL,
  applicant_name text NOT NULL,
  applicant_email text,
  applicant_phone text,
  status text NOT NULL DEFAULT 'solicitada' CHECK (status IN ('solicitada','en_revision','cotizada','sin_disponibilidad','aceptada','rechazada','vencida','cancelada')),
  quote_cents bigint CHECK (quote_cents >= 0),
  quote_conditions text,
  quote_issued_at timestamptz,
  quote_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX space_requests_church_status_idx ON space_requests(church_id, status);
CREATE TABLE space_request_changes (
  id bigserial PRIMARY KEY,
  request_id bigint NOT NULL REFERENCES space_requests(id),
  old_status text,
  new_status text NOT NULL,
  changed_by bigint REFERENCES users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  note text
);
