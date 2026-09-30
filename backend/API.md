# API — Posesión Docente (SED Magdalena)

Referencia de todos los endpoints del backend, para usar desde el frontend.

## Base URL

- Local: `http://localhost:4000`
- Todas las rutas de negocio cuelgan de `/api`. `GET /health` no lleva `/api`.

## Autenticación

La API no maneja login propio — usa **Supabase Auth**. Desde el frontend:

1. Inicializa el cliente de Supabase con `SUPABASE_URL` y `SUPABASE_ANON_KEY` (ambas son públicas, se pueden exponer en el frontend). **Nunca** expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend — esa es solo del backend.
2. Loguea con `supabase.auth.signInWithPassword({ email, password })`. Eso devuelve un `access_token`.
3. Manda ese token en cada request a esta API:

   ```
   Authorization: Bearer <access_token>
   ```

Si el token falta, es inválido, o el usuario está inactivo (baneado), la API responde `401` o `403`.

## Roles

`SUPER_USUARIO` | `SAC` | `TALENTO_HUMANO` | `DOCENTE` | `GESTOR_DOCUMENTAL`

`SAC` y `TALENTO_HUMANO` (antes un único rol `VALIDADOR`, dividido 2026-09-30) son las dos oficinas de la secretaría que validan documentos, cada una en su carril — ninguna puede validar lo de la otra (`PATCH /api/documentos/:id/validar` responde `403` si lo intenta):
- **`SAC`**: valida EXCLUSIVAMENTE la autorización de notificación electrónica (`esRequisitoRegistro: true`). El docente se desbloquea para el resto del checklist apenas la sube (no espera esta aprobación) — si SAC la rechaza, el docente se re-bloquea hasta corregirla. Recibe los correos de "nuevo registro" y "autorización pendiente de revisión".
- **`TALENTO_HUMANO`**: valida el resto de los 24 documentos del checklist normal. Recibe el correo de "documentación lista para revisión" (cuando el docente termina de subir los 24).
- **`SUPER_USUARIO`** no tiene esta restricción: puede validar cualquier documento (control total), y se le notifica de los 3 eventos.
- Ambos (`SAC`/`TALENTO_HUMANO`) comparten el mismo acceso de solo-lectura a todos los docentes/documentos (listado, checklist, perfil, descarga) — la separación es solo sobre qué pueden *aprobar* y qué correos reciben, no sobre qué pueden *ver*.

El rol `ADMINISTRATIVO` existió hasta 2026-09-30 y fue eliminado (no cumplía ninguna función distinta de `VALIDADOR`/`SUPER_USUARIO` — decisión explícita del usuario). No confundir con `TipoPosesion.ADMINISTRATIVO` (tipo de aspirante, campo `Docente.tipoPosesion`), que sigue existiendo y es algo completamente distinto — ver más abajo.

`GESTOR_DOCUMENTAL` (antes `PRE_ACTA`, renombrado 2026-09-30) es un rol de acceso
**restringido**: solo puede ver el perfil y los documentos de un docente cuando
`documentacionAprobada = true` (sus 25 documentos ya fueron aprobados). Mientras un
docente esté en proceso, este rol no tiene ninguna visibilidad sobre él — no
aparece en `GET /api/docentes`, `GET /api/documentos` lo excluye, y el detalle de
ese docente responde `403`. Tampoco recibe las notificaciones de "nuevo registro",
"documento pendiente de revisión" ni "documentación lista para revisión" (no puede
actuar sobre nada de eso). No puede validar/rechazar documentos (`PATCH
/api/documentos/:id/validar` sigue exclusivo de `SAC`/`TALENTO_HUMANO`/`SUPER_USUARIO`,
cada uno en su carril — ver nota de roles arriba).

## Formato de errores

Todas las respuestas de error tienen esta forma:

```json
{ "error": "mensaje legible" }
```

Errores de validación (body inválido) además incluyen `detalles`:

```json
{ "error": "Datos inválidos", "detalles": { "campo": ["mensaje"] } }
```

---

## Auth

### `POST /api/auth/registro`

Auto-registro de un **Docente** (los demás roles los crea un Super Usuario, ver más abajo). Público, no requiere token.

```json
// Body
{
  "cedula": "123456789",
  "tipoDocumento": "CEDULA_CIUDADANIA", // obligatorio — ver enum TipoDocumentoIdentidad más abajo
  "nombres": "Ana",
  "apellidos": "Pérez",
  "email": "ana@example.com",
  "password": "mínimo 8 caracteres",
  "telefono": "opcional",
  "tipoPosesion": "DOCENTE" // opcional, default "DOCENTE" — o "ADMINISTRATIVO"
}
```

`tipoDocumento` se guarda en `Usuario.tipoDocumento` (junto a `cedula`, que en realidad es el número de documento sin importar el tipo). Las cuentas creadas antes de este campo quedaron con `CEDULA_CIUDADANIA` por defecto.

Crea el usuario en Supabase Auth + un registro `Usuario` (rol `DOCENTE`) + `Docente` asociado. `Docente.registroCompletado` queda en `false` hasta que suba el documento de autorización de notificación electrónica — **ya no se sube durante el registro**: el docente debe iniciar sesión después y subirlo desde su checklist (ver `GET /api/docentes/:id/checklist` y `POST /api/documentos` más abajo). No hay auto-login: el frontend debe redirigir a `/login` tras un `201` exitoso.

