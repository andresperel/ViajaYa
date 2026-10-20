-- REVIEW ONLY for remote execution. Startup never executes remote migrations.
-- Tests apply this file only to disposable local PostgreSQL.
-- Prerequisites: approved 20261007 and 20261014 migrations and an inspected remote
-- schema. Usuario.idUsuario / Viaje.idViaje must support bigint identifiers.
-- Existing memberships remain empleados; no automatic promotion of legacy users.
BEGIN;

-- Fail before any DDL if prerequisite tables are absent, identifiers cannot hold
-- the new safe-integer range, or any new object already exists. Never rerun an
-- applied migration, and never silently patch an unknown partial deployment.
DO $$
BEGIN
  IF to_regclass('public."Usuario"') IS NULL OR to_regclass('public."Viaje"') IS NULL
    OR to_regclass('public."EmpresaCorporativa"') IS NULL OR to_regclass('public."EmpresaUsuario"') IS NULL THEN
    RAISE EXCEPTION 'Faltan tablas previas: ejecutar primero el diagnóstico de solo lectura.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public."Viaje"'::regclass AND attname='idViaje' AND atttypid='bigint'::regtype AND NOT attisdropped)
    OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public."Usuario"'::regclass AND attname='idUsuario' AND atttypid='bigint'::regtype AND NOT attisdropped) THEN
    RAISE EXCEPTION 'Los identificadores deben ser bigint. No se hará una conversión automática de datos Mobile.';
  END IF;
  IF to_regclass('public."BusinessSesion"') IS NOT NULL OR to_regclass('public."BusinessInvitacion"') IS NOT NULL
    OR to_regclass('public."BusinessComparacion"') IS NOT NULL OR to_regclass('public."BusinessRegistro"') IS NOT NULL
    OR to_regclass('public."BusinessAuditoria"') IS NOT NULL OR to_regclass('public.business_web_viaje_id') IS NOT NULL
    OR to_regprocedure('public.business_web_command(bigint,text,jsonb)') IS NOT NULL THEN
    RAISE EXCEPTION 'Business Web ya está aplicado o parcialmente presente. No repetir: revisar el catálogo.';
  END IF;
END;
$$;

ALTER TABLE public."EmpresaCorporativa"
  ADD COLUMN IF NOT EXISTS activa boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "razonSocial" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "identificacionFiscal" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS direccion text NOT NULL DEFAULT '';
ALTER TABLE public."EmpresaUsuario" ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'empleado';
ALTER TABLE public."EmpresaUsuario" ADD CONSTRAINT empresa_usuario_rol_web CHECK (rol IN ('administrador','empleado'));
ALTER TABLE public."Viaje" ADD COLUMN IF NOT EXISTS "canalOrigen" text NOT NULL DEFAULT 'mobile';
ALTER TABLE public."Viaje" ADD CONSTRAINT viaje_canal_web CHECK ("canalOrigen" IN ('mobile','business_web'));

CREATE TABLE public."BusinessSesion" (
  "tokenHash" text PRIMARY KEY CHECK ("tokenHash" ~ '^[a-f0-9]{64}$'),
  "usuarioId" bigint NOT NULL REFERENCES public."Usuario"("idUsuario"),
  creada timestamptz NOT NULL DEFAULT now(),
  expira timestamptz NOT NULL
);
CREATE INDEX business_sesion_expira ON public."BusinessSesion"(expira);
CREATE TABLE public."BusinessInvitacion" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresaId" uuid NOT NULL REFERENCES public."EmpresaCorporativa"(id),
  email text NOT NULL CHECK (email = lower(email) AND char_length(email) <= 100),
  rol text NOT NULL CHECK (rol IN ('administrador','empleado')),
  "tokenHash" text UNIQUE NOT NULL CHECK ("tokenHash" ~ '^[a-f0-9]{64}$'),
  "invitanteId" bigint NOT NULL REFERENCES public."Usuario"("idUsuario"),
  creada timestamptz NOT NULL DEFAULT now(),
  expira timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  enviada timestamptz,
  aceptada timestamptz,
  revocada timestamptz,
  "aceptadaPor" bigint REFERENCES public."Usuario"("idUsuario")
);
CREATE INDEX business_invitacion_empresa ON public."BusinessInvitacion"("empresaId",creada DESC);
CREATE UNIQUE INDEX business_invitacion_pendiente ON public."BusinessInvitacion"("empresaId",email)
  WHERE aceptada IS NULL AND revocada IS NULL;
