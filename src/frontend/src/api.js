const API_BASE = "http://localhost:3124";

export function apiFetch(path, options = {}) {
  return fetch(API_BASE + path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
}
