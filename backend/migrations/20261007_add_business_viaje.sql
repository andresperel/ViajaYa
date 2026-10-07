BEGIN;

ALTER TABLE public."Viaje"
  ADD COLUMN "tipoViaje" text NOT NULL DEFAULT 'personal',
  ADD COLUMN "motivoViaje" text;

ALTER TABLE public."Viaje"
  ADD CONSTRAINT viaje_tipo_viaje_check
    CHECK ("tipoViaje" IN ('personal', 'business')),
  ADD CONSTRAINT viaje_motivo_viaje_length_check
    CHECK ("motivoViaje" IS NULL OR char_length("motivoViaje") <= 200);

COMMIT;