Dispara dos notificaciones (in-app + email, tipo `REGISTRO`): un correo de bienvenida al propio docente, y una alerta a `SAC` + `SUPER_USUARIO` (no a `TALENTO_HUMANO` ni `GESTOR_DOCUMENTAL`, ver nota de roles arriba — el registro es competencia de SAC, que es quien revisará la autorización que el docente subirá a continuación) avisando que hay un nuevo registro.

`tipoPosesion` distingue si el aspirante es un docente o personal administrativo tomando posesión (ambos pasan por el mismo checklist de 25 documentos) — **no tiene nada que ver con `Usuario.rol`**, que sigue siendo `DOCENTE` para los dos casos a nivel de permisos. No confundir con el antiguo rol `ADMINISTRATIVO` de personal interno (eliminado 2026-09-30, ver nota de roles arriba): compartían palabra por coincidencia, pero eran dos cosas completamente distintas.

Respuesta `201`:
```json
{ "usuario": { "id": "...", "cedula": "...", "docente": { "id": "...", "registroCompletado": false, "tipoPosesion": "DOCENTE", "documentacionFinalizada": false, "documentacionFinalizadaEn": null, "documentacionAprobada": false, "documentacionAprobadaEn": null, ... }, ... } }
```

Errores: `409` si la cédula ya existe, `400` si el correo ya está registrado (mensaje literal de Supabase Auth).

### `GET /api/auth/me`

Requiere token. Devuelve el usuario autenticado (con `docente` incluido si aplica).

`debeCambiarPassword` viene en el nivel raíz (cualquier rol, no solo `DOCENTE`): es `true` cuando un Super Usuario le restableció la clave (ver `PATCH /api/usuarios/:id/clave`) y el usuario todavía no eligió una propia. **Frontend:** si es `true`, bloquear toda la app con un modal obligatorio para cambiar la clave (`POST /api/auth/cambiar-password`) — no hay "olvidé mi contraseña" por correo, ese flujo se eliminó a propósito.

Cuando el usuario es `DOCENTE`, `docente` trae además `tipoDocumentoAutorizacionId` y `documentoAutorizacionRechazado`:

```json
{
  "id": "...",
  "rol": "DOCENTE",
  "docente": {
    "id": "...",
    "registroCompletado": true,
    "tipoPosesion": "DOCENTE",
    "documentacionFinalizada": false,
    "documentacionFinalizadaEn": null,
    "documentacionAprobada": false,
    "documentacionAprobadaEn": null,
    "debeCompletarInformacionAdicional": true,
    "informacionAdicionalCompleta": false,
    "sexo": null,
    "fechaNacimiento": null,
    "paisNacimiento": null,
    "departamentoNacimientoId": null,
    "ciudadNacimientoId": null,
    "cantidadHijos": null,
    "fechaExpedicionCedula": null,
    "departamentoExpedicionId": null,
    "ciudadExpedicionId": null,
    "estadoCivil": null,
    "tipoSangre": null,
    "direccion": null,
    "tipoDocumentoAutorizacionId": "b2f14249-6b46-4ddb-9c0e-0c66f480ead8",
    "documentoAutorizacionRechazado": {
      "documentoId": "...",
      "tipoDocumentoId": "...",
      "comentario": "Firma ilegible, favor resubir.",
      "actualizadoEn": "2026-09-26T20:59:53.807Z"
    },
    "documentoAutorizacionPendiente": false
  }
}
```

Los tres (`tipoDocumentoAutorizacionId`/`documentoAutorizacionRechazado`/`documentoAutorizacionPendiente`) se refieren al mismo documento — "autorización de notificación electrónica" (Ciudadano Digital), el único con `tipoDocumento.esRequisitoRegistro: true`, que ya no se sube durante el registro (ver `POST /api/auth/registro`) sino desde el checklist normal.

**Cambio 2026-09-30 (revierte el cambio de 2026-09-29): subir la autorización vuelve a desbloquear el resto del checklist de inmediato, sin esperar aprobación de SAC.** `registroCompletado` pasa a `true` en el mismo request de `POST /api/documentos` que sube este documento (ver ahí). Si SAC la rechaza después, `registroCompletado` vuelve a `false` y el docente se bloquea otra vez hasta que la resuba corregida — al resubirla se desbloquea de nuevo, sin esperar nueva aprobación.

- `tipoDocumentoAutorizacionId` viene **siempre** que el usuario sea `DOCENTE` (nunca `null` en la práctica, salvo que el catálogo de tipos de documento esté mal sembrado). Sirve para que el frontend arme el flujo de subida (`POST /api/documentos` con este `tipoDocumentoId`) sin depender de que ya exista un `Documento` — es lo que hace falta para bloquear al docente con "sube tu autorización para continuar" mientras `registroCompletado` sea `false` (o sea, cuando **nunca se ha subido nada todavía**, o cuando lo subió y se lo rechazaron).
- `documentoAutorizacionRechazado` es `null` mientras ese documento no exista o no esté `RECHAZADO`; si no es `null`, hay que bloquear con el motivo del rechazo (`comentario`) — este es el caso de "ya se subió pero lo rechazaron".
- `documentoAutorizacionPendiente` es `true` cuando el docente ya la subió y está `EN_REVISION`, esperando que SAC la revise. **Ya NO bloquea navegación** (desde el cambio 2026-09-30) — es puramente informativo, útil si el frontend quiere mostrar un badge tipo "en revisión" sobre ese ítem del checklist, pero `registroCompletado` ya es `true` en ese momento así que el docente sigue de largo con el resto.

**Frontend — 2 estados posibles mientras `registroCompletado` sea `false`, mutuamente excluyentes:**
1. Nunca subió nada → `documentoAutorizacionRechazado === null` → modal "sube tu autorización".
2. Rechazada → `documentoAutorizacionRechazado !== null` → modal con el motivo del rechazo, exige volver a subir.

