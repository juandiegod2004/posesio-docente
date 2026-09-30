import { z } from 'zod';

// Las fechas nunca pueden ser futuras (nacimiento/expedición de cédula ya ocurrieron).
const fechaPasadaSchema = (label: string) =>
  z.coerce
    .date({ message: `Ingresa una ${label} válida` })
    .max(new Date(), { message: `${label[0].toUpperCase()}${label.slice(1)} no puede ser una fecha futura` });

export const informacionAdicionalSchema = z
  .object({
    sexo: z.enum(['MASCULINO', 'FEMENINO'], { message: 'Selecciona el sexo' }),
    fechaNacimiento: fechaPasadaSchema('fecha de nacimiento'),
    paisNacimiento: z.string().min(1, 'Selecciona el país de nacimiento'),
    // Solo obligatorios si paisNacimiento === "Colombia" (ver .superRefine abajo).
    departamentoNacimientoId: z.string().optional(),
    ciudadNacimientoId: z.string().optional(),
    cantidadHijos: z.coerce
      .number({ message: 'Ingresa la cantidad de hijos' })
      .int('Debe ser un número entero')
      .min(0, 'No puede ser negativo'),
    fechaExpedicionCedula: fechaPasadaSchema('fecha de expedición'),
    departamentoExpedicionId: z.string().min(1, 'Selecciona el departamento de expedición'),
    ciudadExpedicionId: z.string().min(1, 'Selecciona la ciudad de expedición'),
    estadoCivil: z.string().min(1, 'Selecciona el estado civil'),
    tipoSangre: z.string().min(1, 'Selecciona el tipo de sangre'),
    direccion: z.string().min(1, 'Ingresa tu dirección'),
  })
  .superRefine((data, ctx) => {
    if (data.paisNacimiento === 'Colombia') {
      if (!data.departamentoNacimientoId) {
        ctx.addIssue({
          code: 'custom',
          path: ['departamentoNacimientoId'],
          message: 'Selecciona el departamento de nacimiento',
        });
      }
      if (!data.ciudadNacimientoId) {
        ctx.addIssue({
          code: 'custom',
          path: ['ciudadNacimientoId'],
          message: 'Selecciona la ciudad de nacimiento',
        });
      }
    }
  });

// Input (lo que RHF maneja mientras el usuario escribe, antes de coerción) vs output (lo que
// llega a onSubmit ya validado y coercido: fechas como Date, cantidadHijos como number).
export type InformacionAdicionalFormInput = z.input<typeof informacionAdicionalSchema>;
export type InformacionAdicionalFormData = z.output<typeof informacionAdicionalSchema>;
