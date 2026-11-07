import { API_ENDPOINTS, fetchFromVercel, API_BASE_URL } from "../config/apiConfig";

/**
 * Servicio unificado de consumo de la API de PrestaLab desplegada en Vercel.
 * Todas las funciones devuelven directamente el campo `data` de la respuesta o la respuesta misma.
 */
export const vercelApiService = {
  /**
   * Información de conexión y diagnóstico
   */
  getBaseUrl: () => API_BASE_URL,

  testConnection: async () => {
    try {
      const res = await fetchFromVercel(API_ENDPOINTS.health, { timeoutMs: 5000 });
      return { ok: true, url: API_BASE_URL, data: res };
    } catch (error) {
      return { ok: false, url: API_BASE_URL, error: error.message };
    }
  },

  // ============================================================
  // ARTÍCULOS / INVENTARIO
  // ============================================================
  articulos: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.salaId) params.append("salaId", filters.salaId);
      if (filters.categoria) params.append("categoria", filters.categoria);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchFromVercel(`${API_ENDPOINTS.articulos}${qs}`);
      return res?.data || res;
    },

    getById: async (id) => {
      const res = await fetchFromVercel(`${API_ENDPOINTS.articulos}/${id}`);
      return res?.data || res;
    },

    create: async (data) => {
      const res = await fetchFromVercel(API_ENDPOINTS.articulos, {
        method: "POST",
        body: data,
      });
      return res?.data || res;
    },

    update: async (id, data) => {
      const res = await fetchFromVercel(`${API_ENDPOINTS.articulos}/${id}`, {
        method: "PUT",
        body: data,
      });
      return res?.data || res;
    },

    delete: async (id) => {
      const res = await fetchFromVercel(`${API_ENDPOINTS.articulos}/${id}`, {
        method: "DELETE",
      });
      return res?.data || res;
    },
  },

  // ============================================================
  // SALAS / LABORATORIOS
  // ============================================================
  salas: {
    getAll: async () => {
      const res = await fetchFromVercel(API_ENDPOINTS.salas);
      return res?.data || res;
    },

    getById: async (id) => {
      const res = await fetchFromVercel(`${API_ENDPOINTS.salas}/${id}`);
      return res?.data || res;
    },
  },

  // ============================================================
  // SOLICITUDES Y PRÉSTAMOS
  // ============================================================
  solicitudes: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.estado) params.append("estado", filters.estado);
      if (filters.salaId) params.append("salaId", filters.salaId);
      if (filters.userId) params.append("userId", filters.userId);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchFromVercel(`${API_ENDPOINTS.solicitudes}${qs}`);
      return res?.data || res;
    },

    getByUser: async (userId) => {
      const res = await fetchFromVercel(`${API_ENDPOINTS.solicitudes}?userId=${encodeURIComponent(userId)}`);
      return res?.data || res;
    },

    create: async (solicitudData) => {
      const res = await fetchFromVercel(API_ENDPOINTS.solicitudes, {
        method: "POST",
        body: solicitudData,
      });
      return res?.data || res;
    },

    aprobar: async (id, gestorId, notas = "") => {
      const res = await fetchFromVercel(`${API_ENDPOINTS.solicitudes}/${id}/aprobar`, {
        method: "POST",
        body: { gestorId, notas },
      });
      return res?.data || res;
    },

    rechazar: async (id, gestorId, motivo = "") => {
      const res = await fetchFromVercel(`${API_ENDPOINTS.solicitudes}/${id}/rechazar`, {
        method: "POST",
        body: { gestorId, motivo },
      });
      return res?.data || res;
    },
  },

  // ============================================================
  // ESTADÍSTICAS Y ANALÍTICA
  // ============================================================
  stats: {
    getOverview: async () => {
      const res = await fetchFromVercel(API_ENDPOINTS.stats);
      return res?.data || res;
    },
  },

  // ============================================================
  // USUARIOS
  // ============================================================
  usuarios: {
    getById: async (id) => {
      const res = await fetchFromVercel(`${API_ENDPOINTS.usuarios}/${id}`);
      return res?.data || res;
    },
  },
};

export default vercelApiService;