Los tres campos se recalculan en cada request, no hay que "limpiarlos" a mano. Bloquear la navegación con el modal correspondiente hasta que `registroCompletado` pase a `true` (vía `GET /api/auth/me`, `proxy.ts` o al montar el dashboard).

**Información adicional (nuevo, 2026-09-29):** `debeCompletarInformacionAdicional` + `informacionAdicionalCompleta` gatean el módulo de carga de documentos — ver `PATCH /:id/informacion-adicional` más abajo y la sección "Carga de documentos bloqueada" en `POST /api/documentos`. Los demás campos (`sexo`, `fechaNacimiento`, `paisNacimiento`, etc.) vienen `null` hasta que el docente los complete; una vez completados, quedan disponibles acá para prellenar el formulario si el docente quiere editarlos.

**Frontend:** cuando `debeCompletarInformacionAdicional === true && informacionAdicionalCompleta === false`, bloquear el checklist/carga de documentos con un modal/formulario obligatorio — mismo patrón que los otros dos gates de esta sección. Los docentes con `debeCompletarInformacionAdicional === false` (todos los que ya existían antes de este feature) nunca ven este bloqueo, aunque tengan estos campos en `null`.

### `POST /api/auth/cambiar-password`

Requiere token. Cualquier usuario autenticado (de cualquier rol) cambia su propia contraseña. Reemplaza el flujo de "olvidé mi contraseña" por correo (eliminado): ahora solo el Super Usuario puede restablecer una clave (ver `PATCH /api/usuarios/:id/clave` más abajo), y el propio usuario la cambia definitivamente por acá.

```json
// Body
{ "passwordNueva": "mínimo 8 caracteres" }
```

Respuesta: el `Usuario` actualizado (con `debeCambiarPassword: false`). Usar esto tanto para el cambio obligatorio tras un restablecimiento como para un cambio voluntario cualquiera (ej. una pantalla de "cambiar mi contraseña" en el perfil).

---

## Usuarios (solo Super Usuario)

Todas las rutas bajo `/api/usuarios` requieren token de un usuario con rol `SUPER_USUARIO`.

### `POST /api/usuarios`

Crea una cuenta de personal interno (no Docente).

```json
// Body
{
  "cedula": "888888888",
  "nombres": "María",
  "apellidos": "Gómez",
  "email": "maria@example.com",
  "password": "mínimo 8 caracteres",
  "telefono": "opcional",
  "rol": "SAC" // SAC | TALENTO_HUMANO | GESTOR_DOCUMENTAL | SUPER_USUARIO
}
```

Respuesta `201`: `{ "usuario": { ... } }`. Errores: `409` si la cédula ya existe.

### `GET /api/usuarios`

Lista el personal interno (no incluye docentes — esos están en `/api/docentes`).

```json
[
  { "id": "...", "cedula": "...", "nombres": "...", "apellidos": "...", "email": "...", "telefono": null, "rol": "SAC", "activo": true, "debeCambiarPassword": false, "createdAt": "..." }
]
```

### `PATCH /api/usuarios/:id/activo`

Activa o desactiva **cualquier cuenta, de cualquier rol** (incluido Docente — mismo `usuario.id` que `PATCH /api/usuarios/:id/clave`, ver arriba). No la borra: conserva su historial. Al desactivar, también se bloquea su login en Supabase Auth (rechaza incluso generar un token nuevo, no solo las rutas protegidas).

```json
// Body
{ "activo": false }
```

Errores: `400` si intentas desactivar tu propia cuenta.

### `PATCH /api/usuarios/:id/clave`

Restablece la clave de **cualquier usuario, de cualquier rol** (incluido Docente — usa el `docente.usuarioId`/`usuario.id`, no el `docenteId` de `Docente`; para conseguirlo, `GET /api/docentes` incluye el `usuario.id` de cada uno). Es el único mecanismo para recuperar acceso: no existe autoservicio de "olvidé mi contraseña" por correo, a propósito — todo restablecimiento pasa por un Super Usuario.

```json
// Body (passwordTemporal es opcional)
{ "passwordTemporal": "opcional, mínimo 8 caracteres" }
```

Si no se manda `passwordTemporal`, se genera una automáticamente. Respuesta:
```json
{ "passwordTemporal": "2UVsWJTJUBcM" }
```

El Super Usuario debe comunicarle esta clave al usuario por fuera de la plataforma (no hay email de por medio). La cuenta queda con `debeCambiarPassword: true` — la próxima vez que inicie sesión, el frontend debe bloquear todo hasta que la cambie por una propia vía `POST /api/auth/cambiar-password`.

> Nota: no hay endpoint de bootstrap para el **primer** Super Usuario — se crea por línea de comandos con `npm run crear:super-usuario -- <cedula> <nombres> <apellidos> <email> <password>` (una sola vez por entorno).

---

## Docentes

### `GET /api/docentes`

Requiere rol `SAC`, `TALENTO_HUMANO`, `SUPER_USUARIO` o `GESTOR_DOCUMENTAL`. Lista todos los docentes con un resumen de avance. Trae `usuario.id`, útil para restablecer su clave vía `PATCH /api/usuarios/:id/clave` (ver arriba) sin tener que entrar al detalle de cada uno.

**`GESTOR_DOCUMENTAL` solo ve en esta lista a los docentes con `documentacionAprobada: true`** — mientras un docente esté en proceso, no aparece acá para este rol (los demás roles ven a todos, sin filtrar).

