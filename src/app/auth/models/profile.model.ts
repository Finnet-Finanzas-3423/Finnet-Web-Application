import { Roles } from "../../shared/roles.enum";

export interface Profile {
    id: number;
    name: string;
    fullName: string;
    email: string;
    role: Roles;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}