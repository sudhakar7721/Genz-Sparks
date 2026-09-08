/* EduNexa API Client - FastAPI + SQLite */
(function () {
  "use strict";

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  function getToken() {
    return localStorage.getItem("edunexa_token") || "";
  }

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const isFormData = options.body instanceof FormData;

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text();

    if (!response.ok) {
      const message =
        typeof data === "object" && data?.detail
          ? (Array.isArray(data.detail)
              ? data.detail.map(x => x.msg || String(x)).join(", ")
              : data.detail)
          : `API request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async function login(identifier, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    });

    localStorage.setItem("edunexa_token", data.access_token);
    localStorage.setItem("edunexa_user", JSON.stringify(data.user));
    return data;
  }

  async function me() {
    return request("/auth/me");
  }

  async function register(payload) {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return data;
  }

  function logout() {
    localStorage.removeItem("edunexa_token");
    localStorage.removeItem("edunexa_user");
    localStorage.removeItem("edunexa_session");
  }

  window.EduNexaAPI = {
    baseURL: API_BASE_URL,
    request,
    login,
    me,
    register,
    logout,
    getToken
  };
})();
