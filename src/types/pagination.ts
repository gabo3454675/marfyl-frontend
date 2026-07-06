/**
 * Formato estándar de respuesta paginada del backend.
 * Debe coincidir exactamente con PaginatedResponse del backend.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Parámetros para hacer una query paginada.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