```json
[
  {
    "id": "docenteId",
    "usuario": { "id": "...", "cedula": "...", "nombres": "...", "apellidos": "...", "email": "...", "telefono": null, "activo": true, "debeCambiarPassword": false },
    "registroCompletado": true,
    "tipoPosesion": "DOCENTE",
    "documentacionFinalizada": false,
    "documentacionFinalizadaEn": null,
    "documentacionAprobada": false,
    "documentacionAprobadaEn": null,
    "debeCompletarInformacionAdicional": true,
    "informacionAdicionalCompleta": false,
    "documentosSubidos": 10,
    "documentosAprobados": 7,
    "documentosRechazados": 1
  }
]
```

### `GET /api/docentes/:id`

Perfil completo del docente: todos los datos que llenó al registrarse y en el formulario de información adicional (tipo y número de documento, dirección, sexo, fecha de nacimiento, país/departamento/ciudad de nacimiento, cantidad de hijos, fecha y lugar de expedición de la cédula, estado civil, tipo de sangre). No incluye el checklist de documentos — para eso usa `GET /api/docentes/:id/checklist`.

Acceso: el propio docente (dueño de ese `id`), `SAC`/`TALENTO_HUMANO`/`SUPER_USUARIO` sin restricción, o `GESTOR_DOCUMENTAL` **solo si `documentacionAprobada: true`** (si no, `403`).

Respuesta real (todos los campos, `null` cuando el docente no llenó ese dato):

```json
{
  "id": "docenteId",
  "usuarioId": "...",
  "registroCompletado": true,
  "tipoPosesion": "DOCENTE",
  "documentacionFinalizada": false,
  "documentacionFinalizadaEn": null,
  "documentacionAprobada": true,
  "documentacionAprobadaEn": "2026-09-29T20:00:00.000Z",
  "debeCompletarInformacionAdicional": true,
  "informacionAdicionalCompleta": true,
  "sexo": "FEMENINO",
  "fechaNacimiento": "1990-05-12T00:00:00.000Z",
  "paisNacimiento": "Colombia",
  "departamentoNacimientoId": "uuid",
  "ciudadNacimientoId": "uuid",
  "cantidadHijos": 2,
  "fechaExpedicionCedula": "2008-03-01T00:00:00.000Z",
  "departamentoExpedicionId": "uuid",
  "ciudadExpedicionId": "uuid",
  "estadoCivil": "CASADO",
  "tipoSangre": "O_POSITIVO",
  "direccion": "Calle 10 # 5-20",
  "createdAt": "...",
  "updatedAt": "...",
  "usuario": { "id": "...", "cedula": "...", "tipoDocumento": "CEDULA_CIUDADANIA", "nombres": "...", "apellidos": "...", "email": "...", "telefono": "..." },
  "departamentoNacimiento": { "id": "uuid", "nombre": "Magdalena" },
  "ciudadNacimiento": { "id": "uuid", "nombre": "Santa Marta" },
  "departamentoExpedicion": { "id": "uuid", "nombre": "Magdalena" },
  "ciudadExpedicion": { "id": "uuid", "nombre": "Santa Marta" }
}
```

Los mismos nombres de campo que `PATCH /:id/informacion-adicional` recibe (`sexo`, `fechaNacimiento`, `paisNacimiento`, `cantidadHijos`, `fechaExpedicionCedula`, `estadoCivil`, `tipoSangre`, `direccion`) — sin cambios al ser lectura. País/departamento/ciudad de nacimiento y expedición vienen **ambos**: el `*Id` crudo (`departamentoNacimientoId`, etc.) Y el objeto resuelto `{id, nombre}` (`departamentoNacimiento`, etc.) — este último es `null` si el docente no lo llenó. El tipo de documento de identidad viene en `usuario.tipoDocumento`, mismo campo y mismos valores que en `POST /api/auth/registro`. Fechas en ISO 8601 (`Date` de Prisma serializado por `res.json`).

### `GET /api/docentes/:id/checklist`

El propio docente (dueño de ese `id`) o cualquier rol revisor (`SAC`/`TALENTO_HUMANO`/`SUPER_USUARIO`) puede verlo sin restricción; `GESTOR_DOCUMENTAL` solo si `documentacionAprobada: true` (mismo criterio que `GET /api/docentes/:id`). Devuelve los **25** tipos de documento (los 24 del proceso + `AUTORIZACION_NOTIFICACION_ELECTRONICA` como primer ítem, `orden: 0`) con el estado del documento del docente en cada uno (o `null` si no ha subido nada). Este último ya no se sube durante el registro (ver `POST /api/auth/registro`) — el docente lo sube desde aquí, como cualquier otro, justo después de loguearse por primera vez. **Subirlo marca `registroCompletado = true` de inmediato** (cambio 2026-09-30, revierte el cambio de 2026-09-29) — el docente no espera a que `SAC` lo apruebe para seguir con el resto, ver `POST /api/documentos` y `PATCH /api/documentos/:id/validar`.

```json
{
  "docenteId": "...",
  "checklist": [
    {
      "tipoDocumentoId": "...",
      "codigo": "HOJA_DE_VIDA",
      "nombre": "Formato único de hoja de vida de la Función Pública",
      "obligatorio": true,
      "documento": { "id": "...", "estado": "EN_REVISION", "archivoNombre": "hoja_de_vida.pdf", "comentarioValidador": null, "subidoEn": "...", "validadoPor": { "nombres": "Andrea", "apellidos": "Validadora" }, "validadoEn": "..." } // validadoPor/validadoEn son null si nunca se ha aprobado/rechazado; documento completo es null si no ha subido nada
    }
  ]
}
```

