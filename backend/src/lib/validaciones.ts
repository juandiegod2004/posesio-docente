import { z } from "zod";

/**
 * Reglas compartidas por cualquier endpoint que reciba datos de una persona
 * (registro de docente, creación de personal interno). Existen porque el
 * frontend valida lo mismo pero eso no impide que alguien golpee la API
 * directamente saltándose el formulario.
 */

export const cedulaSchema = z
  .string()
  .regex(/^\d+$/, "La cédula solo debe contener dígitos")
  .min(5, "La cédula debe tener al menos 5 dígitos")
  .max(10, "La cédula no debe superar los 10 dígitos");

export const telefonoSchema = z
  .string()
  .regex(/^\d{10}$/, "El teléfono debe tener exactamente 10 dígitos, sin espacios ni código de país")
  .optional();

const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü'\s-]+$/;

export const nombreSchema = z
  .string()
  .min(1, "Este campo es obligatorio")
  .max(50, "Máximo 50 caracteres")
  .regex(NOMBRE_REGEX, "Solo se permiten letras, espacios, guiones y apóstrofes");

export const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");
