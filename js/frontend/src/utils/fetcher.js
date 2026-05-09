// src/utils/fetcher.js
import { navigate } from './navigation';

const BASE_URL = import.meta.env.VITE_API_URL;

export async function fetcher(endpoint, options = {}, requireAuth = true) {
  let token = localStorage.getItem('accessToken');
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (requireAuth && token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  try {
    let response = await fetch(url, { ...options, headers, body });

    if (requireAuth && response.status === 401) {
      console.warn("Access Token tidak valid (401). Mencoba silent refresh...");
      
      const refreshRes = await fetch(`${BASE_URL}auth/refresh`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' 
      });

      if (refreshRes.ok) {
        const refreshResult = await refreshRes.json().catch(() => null);
        const newToken = refreshResult?.accessToken || (typeof refreshResult === 'string' ? refreshResult : null);

        if (newToken) {
          token = newToken;
          localStorage.setItem('accessToken', token);
          headers['accesstoken'] = token;
          
          response = await fetch(url, { ...options, headers, body });
          return response;
        }
      }
      
      if (refreshRes.status === 401) {
        console.error("Refresh Token tidak valid (401). Force Logout.");
        try {
          await fetch(`${BASE_URL}auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (logoutError) {

        }

        localStorage.removeItem('accessToken');
        navigate('/');
      }
    }

    return response;

  } catch (error) {
    console.error("Network Error:", error);
  
    return { ok: false, status: 0, json: async () => ({}) };
  }
}