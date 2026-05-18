// src/utils/fetcher.js
import { navigate } from './navigation';

let inMemoryAccessToken: string | null;

export const setAccessToken = (token: string | null) => {
    inMemoryAccessToken = token;
};

export const getAccessToken = () => {
    return inMemoryAccessToken;
};


const BASE_URL = import.meta.env.VITE_API_URL;

export async function fetcher(endpoint: string, options: any, requireAuth = true): Promise<Response> {
  let token = getAccessToken();
  const url = `${BASE_URL}${endpoint}`;
  console.log(url)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (requireAuth && token) {
    headers['Authorization'] = token;
  }

  let body = options.body;
  
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  try {
    let response = await fetch(url, { ...options, headers, body });

    if (requireAuth && response.status === 401) {
      console.warn("Invalid Access Token (401). Refreshing...");
      
      const refreshRes = await fetch(`${BASE_URL}auth/refresh`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' 
      });

      if (refreshRes.ok) {
        const refreshResult = await refreshRes.json().catch(() => null);
        const newToken = refreshResult.accessToken

        if (newToken) {
          token = newToken;
          setAccessToken(newToken)
          headers['Authorization'] = getAccessToken();
          
          response = await fetch(url, { ...options, headers, body });
          return response;
        }
      }
      
      if (refreshRes.status === 401) {
        console.error("Invalid Refresh Token (401). Force Logout.");
        try {
          await fetch(`${BASE_URL}auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (logoutError) {

        }

        setAccessToken(null)
        navigate('/');
      }
    }

    return response;

  } catch (error) {
    console.error("Network Error:", error);
    
    const mockResponse = { 
      ok: false, 
      status: 0, 
      clone: () => ({
        json: async () => ({})
      }),
      json: async () => ({}) 
    };

    return mockResponse as unknown as Response
  }
}