Errores: `403` si no eres el dueño ni un rol revisor, `404` si el docente no existe.

### `PATCH /api/docentes/:id/finalizar`

Solo el propio docente (dueño de ese `id`), sin body. Marca que ya terminó de subir los 25 documentos del checklist y notifica a `TALENTO_HUMANO` + `SUPER_USUARIO` (cuentas activas — ni `SAC` ni `GESTOR_DOCUMENTAL`, ver nota de roles arriba: terminar el checklist es competencia de Talento Humano, no de SAC) para que no tengan que estar chequeando el progreso manualmente — notificación in-app (aparece en `GET /api/notificaciones`) + email.

El gatillo es **"subió todos y ninguno quedó rechazado"**, no "le aprobaron todos": cuenta cualquier documento subido cuyo `estado` sea `PENDIENTE`/`EN_REVISION`/`APROBADO` — `ARCHIVO_ELIMINADO` y `RECHAZADO` cuentan como faltante.

Si falta alguno (sin subir, eliminado del bucket, o rechazado sin corregir), `400`:
```json
{ "error": "Todavía faltan documentos por subir o corregir: SITUACION_MILITAR, HOJA_DE_VIDA" }
```

Si pasa la validación, `200` con el `Docente` actualizado (`documentacionFinalizada: true`, `documentacionFinalizadaEn` con el timestamp). Errores: `403` si no eres el dueño, `404` si el docente no existe.

**Repetible tras un rechazo:** si el docente ya había finalizado y un validador rechaza un documento (`PATCH /api/documentos/:id/validar`), `documentacionFinalizada` se resetea automáticamente a `false` (y `documentacionFinalizadaEn` a `null`). El docente corrige el documento (`POST /api/documentos`, mismo `tipoDocumentoId`) y puede llamar este endpoint de nuevo — al pasar la validación, vuelve a notificar (in-app + email) a todo el personal revisor. **Frontend:** el botón/acción de "Finalizar documentación" debe mostrarse siempre que `documentacionFinalizada` sea `false`, no solo la primera vez — este reset es automático del backend, no hace falta ningún paso adicional del lado del cliente para detectarlo (ya viene así en `GET /api/auth/me` y `GET /api/docentes`).

### `GET /api/docentes/:id/descargar`

Requiere rol `SAC`, `TALENTO_HUMANO`, `SUPER_USUARIO` o `GESTOR_DOCUMENTAL`. Descarga un `.zip` con los documentos **APROBADOS** de ese docente — pensado para respaldo interno una vez su proceso de posesión está completo. No incluye documentos pendientes, en revisión, rechazados, ni marcados `ARCHIVO_ELIMINADO` — silenciosamente, sin ninguna nota sobre lo que falta (a propósito: no es un reporte de completitud, es un respaldo de lo ya aprobado).

**`GESTOR_DOCUMENTAL` solo puede usar este endpoint si `documentacionAprobada: true`** (si no, `403`) — los demás roles no tienen esta restricción y pueden descargar el respaldo parcial de un docente en proceso.

No es JSON: la respuesta es el archivo binario directo, con:
```
Content-Type: application/zip
Content-Disposition: attachment; filename="<cedula>-<apellidos>-<nombres>.zip"
```

Cada archivo dentro del zip se renombra a `<orden de 2 dígitos>_<codigo del tipo>.<extensión original>` (ej. `01_HOJA_DE_VIDA.pdf`) — no el nombre interno con UUID que usa el bucket — para que quede ordenado y legible al abrirlo.

Errores: `404` si el docente no existe, o si no tiene ningún documento aprobado todavía. Si la generación del zip falla a mitad de camino (después de que ya empezaron a salir bytes al navegador), no hay forma de mandar un JSON de error a esa altura — el servidor corta la conexión y lo deja en el log; el frontend debería tratar una descarga incompleta/interrumpida como fallo genérico de red.

### `PATCH /api/docentes/:id/informacion-adicional` (nuevo, 2026-09-29)

Solo el propio docente (dueño de ese `id`). Completa los datos personales adicionales exigidos para el proceso de posesión (más allá de lo pedido en el registro básico). Al pasar, desbloquea el módulo de carga de documentos — ver "Carga de documentos bloqueada" en `POST /api/documentos` más abajo.

```json
// Body
{
  "sexo": "FEMENINO", // "MASCULINO" | "FEMENINO" — obligatorio
  "fechaNacimiento": "1990-05-10", // obligatorio
  "paisNacimiento": "Colombia", // obligatorio — ver GET /api/catalogos/paises
  "departamentoNacimientoId": "uuid", // obligatorio SOLO si paisNacimiento = "Colombia"
  "ciudadNacimientoId": "uuid", // obligatorio SOLO si paisNacimiento = "Colombia"
  "cantidadHijos": 2, // obligatorio, entero >= 0
  "fechaExpedicionCedula": "2008-05-10", // obligatorio
  "departamentoExpedicionId": "uuid", // obligatorio — ver GET /api/catalogos/departamentos
  "ciudadExpedicionId": "uuid", // obligatorio — ver GET /api/catalogos/ciudades
  "estadoCivil": "SOLTERO", // opcional, ver enum EstadoCivil
  "tipoSangre": "O_POSITIVO", // opcional, ver enum TipoSangre
  "direccion": "Cra 1 # 2-34" // opcional
}
```

Se puede llamar más de una vez (para editar los datos después de haberlos completado). El backend valida que `ciudadExpedicionId`/`ciudadNacimientoId` realmente pertenezcan al `departamentoId` enviado — `400` si no.

