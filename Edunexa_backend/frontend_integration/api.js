const EDUNEXA_API = "http://127.0.0.1:8000/api";

async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = localStorage.getItem("edunexa_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${EDUNEXA_API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem("edunexa_token");
            localStorage.removeItem("edunexa_user");
        }
        throw new Error(data?.detail || `API request failed (${response.status})`);
    }
    return data;
}

async function edunexaLogin(identifier, password) {
    const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
    });
    localStorage.setItem("edunexa_token", data.access_token);
    localStorage.setItem("edunexa_user", JSON.stringify(data.user));
    return data;
}

async function edunexaRegister(payload) {
    return apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

async function edunexaMe() { return apiFetch("/auth/me"); }
async function edunexaStudents() { return apiFetch("/students"); }
async function edunexaStudent(id) { return apiFetch(`/students/${encodeURIComponent(id)}`); }
async function edunexaDepartments() { return apiFetch("/departments"); }

async function edunexaUpload(file, category = "general") {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    return apiFetch("/files/upload", { method: "POST", body: form });
}

function edunexaLogout() {
    localStorage.removeItem("edunexa_token");
    localStorage.removeItem("edunexa_user");
}

window.EduNexaAPI = {
    baseURL: EDUNEXA_API,
    request: apiFetch,
    login: edunexaLogin,
    register: edunexaRegister,
    me: edunexaMe,
    students: edunexaStudents,
    student: edunexaStudent,
    departments: edunexaDepartments,
    upload: edunexaUpload,
    logout: edunexaLogout
};
