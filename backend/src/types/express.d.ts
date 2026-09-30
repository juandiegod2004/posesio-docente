import type { RolNombre } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        cedula: string;
        email: string;
        rol: RolNombre;
      };
    }
  }
}

export {};