Respuesta `200`: el `Docente` actualizado (`informacionAdicionalCompleta: true`). Errores: `403` si no eres el dueño, `404` si el docente no existe, `400` si falta algo obligatorio o si departamento/ciudad no coinciden.

---

## Catálogos (nuevo, 2026-09-29)

Requieren token (cualquier rol autenticado). Para poblar los selects del formulario de información adicional.

### `GET /api/catalogos/paises`

Lista simple en código (no tabla de BD) — Colombia primero. `["Colombia", "Venezuela", "Ecuador", ..., "Otro"]`.

### `GET /api/catalogos/departamentos`

Los 32 departamentos + Bogotá D.C., importados con código DIVIPOLA real (fuente: DANE). `[{ "id": "uuid", "codigoDivipola": "05", "nombre": "Antioquia" }, ...]`. Se importan una sola vez por entorno con `npm run importar:geografia` (idempotente, se puede correr de nuevo sin duplicar).

### `GET /api/catalogos/ciudades?departamentoId=...`

Los ~1123 municipios de Colombia (mismo dataset DIVIPOLA). `departamentoId` opcional — sin él trae los 1123; con él, filtra solo los de ese departamento (uso esperado: poblar el segundo select en cascada tras elegir departamento). `[{ "id": "uuid", "codigoDivipola": "05001", "nombre": "Medellín", "departamentoId": "uuid" }, ...]`.

---

## Documentos

### `GET /api/documentos`

Requiere rol `SAC`, `TALENTO_HUMANO`, `SUPER_USUARIO` o `GESTOR_DOCUMENTAL`. Bandeja de validación: lista plana de documentos de **todos** los docentes (no de uno solo — para eso usa `GET /api/docentes/:id/checklist`). Soporta query params opcionales:

**`GESTOR_DOCUMENTAL` solo ve acá documentos de docentes con `documentacionAprobada: true`** (los demás roles ven todo, sin filtrar).

| Query param | Valores | Descripción |
|---|---|---|
| `estado` | `PENDIENTE` \| `EN_REVISION` \| `APROBADO` \| `RECHAZADO` \| `ARCHIVO_ELIMINADO` | Filtra por estado exacto |
| `q` | texto libre | Busca por nombres/apellidos/cédula del docente o nombre del tipo de documento (contiene, sin distinguir mayúsculas) |

```
GET /api/documentos?estado=EN_REVISION&q=perez
```

```json
[
  {
    "id": "...",
    "estado": "EN_REVISION",
    "archivoNombre": "hoja_de_vida.pdf",
    "comentarioValidador": null,
    "subidoEn": "2026-09-26T04:19:28.696Z",
    "validadoPor": null,
    "validadoEn": null,
    "docente": { "id": "...", "cedula": "1099887767", "nombres": "Ana", "apellidos": "Pérez Gómez" },
    "tipoDocumento": { "id": "...", "codigo": "HOJA_DE_VIDA", "nombre": "Formato único de hoja de vida de la Función Pública", "orden": 14 }
  }
]
```

Para el archivo en sí (columna "Archivo radicado" con link de descarga/vista), usa `GET /api/documentos/:id/url` con el `id` de cada fila. Para aprobar/rechazar (columna "Acciones"), usa `PATCH /api/documentos/:id/validar` — ver abajo.

`validadoPor`/`validadoEn` reflejan la **última** validación registrada para ese documento (tabla `Validacion`), sea cual sea el `estado` actual. Ojo: si el docente vuelve a subir el archivo tras un rechazo, `estado` vuelve a `EN_REVISION` pero `validadoPor`/`validadoEn` siguen mostrando quién hizo la última revisión (útil para saber quién ya lo había visto antes), hasta que haya una nueva validación.

### `POST /api/documentos`

Requiere rol `DOCENTE`. Sube (o vuelve a subir tras un rechazo) un documento del checklist. `multipart/form-data`:

| Campo | Tipo | Descripción |
|---|---|---|
| `docenteId` | string (uuid) | El `docente.id` del usuario autenticado |
| `tipoDocumentoId` | string (uuid) | Uno de los ids de `GET /api/tipos-documento` (para completar el registro, usa el que tenga `codigo: "AUTORIZACION_NOTIFICACION_ELECTRONICA"`) |
| `archivo` | file | Solo PDF, máx. 10MB (se valida mimetype y también la firma real del archivo) |

El documento queda en estado `EN_REVISION`. Si el `tipoDocumento` es el de autorización de notificación electrónica, además de quedar `EN_REVISION` se marca `Docente.registroCompletado = true` **en el mismo request** (cambio 2026-09-30, revierte el cambio de 2026-09-29 — ver más abajo) y se notifica (in-app + email) a `SAC`/`SUPER_USUARIO` para que la revisen, aunque el docente ya puede seguir subiendo el resto del checklist sin esperar esa revisión.

Respuesta `201`: el `Documento` creado/actualizado. Errores: `403` si el docente no es el dueño, `404` si no existe el docente o el tipo de documento, `400` si el archivo no es PDF (`"Solo se aceptan archivos PDF"` si el mimetype declarado no es `application/pdf`, o `"El archivo no es un PDF válido"` si el mimetype dice PDF pero el contenido no empieza con la firma `%PDF-`).

#### Carga de documentos bloqueada

Dos precondiciones, ambas devuelven `403` (no `400`, porque no es un error del archivo sino de secuencia/estado):

