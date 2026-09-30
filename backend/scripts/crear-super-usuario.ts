import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { supabaseAdmin } from "../src/lib/supabase";

/**
 * Bootstrap: crea el primer Super Usuario. Solo debería hacer falta correr esto
 * una vez por entorno (local, y luego en el VPS), ya que el endpoint
 * POST /api/usuarios para crear personal interno requiere estar autenticado
 * como Super Usuario — el primero no puede crearse por ahí.
 *
 * Uso: npm run crear:super-usuario -- <cedula> <nombres> <apellidos> <email> <password>
 */
async function main() {
  const [cedula, nombres, apellidos, email, password] = process.argv.slice(2);

  if (!cedula || !nombres || !apellidos || !email || !password) {
    console.error("Uso: npm run crear:super-usuario -- <cedula> <nombres> <apellidos> <email> <password>");
    process.exit(1);
  }

  const existente = await prisma.usuario.findUnique({ where: { cedula } });
  if (existente) {
    console.error(`Ya existe un usuario con la cédula ${cedula} (rol: ${existente.rol})`);
    process.exit(1);
  }

  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !authUser.user) {
    console.error(`No se pudo crear el usuario en Supabase Auth: ${error?.message ?? "error desconocido"}`);
    process.exit(1);
  }

  await prisma.usuario.create({
    data: { id: authUser.user.id, cedula, nombres, apellidos, email, rol: "SUPER_USUARIO" },
  });

  console.log(`Super Usuario creado: ${email} (cédula ${cedula})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
