ALTER TABLE churches ADD COLUMN capacity_is_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN churches.capacity_is_demo IS
  'La capacidad fue creada para la semilla académica; no representa un aforo verificado del templo real';