1. **Información adicional incompleta**: si `docente.debeCompletarInformacionAdicional === true` y `docente.informacionAdicionalCompleta === false`, cualquier subida (incluida la autorización de notificación electrónica) devuelve `403` con `"Debes completar tu información adicional antes de subir documentos."`. Ver `PATCH /api/docentes/:id/informacion-adicional`. Los docentes con `debeCompletarInformacionAdicional === false` (los que ya existían antes de este feature) nunca chocan con esto.
2. **Autorización de notificación electrónica pendiente**: para cualquier documento que NO sea `AUTORIZACION_NOTIFICACION_ELECTRONICA`, si `docente.registroCompletado === false`, `403` con uno de estos dos mensajes según el estado real de esa autorización:
   - `"Debes subir primero la autorización de notificación electrónica."` — nunca la subió.
   - `"Tu autorización de notificación electrónica fue rechazada. Corrígela antes de continuar."` — se la rechazaron (ver `PATCH /api/documentos/:id/validar`, que resetea `registroCompletado` a `false` en ese caso).

   **Cambio 2026-09-30 (revierte el cambio de 2026-09-29):** `registroCompletado` vuelve a marcarse al **subir** el archivo (no al aprobarlo) — el docente ya no espera a que SAC revise la autorización para seguir con el resto del checklist. Si SAC la rechaza después, `registroCompletado` vuelve a `false` (re-bloqueando) hasta que la resuba corregida, momento en el que se vuelve a desbloquear automáticamente.

**Frontend:** capturar estos `403` específicos (por el mensaje, ya que el código es el mismo que otros casos de ownership) y redirigir al paso correspondiente en vez de mostrar un error genérico — en la práctica no debería alcanzarse nunca si la UI sigue el orden correcto (información adicional → autorización → resto del checklist), pero sirve como defensa si alguien llama la API fuera de orden.

### `GET /api/documentos/:id/url`

El dueño del documento o un rol revisor. Devuelve una URL firmada temporal (10 min) para ver/descargar el archivo desde Supabase Storage.

```json
{ "url": "https://.../storage/v1/object/sign/documentos-docentes/...?token=..." }
```

Error `410` si el documento está en estado `ARCHIVO_ELIMINADO` (ver abajo) — no intentes generar/mostrar una URL en ese caso, el archivo ya no existe.

### `PATCH /api/documentos/:id/validar`

Requiere rol `SAC`, `TALENTO_HUMANO` o `SUPER_USUARIO`. Aprueba o rechaza un documento; deja registro en `Validacion` (trazabilidad) y dispara una notificación in-app + email al docente.

**División SAC / Talento Humano (2026-09-30):** cada rol solo puede validar su tipo de documento — `SAC` únicamente la autorización de notificación electrónica (`esRequisitoRegistro: true`), `TALENTO_HUMANO` únicamente el resto del checklist (`esRequisitoRegistro: false`). Si cualquiera intenta validar el tipo que no le corresponde, `403` con un mensaje explícito ("SAC solo puede validar la autorización..." / "Talento Humano no valida la autorización..."). `SUPER_USUARIO` no tiene esta restricción, puede validar cualquier documento.

**Aprobación/rechazo de la autorización (cambio 2026-09-30, revierte el cambio de 2026-09-29):** `Docente.registroCompletado` ya se marcó `true` al **subir** el archivo (ver `POST /api/documentos`), así que aprobar este documento ya no necesita tocar ese campo — usa el mensaje genérico de "documento aprobado". Si en cambio se **rechaza** el documento de autorización (`tipoDocumento.esRequisitoRegistro: true`), este endpoint pone `Docente.registroCompletado = false` de nuevo, re-bloqueando al docente hasta que lo resuba corregido (momento en el que `POST /api/documentos` lo vuelve a poner en `true`). El correo de rechazo de este documento específico trae un mensaje distinto, aclarando que debe corregirlo para seguir con el resto de su documentación.

Si esta aprobación deja **todos** los documentos del docente en `APROBADO`, además marca `Docente.documentacionAprobada = true` (con `documentacionAprobadaEn`) y dispara una segunda notificación (tipo `DOCUMENTACION_APROBADA`, in-app + email) avisándole que su proceso de posesión quedó completamente aprobado. `documentacionAprobada` evita reenviar este correo si más adelante un documento se rechaza y se vuelve a aprobar.

Si en cambio se **rechaza** un documento y el docente ya había finalizado su documentación (`Docente.documentacionFinalizada = true`), este endpoint la resetea a `false` (ver `PATCH /api/docentes/:id/finalizar` más abajo) — un rechazo invalida el "ya está todo listo para revisión" que el docente había marcado.

```json
// Body
{ "estado": "APROBADO" } // o "RECHAZADO"
// "comentario" es obligatorio si estado = "RECHAZADO"
{ "estado": "RECHAZADO", "comentario": "El certificado está vencido" }
```

Respuesta: el `Documento` actualizado. Errores: `409` (`"Este documento ya fue actualizado por otra acción. Recarga la bandeja para ver el estado actual."`) si el documento ya no está en `PENDIENTE`/`EN_REVISION` en el momento de escribir — típicamente porque otro validador ya lo aprobó/rechazó, o su archivo fue eliminado (`ARCHIVO_ELIMINADO`), entre que se cargó la bandeja y se hizo el click. El update es atómico (`updateMany` condicionado al estado + transacción con el registro de `Validacion`), así que nunca hay doble-escritura silenciosa: **frontend debe capturar este 409, mostrar el aviso, y refrescar la bandeja/checklist para que la fila/botón reflejen el estado real.**

### Estado `ARCHIVO_ELIMINADO`