CREATE TABLE public."BusinessComparacion" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresaId" uuid NOT NULL REFERENCES public."EmpresaCorporativa"(id),
  "usuarioId" bigint NOT NULL REFERENCES public."Usuario"("idUsuario"),
  datos jsonb NOT NULL,
  creada timestamptz NOT NULL DEFAULT now(),
  expira timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);
CREATE INDEX business_comparacion_expira ON public."BusinessComparacion"(expira);
-- Separate range from Date.now() used by legacy Mobile. Within JS safe integers.
CREATE SEQUENCE public.business_web_viaje_id START WITH 2000000000000000 MAXVALUE 9007199254740991;
CREATE TABLE public."BusinessRegistro" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "viajeId" bigint UNIQUE NOT NULL REFERENCES public."Viaje"("idViaje"),
  "comparacionId" uuid UNIQUE NOT NULL REFERENCES public."BusinessComparacion"(id),
  "usuarioId" bigint NOT NULL REFERENCES public."Usuario"("idUsuario"),
  "empresaId" uuid NOT NULL REFERENCES public."EmpresaCorporativa"(id),
  clave uuid NOT NULL,
  proveedor text NOT NULL CHECK (proveedor IN ('Uber','Cabify','DiDi')),
  estado text NOT NULL DEFAULT 'intencion_registrada' CHECK (estado = 'intencion_registrada'),
  moneda text NOT NULL DEFAULT 'ARS' CHECK (moneda = 'ARS'),
  fuente text NOT NULL DEFAULT 'modelo_orientativo_viajaya',
  creada timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("usuarioId",clave)
);
CREATE TABLE public."BusinessAuditoria" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "empresaId" uuid NOT NULL REFERENCES public."EmpresaCorporativa"(id),
  "actorId" bigint NOT NULL REFERENCES public."Usuario"("idUsuario"),
  accion text NOT NULL,
  "recursoId" text,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_viaje_historial ON public."Viaje"("empresaId","fechaViaje" DESC,"idViaje" DESC) WHERE "tipoViaje" = 'business';
CREATE INDEX business_registro_empresa ON public."BusinessRegistro"("empresaId",creada DESC);

-- Extend the pre-existing insert guard with company status. Mobile defaults and
-- request/response formats remain unchanged; active existing companies still pass.
CREATE OR REPLACE FUNCTION public.validar_empresa_viaje()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE selected_company uuid;
BEGIN
  IF NEW."tipoViaje"='business' THEN
    PERFORM 1 FROM public."EmpresaCorporativa" WHERE id=NEW."empresaId" AND activa FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Empresa inactiva' USING ERRCODE='42501'; END IF;
    SELECT "empresaId" INTO selected_company FROM public."EmpresaUsuario"
      WHERE "usuarioId"=NEW."idUsuario" AND activo FOR SHARE;
    IF selected_company IS NULL OR selected_company IS DISTINCT FROM NEW."empresaId" THEN
      RAISE EXCEPTION 'Sin acceso a esta empresa' USING ERRCODE='42501';
    END IF;
  ELSIF NEW."empresaId" IS NOT NULL THEN
    RAISE EXCEPTION 'Viaje personal con empresa' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

-- No public table policies: browsers use Express, never service_role or custom
-- Mobile JWTs directly against these tables. Existing Mobile policies untouched.
ALTER TABLE public."BusinessSesion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BusinessInvitacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BusinessComparacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BusinessRegistro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BusinessAuditoria" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."BusinessSesion",public."BusinessInvitacion",public."BusinessComparacion",public."BusinessRegistro",public."BusinessAuditoria" FROM PUBLIC,anon,authenticated;
GRANT ALL ON public."BusinessSesion",public."BusinessInvitacion",public."BusinessComparacion",public."BusinessRegistro",public."BusinessAuditoria" TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.business_web_viaje_id,public."BusinessAuditoria_id_seq" TO service_role;

