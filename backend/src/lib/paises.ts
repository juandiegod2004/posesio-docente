/**
 * Lista simple de países para el selector de "país de nacimiento" — a diferencia de
 * departamentos/ciudades, no se pidió importar un catálogo completo (con
 * codificación ISO, etc.), así que esto es una lista curada en código, no una
 * tabla de BD. Colombia primero porque es el caso ampliamente mayoritario.
 */
export const PAISES = [
  "Colombia",
  "Venezuela",
  "Ecuador",
  "Perú",
  "Brasil",
  "Panamá",
  "México",
  "Argentina",
  "Chile",
  "Bolivia",
  "Estados Unidos",
  "España",
  "Otro",
] as const;
