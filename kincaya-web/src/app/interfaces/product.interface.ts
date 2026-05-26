export interface AdminProduct {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  imagen: string;
  stock: number;
  activo: boolean;
  eliminado: boolean;
  fechaCreacionIso: string;
}
