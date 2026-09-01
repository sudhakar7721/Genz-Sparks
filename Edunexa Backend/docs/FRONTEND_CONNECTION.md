# Connecting the existing EduNexa frontend

Create one API helper in the frontend:

```js
const API_BASE = "http://127.0.0.1:8000/api";

async function api(path, options = {}) {
    const token = localStorage.getItem("edunexa_token");

    const response = await fetch(API_BASE + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "API request failed");
    }

    return data;
}
```

Login:

```js
const data = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
        email: loginId,
        password: loginPassword
    })
});

localStorage.setItem("edunexa_token", data.access_token);
localStorage.setItem("edunexa_user", JSON.stringify(data.user));
```

Student profile:

```js
const student = await api("/students/me");
console.log(student);
```

Do not send database credentials from JavaScript. Only the Python backend should know the database credentials.

Migrate one module at a time. Keep the old localStorage database until the corresponding API is tested.
