export type Role = "administrador" | "empleado";
export interface User {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono: number;
  fechaRegistro: string;
}
export interface Company {
  id: string;
  nombre: string;
  activa: boolean;
  razonSocial: string;
  identificacionFiscal: string;
  direccion: string;
}
export interface Context {
  usuario: User;
  empresa: Company | null;
  membresia: { id: string; rol: Role; activo: boolean } | null;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
export interface Employee {
  id: string;
  email: string;
  rol: Role;
  activo: boolean;
  usuarioId: number | null;
  fechaAcceso: string | null;
}
export interface Invitation {
  id: string;
  email: string;
  rol: Role;
  creada: string;
  expira: string;
  enviada: string | null;
  aceptada: string | null;
  revocada: string | null;
}
export interface Address {
  label: string;
  coordinates: [number, number];
}
export interface Option {
  empresa: "Uber" | "Cabify" | "DiDi";
  precio: number;
  tipo: string;
  duracionMin: number;
  idTipoServicio: number;
}
export interface Quote {
  id: string;
  expira: string;
  origen: Address;
  destino: Address;
  ruta: { distanciaKm: number; duracionMin: number };
  opciones: Option[];
  motivoViaje: string | null;
  moneda: string;
  fuente: string;
}
export interface Registration {
  id: string;
  viajeId: number;
  proveedor: string;
  recorrido: Quote;
  continuacion: { url: string; modo: "web" | "telefono"; mensaje: string };
}
export interface Trip {
  idViaje: number;
  idUsuario: number;
  calleOrigen: string;
  calleDestino: string;
  precioEstimado: number;
  fechaViaje: string;
  motivoViaje: string | null;
  estado: string;
  proveedor: string | null;
  canalOrigen: string;
  Usuario: { nombre: string; email: string };
  BusinessRegistro: {
    estado: string;
    creada: string;
    moneda: string;
    fuente: string;
  } | null;
}
export interface Summary {
  cantidad: number;
  totalEstimado: number;
  moneda: string;
  registrosConMoneda: number;
  registrosSinMoneda: number;
  proveedores: { proveedor: string; cantidad: number }[];
  actividad: {
    idUsuario: number;
    nombre: string;
    email: string;
    cantidad: number;
    totalEstimado: number;
  }[];
  diario: { fecha: string; cantidad: number; totalEstimado: number }[];
}
