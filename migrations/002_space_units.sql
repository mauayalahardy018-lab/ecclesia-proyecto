CREATE TABLE space_units (
  id bigserial PRIMARY KEY,
  church_id bigint NOT NULL REFERENCES churches(id),
  space_type_id bigint NOT NULL REFERENCES space_types(id),
  code text NOT NULL,
  status text NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible','asignada')),
  assigned_request_id bigint UNIQUE REFERENCES space_requests(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(church_id, code),
  CHECK ((status='disponible' AND assigned_request_id IS NULL) OR (status='asignada' AND assigned_request_id IS NOT NULL))
);
CREATE INDEX space_units_church_status_idx ON space_units(church_id,status);
