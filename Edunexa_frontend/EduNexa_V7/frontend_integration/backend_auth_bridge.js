/* =========================================================
   EduNexa Backend Authentication Bridge
   - Uses FastAPI/SQLite as the authentication authority.
   - Keeps the existing UI/local data structures so existing
     dashboard modules continue to render.
========================================================= */
(function () {
  "use strict";

  const TOKEN_KEY = "edunexa_token";
  const USER_KEY = "edunexa_user";
  const SESSION_KEY = "edunexa_session";

  function normalize(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function mapBackendUser(apiUser) {
    const mapped = {
      id: apiUser.id,
      name: apiUser.name || "User",
      email: apiUser.email || "",
      role: apiUser.role || "student",
      studentId: apiUser.student_id || null,
      facultyId: apiUser.faculty_id || null,
      hodId: apiUser.hod_id || null,
      adminId: apiUser.admin_id || null,
      department: apiUser.department || "Data Analytics",
      batch: apiUser.batch || "",
      designation: apiUser.designation || "",
      phone: apiUser.phone || "",
      qualification: apiUser.qualification || "",
      experience: apiUser.experience || "",
      specialization: apiUser.specialization || "",
      office: apiUser.office || "",
      parentName: apiUser.parent_name || "",
      parentPhone: apiUser.parent_phone || "",
      attendance: Number(apiUser.attendance || 0),
      isActive: Boolean(apiUser.is_active)
    };

    // Preserve useful UI-only properties if this account already
    // exists in the old local database.
    if (typeof db !== "undefined" && Array.isArray(db.users)) {
      const old = db.users.find(u =>
        normalize(u.email) === normalize(mapped.email) ||
        (mapped.studentId && normalize(u.studentId) === normalize(mapped.studentId)) ||
        (mapped.facultyId && normalize(u.facultyId) === normalize(mapped.facultyId)) ||
        (mapped.hodId && normalize(u.hodId) === normalize(mapped.hodId))
      );
      if (old) {
        Object.assign(mapped, old, {
          id: apiUser.id,
          name: apiUser.name || old.name,
          email: apiUser.email || old.email,
          role: apiUser.role || old.role,
          studentId: apiUser.student_id || old.studentId || null,
          facultyId: apiUser.faculty_id || old.facultyId || null,
          hodId: apiUser.hod_id || old.hodId || null,
          department: apiUser.department || old.department,
          batch: apiUser.batch || old.batch
        });
      }
    }

    return mapped;
  }

  function cacheBackendUser(apiUser) {
    const user = mapBackendUser(apiUser);

    if (typeof db !== "undefined" && Array.isArray(db.users)) {
      const index = db.users.findIndex(u =>
        (user.email && normalize(u.email) === normalize(user.email)) ||
        (user.studentId && normalize(u.studentId) === normalize(user.studentId)) ||
        (user.facultyId && normalize(u.facultyId) === normalize(user.facultyId)) ||
        (user.hodId && normalize(u.hodId) === normalize(user.hodId))
      );

      // Never store the backend password/hash in localStorage.
      delete user.password;

      if (index >= 0) {
        const old = db.users[index];
        db.users[index] = { ...old, ...user };
      } else {
        db.users.push(user);
      }

      if (typeof save === "function") save();
    }

    currentUser = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(USER_KEY, JSON.stringify(apiUser));
    return user;
  }

  function showLoginError(message) {
    if (typeof toast === "function") toast(message);
    else window.alert(message);
  }

  async function backendLogin() {
    const input = document.getElementById("loginId");
    const passwordInput = document.getElementById("loginPassword");

    const identifier = String(input?.value || "").trim();
    const password = String(passwordInput?.value || "").trim();

    if (!identifier || !password) {
      showLoginError("Enter login ID/email and password.");
      return;
    }

    const selectedTop =
      typeof loginRole === "undefined" ? "student" : loginRole;
    const selectedStaff =
      typeof staffLoginRole === "undefined" || !staffLoginRole
        ? "faculty"
        : staffLoginRole;

    const selectedRole = selectedTop === "staff" ? selectedStaff : selectedTop;

    try {
      const data = await EduNexaAPI.login(identifier, password);

      // The backend determines the real role. Keep the UI role selector
      // as a convenience, but prevent accidental cross-role login.
      if (data.user.role !== selectedRole) {
        EduNexaAPI.logout();
        showLoginError(
          `This account is a ${data.user.role.toUpperCase()} account. ` +
          `Select the correct login type and try again.`
        );
        return;
      }

      const user = cacheBackendUser(data.user);

      // Refresh the authoritative user record when possible.
      try {
        const fresh = await EduNexaAPI.me();
        cacheBackendUser(fresh);
      } catch (_) {
        // Login itself succeeded; keep the login response.
      }

      openApp();
    } catch (error) {
      console.error("EduNexa backend login error:", error);
      showLoginError(error.message || "Unable to connect to EduNexa backend.");
    }
  }

  async function backendRegister() {
    const get = id => String(document.getElementById(id)?.value || "").trim();

    const name = get("suName");
    const email = get("suEmail").toLowerCase();
    const password = get("suPass");

    if (!name || !email || !password) {
      showLoginError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      showLoginError("Password must contain at least 6 characters.");
      return;
    }

    const role = typeof signupRole === "undefined" ? "student" : signupRole;

    const payload = {
      name,
      email,
      password,
      role,
      department: "Data Analytics",
      batch: "2025-2028"
    };

    if (role === "student") {
      payload.student_id = get("suStudentId") || undefined;
      payload.parent_name = get("suParent") || "Parent / Guardian";
      payload.parent_phone = get("suParentPhone");
    }

    if (role === "hod") {
      payload.department = get("suHodDepartment") || "Data Analytics";
    }

    try {
      await EduNexaAPI.register(payload);
      showLoginError("Account created successfully. Please log in.");
      showLogin();
    } catch (error) {
      console.error("EduNexa registration error:", error);
      showLoginError(error.message || "Registration failed.");
    }
  }

  function backendLogout() {
    EduNexaAPI.logout();
    currentUser = null;

    document.getElementById("app")?.classList.add("hidden");
    document.getElementById("auth")?.classList.remove("hidden");

    const id = document.getElementById("loginId");
    const pass = document.getElementById("loginPassword");
    if (id) id.value = "";
    if (pass) pass.value = "";

    showLogin();
  }

  async function restoreBackendSession() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      // Remove stale legacy sessions so localStorage cannot silently
      // bypass the backend.
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    try {
      const user = await EduNexaAPI.me();
      cacheBackendUser(user);
      openApp();
    } catch (error) {
      console.warn("Stored EduNexa session is invalid:", error);
      EduNexaAPI.logout();
      document.getElementById("app")?.classList.add("hidden");
      document.getElementById("auth")?.classList.remove("hidden");
    }
  }

  // These assignments intentionally happen after the legacy scripts,
  // making the backend the final authority without deleting existing UI.
  window.login = backendLogin;
  window.register = backendRegister;
  window.logout = backendLogout;

  // Validate an existing backend session after the DOM is ready.
  window.addEventListener("load", restoreBackendSession);
})();
