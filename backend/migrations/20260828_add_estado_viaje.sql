alter table public."Viaje"
  add column if not exists estado text not null default 'pendiente',
  add column if not exists "fechaConfirmacion" timestamptz,
  add column if not exists proveedor text,
  add column if not exists "idViajeProveedor" text,
  add column if not exists "estadoProveedor" text,
  add column if not exists "ultimoEventoProveedor" text;

alter table public."Viaje"
  drop constraint if exists viaje_estado_valido;

alter table public."Viaje"
  add constraint viaje_estado_valido
  check (estado in ('pendiente', 'realizado', 'cancelado'));

create index if not exists viaje_usuario_estado_idx
  on public."Viaje" ("idUsuario", estado);

create unique index if not exists viaje_proveedor_id_idx
  on public."Viaje" (proveedor, "idViajeProveedor")
  where "idViajeProveedor" is not null;
