let cachedToken: string | null = null;
let cachedUserId: string | null = null;
let cachedCateringToken: string | null = null;
let cachedRole: string | null = null;

/** Returns the logged-in user's token (persisted in localStorage). */
export function getToken(): string | null {
  if (cachedToken) return cachedToken;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("userToken");
    if (stored) {
      cachedToken = stored;
      return stored;
    }
  }
  return null;
}

/** Persists the user's token to memory and localStorage. */
export function setToken(token: string) {
  cachedToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("userToken", token);
  }
}

export function getStoredToken(): string | null {
  return cachedToken;
}

/** Fetches a token using the catering admin credentials. For catering page use only. */
export async function getCateringToken(): Promise<string> {
  if (cachedCateringToken) return cachedCateringToken;
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "emilxavierthorsen@gmail.com", password: "1234" }),
  });
  const text = await res.text();
  if (!text) throw new Error(`Auth returned empty body (status ${res.status})`);
  const data = JSON.parse(text);
  cachedCateringToken = data.token ?? data.accessToken ?? data.access_token ?? null;
  if (!cachedCateringToken) throw new Error("Could not retrieve catering token");
  return cachedCateringToken;
}

export function setUserId(id: string) {
  cachedUserId = id;
  if (typeof window !== "undefined") {
    localStorage.setItem("userId", id);
  }
}

export function getUserId(): string | null {
  if (cachedUserId) return cachedUserId;
  if (typeof window !== "undefined") {
    return localStorage.getItem("userId");
  }
  return null;
}

const LOGIN_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function setLoggedIn() {
  if (typeof window !== "undefined") {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loginExpiry", String(Date.now() + LOGIN_TTL_MS));
  }
}

export function checkLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("isLoggedIn") !== "true") return false;
  const expiry = Number(localStorage.getItem("loginExpiry"));
  if (!expiry || Date.now() > expiry) {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loginExpiry");
    return false;
  }
  return true;
}

export function setRole(role: string) {
  cachedRole = role;
  if (typeof window !== "undefined") {
    localStorage.setItem("userRole", role);
  }
}

export function getRole(): string | null {
  if (cachedRole) return cachedRole;
  if (typeof window !== "undefined") {
    return localStorage.getItem("userRole");
  }
  return null;
}

export function isAdmin(): boolean {
  const role = getRole();
  return role === "ADMIN";
}

export function logout() {
  cachedToken = null;
  cachedUserId = null;
  cachedCateringToken = null;
  cachedRole = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loginExpiry");
    localStorage.removeItem("userId");
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
  }
}
