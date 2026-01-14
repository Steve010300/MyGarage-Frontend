import { BASE } from "../constants";

let token = localStorage.getItem("token") || null;

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export function clearToken() {
  token = null;
  localStorage.removeItem("token");
}

async function request(path, options = {}) {
  const prefix = path.startsWith("/") ? "" : "/";
  const url = `${BASE}${prefix}${path}`;

  const headers = options.headers ? { ...options.headers } : {};
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(url, { ...options, headers });
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!resp.ok) {
    const msg = typeof data === "string" ? data : data?.message || JSON.stringify(data);
    const err = new Error(msg);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const get = (path) => request(path, { method: "GET" });
export const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });
export const put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) });
export const patch = (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = (path) => request(path, { method: "DELETE" });

export default { get, post, put, patch, del, setToken, clearToken };
