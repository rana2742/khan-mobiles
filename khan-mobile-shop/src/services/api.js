const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Thin fetch wrapper: always sends cookies (for the httpOnly JWT), always
// talks JSON unless a FormData body is passed (image uploads), and throws
// an ApiError with the server's message so callers can show it directly.
async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const options = {
    method,
    credentials: 'include',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new ApiError('Could not reach the server. Is the API running?', 0, null);
  }

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts = {}) => request(path, { method: 'PUT', body, ...opts }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

// For binary responses (PDF invoices, etc.) — fetches with credentials, then
// triggers a normal browser "Save As" download using the given filename.
export const downloadFile = async (path, filename) => {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.message || `Download failed (${res.status})`, res.status, data);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export { ApiError, API_URL };
