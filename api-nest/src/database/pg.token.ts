/**
 * Token de inyección del pool de Postgres, en su propio archivo para evitar
 * dependencias circulares entre el módulo de base de datos y sus servicios.
 */
export const PG_POOL = 'PG_POOL'