Si alguien borra un archivo directamente del bucket de Supabase Storage (desde Studio, la API de Storage, o cualquier cliente S3 — fuera de la aplicación), un trigger de base de datos detecta el borrado automáticamente y pone ese `Documento` en `estado: "ARCHIVO_ELIMINADO"`, con `comentarioValidador` explicando qué pasó. Aparece igual que cualquier otro estado en `GET /api/documentos`, `GET /api/docentes/:id/checklist` y `GET /api/auth/me`. **Frontend:** tratarlo como un caso más que exige volver a subir (similar a `RECHAZADO`), pero mostrando el mensaje de `comentarioValidador` tal cual, y sin ofrecer el botón de "ver documento" (o mostrar que fallará con `410` si se intenta).

---

## Tipos de documento

### `GET /api/tipos-documento`

Requiere token (cualquier rol). Devuelve **todos** los tipos de documento, incluido el de autorización de notificación electrónica (`esRequisitoRegistro: true`, `orden: 0`) — filtra por ese campo en el cliente según lo que necesites:

- Para el checklist completo de un docente (con el estado de cada documento) usa mejor `GET /api/docentes/:id/checklist`.
- Para completar el registro (ver `POST /api/documentos` abajo) necesitas el `id` del tipo con `codigo: "AUTORIZACION_NOTIFICACION_ELECTRONICA"` — **búscalo por `codigo`, nunca hardcodees el uuid** (cambia si se re-siembra la base).

```json
[
  { "id": "...", "codigo": "AUTORIZACION_NOTIFICACION_ELECTRONICA", "nombre": "...", "descripcion": null, "obligatorio": true, "esRequisitoRegistro": true, "orden": 0 },
  { "id": "...", "codigo": "CERTIFICADO_CUENTA_BANCARIA", "nombre": "...", "descripcion": null, "obligatorio": true, "esRequisitoRegistro": false, "orden": 1 }
]
```

---

## Notificaciones

### `GET /api/notificaciones`

Requiere token. Devuelve las últimas 50 notificaciones **in-app** del usuario autenticado (no incluye el historial de envíos de correo).

### Historial de correos enviados

No hay una plataforma externa (tipo Resend/Sendgrid) de por medio: el correo sale por SMTP del buzón propio del dominio, y cada intento de envío queda registrado internamente en la tabla `notificaciones` (fila con `canal: "EMAIL"`), sin depender del dashboard de ningún tercero. Campos propios de esas filas: `emailAsunto`, `emailHtml` (el HTML final ya renderizado, con la plantilla de marca — ver abajo), `emailEstado` (`ENVIADO` | `FALLIDO`) y `emailError` (mensaje de error si falló, `null` si no). No hay endpoint todavía para consultarlo desde la app — por ahora se revisa directo en la base de datos (Supabase Studio) si hace falta auditar un envío.

**Plantilla de marca (`lib/emailTemplate.ts`):** todos los correos comparten un mismo layout (header con el escudo de la Secretaría + franja cromática de 9 colores institucional, badge de color según el evento, cuerpo, botón de acción, footer con "no responder" + `mcantillo@sedmagdalena.gov.co`). Colores y tipografía tomados del Manual de Identidad Visual de la Gobernación del Magdalena. El logo va embebido como adjunto inline (`cid:`, ver `lib/mailer.ts`) en vez de una URL pública o un `data:` URI — es lo que mejor soportan los clientes de correo (Outlook en particular no renderiza bien imágenes base64 embebidas). `notificar()` arma este HTML a partir de parámetros estructurados (`badgeTexto`, `badgeTono`, `encabezado`, `parrafos`, `destacado?`, `ctaTexto`, `ctaUrl`) — ningún controlador escribe HTML de correo a mano.

### `PATCH /api/notificaciones/:id/leida`

Requiere token. Marca una notificación propia como leída.

---

## Enums de referencia

- **RolNombre**: `SUPER_USUARIO`, `SAC`, `TALENTO_HUMANO`, `DOCENTE`, `GESTOR_DOCUMENTAL`
- **EstadoDocumento**: `PENDIENTE`, `EN_REVISION`, `APROBADO`, `RECHAZADO`, `ARCHIVO_ELIMINADO`
- **CanalNotificacion**: `IN_APP`, `EMAIL`
- **TipoNotificacion**: `REGISTRO`, `DOCUMENTO_EN_REVISION`, `DOCUMENTO_APROBADO`, `DOCUMENTO_RECHAZADO`, `RECORDATORIO`, `RESTABLECIMIENTO_CLAVE`, `DOCUMENTACION_LISTA_REVISION`, `DOCUMENTACION_APROBADA`, `OTRO`
- **EstadoEnvioEmail**: `ENVIADO`, `FALLIDO` (solo en filas `Notificacion` con `canal: EMAIL`)
- **TipoPosesion**: `DOCENTE`, `ADMINISTRATIVO` (tipo de aspirante en `Docente.tipoPosesion` — no confundir con `RolNombre`)
- **TipoDocumentoIdentidad**: `CEDULA_CIUDADANIA`, `CEDULA_EXTRANJERIA`, `TARJETA_IDENTIDAD`, `PASAPORTE`, `PEP`, `PPT` (en `Usuario.tipoDocumento`)
- **Sexo**: `MASCULINO`, `FEMENINO`
- **EstadoCivil**: `SOLTERO`, `CASADO`, `UNION_LIBRE`, `SEPARADO`, `DIVORCIADO`, `VIUDO`
- **TipoSangre**: `O_POSITIVO`, `O_NEGATIVO`, `A_POSITIVO`, `A_NEGATIVO`, `B_POSITIVO`, `B_NEGATIVO`, `AB_POSITIVO`, `AB_NEGATIVO`
