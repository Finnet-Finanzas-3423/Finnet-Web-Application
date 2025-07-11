import { Roles } from "../../shared/roles.enum";

export interface Profile {
  id: number;
  email: string;
  ruc: string;
  razonSocial: string;
  direccion: string;
  sectorEmpresarial: string;
  role: Roles;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
