BEGIN;
CREATE TABLE IF NOT EXISTS public."EmpresaCorporativa" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 100),
  codigo text UNIQUE NOT NULL,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public."EmpresaUsuario" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresaId" uuid NOT NULL REFERENCES public."EmpresaCorporativa"(id),
  email text UNIQUE NOT NULL CHECK (email = lower(email)),
  activo boolean NOT NULL DEFAULT true,
  "usuarioId" bigint UNIQUE REFERENCES public."Usuario"("idUsuario"),
  "fechaAcceso" timestamptz,
  UNIQUE ("empresaId", email)
);
ALTER TABLE public."Viaje" ADD COLUMN IF NOT EXISTS "empresaId" uuid REFERENCES public."EmpresaCorporativa"(id);
CREATE INDEX IF NOT EXISTS viaje_empresa_idx ON public."Viaje"("empresaId");
ALTER TABLE public."EmpresaCorporativa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmpresaUsuario" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."EmpresaCorporativa", public."EmpresaUsuario" TO service_role;
-- Comprobar la habilitación en la misma transacción del guardado. El bloqueo
-- impide que una inactivación concurrente se interponga entre verificar e insertar.
CREATE OR REPLACE FUNCTION public.validar_empresa_viaje()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE empresa_habilitada uuid;
BEGIN
  IF NEW."tipoViaje" = 'business' THEN
    SELECT "empresaId" INTO empresa_habilitada
      FROM public."EmpresaUsuario"
      WHERE "usuarioId" = NEW."idUsuario" AND activo = true
      FOR SHARE;
    IF empresa_habilitada IS NULL OR NEW."empresaId" IS DISTINCT FROM empresa_habilitada THEN
      RAISE EXCEPTION 'No tenés acceso activo a esta empresa.' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW."empresaId" IS NOT NULL THEN
    RAISE EXCEPTION 'Un viaje personal no puede asociarse a una empresa.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validar_empresa_viaje_insert ON public."Viaje";
CREATE TRIGGER validar_empresa_viaje_insert BEFORE INSERT ON public."Viaje"
  FOR EACH ROW EXECUTE FUNCTION public.validar_empresa_viaje();
NOTIFY pgrst, 'reload schema';
COMMIT;
