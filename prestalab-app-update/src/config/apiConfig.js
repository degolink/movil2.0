/**
 * Configuración centralizada de la API de Vercel para la aplicación Expo
 *
 * Sigue las mejores prácticas de Expo SDK:
 * - Variables de entorno públicas con prefijo EXPO_PUBLIC_
 * - Manejo de timeouts mediante AbortController
 * - Normalización de URLs y manejo de errores estructurado
 */

const DEFAULT_API_URL = "https://movil2-0.vercel.app";

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_VERCEL || process.env.EXPO_PUBLIC_API_URL;
  if (!envUrl) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(
        "[API Config] EXPO_PUBLIC_API_VERCEL no está definida en .env. " +
          `Usando URL por defecto: ${DEFAULT_API_URL}`
      );
    }
    return DEFAULT_API_URL;
  }
  return envUrl.trim().replace(/\/+$/, "");
};

export const API_BASE_URL = getBaseUrl();

/**
 * Endpoints disponibles en la API de Vercel
 */
export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/stats`,
  articulos: `${API_BASE_URL}/api/articulos`,
  salas: `${API_BASE_URL}/api/salas`,
  solicitudes: `${API_BASE_URL}/api/solicitudes`,
  usuarios: `${API_BASE_URL}/api/usuarios`,
  stats: `${API_BASE_URL}/api/stats`,
  notificaciones: `${API_BASE_URL}/api/notificaciones`,
  seed: `${API_BASE_URL}/api/seed`,
};

/**
 * Clase para errores estructurados de la API
 */
export class ApiError extends Error {
  constructor(message, status = null, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Cliente HTTP unificado para comunicar con Vercel
 *
 * @param {string} endpoint - Ruta relativa (ej: '/api/articulos') o URL completa
 * @param {object} options - Opciones de fetch (method, headers, body, timeoutMs, token)
 */
export async function fetchFromVercel(endpoint, options = {}) {
  const {
    timeoutMs = 12000,
    headers = {},
    token = null,
    body = null,
    ...restOptions
  } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
      body: body && typeof body === "object" && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    let responseData = null;
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (responseData && typeof responseData === "object" && (responseData.error || responseData.message)) ||
        `Error HTTP ${response.status} en ${url}`;
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new ApiError(`Tiempo de espera agotado (${timeoutMs / 1000}s) al conectar con Vercel`, 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || "Error de red al conectar con el servidor", null, error);
  }
}
