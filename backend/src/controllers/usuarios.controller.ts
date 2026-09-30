import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "@/lib/AppError";
import { URL_LOGIN } from "@/lib/emailTemplate";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { cedulaSchema, nombreSchema, passwordSchema, telefonoSchema } from "@/lib/validaciones";
import { notificar } from "@/services/notificaciones.service";

const ROLES_STAFF = ["SAC", "TALENTO_HUMANO", "GESTOR_DOCUMENTAL", "SUPER_USUARIO"] as const;

const crearUsuarioStaffSchema = z.object({
  cedula: cedulaSchema,
  nombres: nombreSchema,
  apellidos: nombreSchema,
  email: z.string().email(),
  password: passwordSchema,
  telefono: telefonoSchema,
  rol: z.enum(ROLES_STAFF),
});

/**
 * Crea una cuenta de personal interno (SAC, Talento Humano, Gestor Documental o
 * Super Usuario). A diferencia del docente, esta cuenta no se auto-registra:
 * la crea un Super Usuario existente. No tiene un registro Docente asociado.
 */
export const crearUsuarioStaff = async (req: Request, res: Response) => {
  const datos = crearUsuarioStaffSchema.parse(req.body);

  const existente = await prisma.usuario.findUnique({ where: { cedula: datos.cedula } });
  if (existente) {
    throw new AppError(409, "Ya existe un usuario con esta cédula");
  }

  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: datos.email,
    password: datos.password,
    email_confirm: true,
  });

  if (error || !authUser.user) {
    throw new AppError(400, `No se pudo crear el usuario: ${error?.message ?? "error desconocido"}`);
  }

  try {
    const usuario = await prisma.usuario.create({
      data: {
        id: authUser.user.id,
        cedula: datos.cedula,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        email: datos.email,
        telefono: datos.telefono,
        rol: datos.rol,
      },
    });

    await notificar({
      usuarioId: usuario.id,
      tipo: "REGISTRO",
      mensaje: `Se creó tu cuenta como ${datos.rol} en la plataforma de posesión docente.`,
      email: {
        asunto: "Tu cuenta fue creada",
        badgeTexto: "Cuenta creada",
        badgeTono: "info",
        encabezado: `¡Bienvenido/a, ${datos.nombres}!`,
        parrafos: [
          `Se creó tu cuenta con el rol <strong>${datos.rol}</strong> en la plataforma de Posesión Docente.`,
          `Usuario: <strong>${datos.email}</strong>`,
        ],
        ctaTexto: "Iniciar sesión",
        ctaUrl: URL_LOGIN,
      },
    });

    res.status(201).json({ usuario });
  } catch (err) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw err;
  }
};

const actualizarEstadoSchema = z.object({
  activo: z.boolean(),
});

/**
 * Activa/desactiva una cuenta (de cualquier rol). No se borra: conserva su
 * historial (documentos, validaciones). Al desactivarla también se bloquea su
 * sesión de Supabase Auth, para que no pueda ni siquiera obtener un token nuevo.
 */
export const actualizarEstadoActivo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo } = actualizarEstadoSchema.parse(req.body);

  if (id === req.usuario!.id) {
    throw new AppError(400, "No puedes desactivar tu propia cuenta");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new AppError(404, "Usuario no encontrado");

  await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: activo ? "none" : "876000h", // ~100 años: bloqueo indefinido
  });

  const actualizado = await prisma.usuario.update({ where: { id }, data: { activo } });

  res.json(actualizado);
};

const restablecerClaveSchema = z.object({
  passwordTemporal: passwordSchema.optional(),
});

/** Genera una clave temporal legible (evita caracteres ambiguos como 0/O, 1/l/I). */
const generarPasswordTemporal = () => {
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
};

/**
 * Restablece la clave de CUALQUIER usuario (de cualquier rol, incluido Docente).
 * Reemplaza el autoservicio de "olvidé mi contraseña" (removido a propósito: el
 * Super Usuario es el único que puede restablecer claves). Si no se indica
 * `passwordTemporal`, se genera una y se devuelve en la respuesta para que el
 * Super Usuario se la comunique al usuario por fuera de la plataforma. La cuenta
 * queda marcada con `debeCambiarPassword: true`: el frontend debe forzar la
 * pantalla de "elige tu nueva contraseña" (POST /api/auth/cambiar-password) antes
 * de dejarlo usar el resto de la app.
 */
export const restablecerClave = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { passwordTemporal } = restablecerClaveSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new AppError(404, "Usuario no encontrado");

  const nuevaPassword = passwordTemporal ?? generarPasswordTemporal();

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: nuevaPassword });
  if (error) {
    throw new AppError(400, `No se pudo restablecer la clave: ${error.message}`);
  }

  await prisma.usuario.update({ where: { id }, data: { debeCambiarPassword: true } });

  await notificar({
    usuarioId: id,
    tipo: "RESTABLECIMIENTO_CLAVE",
    mensaje: "Un Super Usuario restableció tu contraseña. Deberás elegir una nueva al iniciar sesión.",
  });

  res.json({ passwordTemporal: nuevaPassword });
};

/** Lista el personal interno (todo lo que no sea Docente). */
export const listarUsuariosStaff = async (_req: Request, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    where: { rol: { in: [...ROLES_STAFF] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      cedula: true,
      nombres: true,
      apellidos: true,
      email: true,
      telefono: true,
      rol: true,
      activo: true,
      debeCambiarPassword: true,
      createdAt: true,
    },
  });

  res.json(usuarios);
};