CREATE FUNCTION public.business_web_command(p_actor bigint,p_action text,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public,pg_temp AS $$
DECLARE
  u public."Usuario"%ROWTYPE;
  m public."EmpresaUsuario"%ROWTYPE;
  target public."EmpresaUsuario"%ROWTYPE;
  company public."EmpresaCorporativa"%ROWTYPE;
  inv public."BusinessInvitacion"%ROWTYPE;
  quote public."BusinessComparacion"%ROWTYPE;
  reg public."BusinessRegistro"%ROWTYPE;
  chosen jsonb;
  answer jsonb;
  target_id uuid;
  new_trip bigint;
  date_from date;
  date_to date;
BEGIN
  -- Lock account for concurrent creation/acceptance. Other commands serialize on
  -- the company row, including last-administrator checks and access revocation.
  SELECT * INTO u FROM public."Usuario" WHERE "idUsuario" = p_actor FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cuenta no disponible' USING ERRCODE='42501'; END IF;

  IF p_action = 'crear_empresa' THEN
    IF EXISTS(SELECT 1 FROM public."EmpresaUsuario" WHERE "usuarioId"=p_actor OR email=lower(u.email)) THEN
      RAISE EXCEPTION 'La cuenta ya tiene una asociación empresarial' USING ERRCODE='23505';
    END IF;
    IF char_length(trim(p_data->>'nombre')) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'Nombre inválido' USING ERRCODE='22023'; END IF;
    INSERT INTO public."EmpresaCorporativa"(nombre,codigo,"razonSocial","identificacionFiscal",direccion)
      VALUES(trim(p_data->>'nombre'),upper(replace(gen_random_uuid()::text,'-','')),coalesce(p_data->>'razonSocial',''),coalesce(p_data->>'identificacionFiscal',''),coalesce(p_data->>'direccion','')) RETURNING * INTO company;
    INSERT INTO public."EmpresaUsuario"("empresaId",email,"usuarioId",rol,"fechaAcceso") VALUES(company.id,lower(u.email),p_actor,'administrador',now());
    INSERT INTO public."BusinessAuditoria"("empresaId","actorId",accion) VALUES(company.id,p_actor,p_action);
    RETURN jsonb_build_object('id',company.id);
  END IF;

  IF p_action = 'aceptar_invitacion' THEN
    -- Find tenant first, then lock company before invitation to keep lock order.
    SELECT "empresaId" INTO target_id FROM public."BusinessInvitacion" WHERE "tokenHash"=p_data->>'tokenHash';
    IF NOT FOUND THEN RAISE EXCEPTION 'Invitación no disponible' USING ERRCODE='42501'; END IF;
    SELECT * INTO company FROM public."EmpresaCorporativa" WHERE id=target_id FOR UPDATE;
    SELECT * INTO inv FROM public."BusinessInvitacion" WHERE "tokenHash"=p_data->>'tokenHash' FOR UPDATE;
    IF NOT company.activa OR inv.revocada IS NOT NULL OR inv.aceptada IS NOT NULL OR inv.expira<=now() OR inv.enviada IS NULL OR inv.email<>lower(u.email) THEN
      RAISE EXCEPTION 'Invitación no disponible para esta cuenta' USING ERRCODE='42501';
    END IF;
    SELECT * INTO m FROM public."EmpresaUsuario" WHERE "usuarioId"=p_actor OR email=lower(u.email) FOR UPDATE;
    IF FOUND THEN
      IF m."empresaId"<>company.id OR (m."usuarioId" IS NOT NULL AND m."usuarioId"<>p_actor) OR m.activo AND m."usuarioId" IS NOT NULL THEN
        RAISE EXCEPTION 'Cuenta ya asociada' USING ERRCODE='23505';
      END IF;
      UPDATE public."EmpresaUsuario" SET "usuarioId"=p_actor,activo=true,rol=inv.rol,"fechaAcceso"=now() WHERE id=m.id;
    ELSE
      INSERT INTO public."EmpresaUsuario"("empresaId",email,"usuarioId",rol,"fechaAcceso") VALUES(company.id,lower(u.email),p_actor,inv.rol,now());
    END IF;
    UPDATE public."BusinessInvitacion" SET aceptada=now(),"aceptadaPor"=p_actor WHERE id=inv.id;
    INSERT INTO public."BusinessAuditoria"("empresaId","actorId",accion,"recursoId") VALUES(company.id,p_actor,p_action,inv.id::text);
    RETURN jsonb_build_object('id',company.id);
  END IF;

  SELECT * INTO m FROM public."EmpresaUsuario" WHERE "usuarioId"=p_actor;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sin empresa' USING ERRCODE='42501'; END IF;
  SELECT * INTO company FROM public."EmpresaCorporativa" WHERE id=m."empresaId" FOR UPDATE;
  -- Refresh after acquiring tenant lock; a concurrent revocation may have won.
  SELECT * INTO m FROM public."EmpresaUsuario" WHERE "usuarioId"=p_actor;
  IF NOT m.activo OR NOT company.activa THEN RAISE EXCEPTION 'Acceso inactivo' USING ERRCODE='42501'; END IF;

  IF p_action IN ('crear_invitacion','revocar_invitacion','actualizar_miembro','actualizar_empresa','estadisticas') AND m.rol<>'administrador' THEN
    RAISE EXCEPTION 'Administrador requerido' USING ERRCODE='42501';
  END IF;
  IF p_action = 'actualizar_empresa' THEN
    IF char_length(trim(p_data->>'nombre')) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'Nombre inválido' USING ERRCODE='22023'; END IF;
    UPDATE public."EmpresaCorporativa" SET nombre=trim(p_data->>'nombre'),"razonSocial"=coalesce(p_data->>'razonSocial',''),"identificacionFiscal"=coalesce(p_data->>'identificacionFiscal',''),direccion=coalesce(p_data->>'direccion','') WHERE id=company.id;
    answer := jsonb_build_object('id',company.id);
  ELSIF p_action = 'crear_invitacion' THEN
    IF p_data->>'rol' NOT IN ('administrador','empleado') OR p_data->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Invitación inválida' USING ERRCODE='22023'; END IF;
    IF EXISTS(SELECT 1 FROM public."EmpresaUsuario" WHERE email=p_data->>'email' AND ("empresaId"<>company.id OR activo AND "usuarioId" IS NOT NULL)) THEN
      RAISE EXCEPTION 'Correo ya asociado' USING ERRCODE='23505';
    END IF;
    UPDATE public."BusinessInvitacion" SET revocada=now() WHERE "empresaId"=company.id AND email=p_data->>'email' AND aceptada IS NULL AND revocada IS NULL AND expira<=now();
    INSERT INTO public."BusinessInvitacion"("empresaId",email,rol,"tokenHash","invitanteId") VALUES(company.id,lower(p_data->>'email'),p_data->>'rol',p_data->>'tokenHash',p_actor) RETURNING * INTO inv;
    answer := jsonb_build_object('id',inv.id);
  ELSIF p_action = 'revocar_invitacion' THEN
    UPDATE public."BusinessInvitacion" SET revocada=now() WHERE id=(p_data->>'id')::uuid AND "empresaId"=company.id AND aceptada IS NULL AND revocada IS NULL RETURNING * INTO inv;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invitación no disponible' USING ERRCODE='P0002'; END IF;
    answer := jsonb_build_object('id',inv.id);
  ELSIF p_action = 'actualizar_miembro' THEN
    IF p_data->>'rol' NOT IN ('administrador','empleado') OR jsonb_typeof(p_data->'activo')<>'boolean' THEN RAISE EXCEPTION 'Rol inválido' USING ERRCODE='22023'; END IF;
    SELECT * INTO target FROM public."EmpresaUsuario" WHERE id=(p_data->>'id')::uuid AND "empresaId"=company.id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Miembro no disponible' USING ERRCODE='P0002'; END IF;
    IF target."usuarioId" IS NULL AND p_data->>'rol'='administrador' THEN
      RAISE EXCEPTION 'El administrador debe tener una cuenta vinculada' USING ERRCODE='22023';
    END IF;
    IF target.rol='administrador' AND target.activo AND (p_data->>'rol'<>'administrador' OR NOT (p_data->>'activo')::boolean)
      AND (SELECT count(*) FROM public."EmpresaUsuario" WHERE "empresaId"=company.id AND activo AND rol='administrador' AND "usuarioId" IS NOT NULL)<=1 THEN
      RAISE EXCEPTION 'No se puede quitar el último administrador' USING ERRCODE='P0001';
    END IF;
    UPDATE public."EmpresaUsuario" SET activo=(p_data->>'activo')::boolean,rol=p_data->>'rol' WHERE id=target.id;
    answer := jsonb_build_object('id',target.id);
  ELSIF p_action = 'crear_comparacion' THEN
    IF jsonb_typeof(p_data->'datos'->'opciones')<>'array' OR jsonb_array_length(p_data->'datos'->'opciones')<>3 THEN RAISE EXCEPTION 'Comparación inválida' USING ERRCODE='22023'; END IF;
    INSERT INTO public."BusinessComparacion"("empresaId","usuarioId",datos) VALUES(company.id,p_actor,p_data->'datos') RETURNING * INTO quote;
    RETURN jsonb_build_object('id',quote.id,'expira',quote.expira);
  ELSIF p_action = 'registrar_viaje' THEN
    -- Both caller key and comparison have unique constraints. Retries after quote
    -- expiry still return the same intent, never a new trip or altered provider.
    SELECT * INTO reg FROM public."BusinessRegistro" WHERE "usuarioId"=p_actor AND clave=(p_data->>'clave')::uuid;
    IF NOT FOUND THEN
      SELECT * INTO reg FROM public."BusinessRegistro" WHERE "usuarioId"=p_actor AND "comparacionId"=(p_data->>'comparacionId')::uuid;
    END IF;
    IF FOUND THEN
      IF reg."empresaId"<>company.id OR reg."comparacionId"<>(p_data->>'comparacionId')::uuid OR reg.proveedor<>p_data->>'proveedor' THEN RAISE EXCEPTION 'Conflicto de idempotencia' USING ERRCODE='23505'; END IF;
      SELECT * INTO quote FROM public."BusinessComparacion" WHERE id=reg."comparacionId";
      RETURN jsonb_build_object('id',reg.id,'viajeId',reg."viajeId",'proveedor',reg.proveedor,'recorrido',quote.datos,'repetido',true);
    END IF;
    SELECT * INTO quote FROM public."BusinessComparacion" WHERE id=(p_data->>'comparacionId')::uuid AND "empresaId"=company.id AND "usuarioId"=p_actor FOR UPDATE;
    IF NOT FOUND OR quote.expira<=now() THEN RAISE EXCEPTION 'Comparación vencida o no disponible' USING ERRCODE='P0002'; END IF;
    SELECT value INTO chosen FROM jsonb_array_elements(quote.datos->'opciones') WHERE value->>'empresa'=p_data->>'proveedor';
    IF chosen IS NULL OR (chosen->>'precio')::numeric<0 THEN RAISE EXCEPTION 'Alternativa inválida' USING ERRCODE='22023'; END IF;
    new_trip := nextval('public.business_web_viaje_id');
    INSERT INTO public."Viaje"("idViaje","calleOrigen","alturaOrigen","calleDestino","alturaDestino","precioEstimado","tiempoEstimado","fechaViaje",estado,"fechaConfirmacion","idUsuario","idTipoServicio","tipoViaje","motivoViaje","empresaId",proveedor,"canalOrigen")
      VALUES(new_trip,quote.datos->'origen'->>'label',0,quote.datos->'destino'->>'label',0,(chosen->>'precio')::numeric,(chosen->>'duracionMin')::numeric,(now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date,'pendiente',NULL,p_actor,(chosen->>'idTipoServicio')::bigint,'business',quote.datos->>'motivoViaje',company.id,lower(p_data->>'proveedor'),'business_web');
    INSERT INTO public."BusinessRegistro"("viajeId","comparacionId","usuarioId","empresaId",clave,proveedor) VALUES(new_trip,quote.id,p_actor,company.id,(p_data->>'clave')::uuid,p_data->>'proveedor') RETURNING * INTO reg;
    answer := jsonb_build_object('id',reg.id,'viajeId',new_trip,'proveedor',reg.proveedor,'recorrido',quote.datos,'repetido',false);
  ELSIF p_action IN ('estadisticas','resumen_personal') THEN
    date_from := (p_data->>'desde')::date; date_to := (p_data->>'hasta')::date;
    IF date_from IS NULL OR date_to IS NULL OR date_from>date_to OR date_to-date_from>366 THEN RAISE EXCEPTION 'Período inválido' USING ERRCODE='22023'; END IF;
    WITH scoped AS (
      SELECT v.*,r.moneda,r.fuente,coalesce(v.proveedor, CASE v."idTipoServicio" WHEN 1 THEN 'uber' WHEN 2 THEN 'didi' WHEN 3 THEN 'cabify' ELSE 'desconocido' END) AS provider_name
      FROM public."Viaje" v LEFT JOIN public."BusinessRegistro" r ON r."viajeId"=v."idViaje"
      WHERE v."empresaId"=company.id AND v."tipoViaje"='business' AND v."fechaViaje" BETWEEN date_from AND date_to AND (p_action='estadisticas' OR v."idUsuario"=p_actor)
    )
    SELECT jsonb_build_object(
      'cantidad',count(*),
      'totalEstimado',coalesce(sum("precioEstimado") FILTER(WHERE moneda='ARS'),0),
      'registrosConMoneda',count(*) FILTER(WHERE moneda='ARS'),
      'registrosSinMoneda',count(*) FILTER(WHERE moneda IS NULL),
      'moneda','ARS',
      'proveedores',(SELECT coalesce(jsonb_agg(to_jsonb(g)),'[]'::jsonb) FROM (SELECT provider_name AS proveedor,count(*) AS cantidad FROM scoped GROUP BY provider_name ORDER BY count(*) DESC,provider_name) g),
      'actividad',(SELECT coalesce(jsonb_agg(to_jsonb(g)),'[]'::jsonb) FROM (SELECT s."idUsuario",usr.nombre,usr.email,count(*) AS cantidad,coalesce(sum(s."precioEstimado") FILTER(WHERE s.moneda='ARS'),0) AS "totalEstimado" FROM scoped s JOIN public."Usuario" usr ON usr."idUsuario"=s."idUsuario" GROUP BY s."idUsuario",usr.nombre,usr.email ORDER BY count(*) DESC,s."idUsuario") g),
      'diario',(SELECT coalesce(jsonb_agg(to_jsonb(g)),'[]'::jsonb) FROM (SELECT "fechaViaje" AS fecha,count(*) AS cantidad,coalesce(sum("precioEstimado") FILTER(WHERE moneda='ARS'),0) AS "totalEstimado" FROM scoped GROUP BY "fechaViaje" ORDER BY "fechaViaje") g)
    ) INTO answer FROM scoped;
    RETURN answer;
  ELSE RAISE EXCEPTION 'Operación no válida' USING ERRCODE='22023';
  END IF;
  INSERT INTO public."BusinessAuditoria"("empresaId","actorId",accion,"recursoId") VALUES(company.id,p_actor,p_action,coalesce(answer->>'id',p_data->>'id'));
  RETURN answer;
END;
$$;
REVOKE ALL ON FUNCTION public.business_web_command(bigint,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.business_web_command(bigint,text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
