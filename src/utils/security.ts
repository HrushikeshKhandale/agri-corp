import { jwtDecode } from 'jwt-decode';

// JWT Token interface
interface JWTPayload {
  sub: string;
  role: string;
  exp: number;
}

// XSS Protection - Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// SQL Injection Protection - Input validation
export const validateInput = (input: string): boolean => {
  const sqlPatterns = /(&#x27;|'|;|--|\s*(union|select|insert|delete|update|drop|create|alter|exec|execute)\s*)/i;
  const xssPatterns = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  
  return !sqlPatterns.test(input) && !xssPatterns.test(input);
};

// Session Management - Token utilities
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: JWTPayload = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

export const getTokenExpiry = (token: string): number | null => {
  try {
    const decoded: JWTPayload = jwtDecode(token);
    return decoded.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  window.location.href = '/login';
};