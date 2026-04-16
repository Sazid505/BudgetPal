export function getToken() {
  return localStorage.getItem("token");
}

export function api(url, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };
  return fetch(url, { ...options, headers });
}
