import { jwtDecode } from 'jwt-decode';
import { JwtTokenPayload } from '../interfaces/tokenTypes';

/**
 * Safely decode a JWT token and extract the payload
 * 
 * @param token - The JWT token string to decode
 * @returns The decoded token payload, or null if decoding fails
 */
export function decodeToken(token: string): JwtTokenPayload | null {
    if (!token || typeof token !== 'string') {
        console.warn('[TokenUtils] Invalid token: token is empty or not a string');
        return null;
    }

    try {
        const decoded = jwtDecode<JwtTokenPayload>(token);

        // Validate that the decoded token has the expected structure
        if (!decoded || typeof decoded !== 'object') {
            console.warn('[TokenUtils] Invalid token: decoded payload is not an object');
            return null;
        }

        // Validate required fields
        if (!decoded.uid || !decoded.email) {
            console.warn('[TokenUtils] Invalid token: missing required fields (uid, email)');
            return null;
        }

        // Ensure arrays exist (even if empty)
        const payload: JwtTokenPayload = {
            claims: Array.isArray(decoded.claims) ? decoded.claims : [],
            email: decoded.email,
            exp: decoded.exp || 0,
            roles: Array.isArray(decoded.roles) ? decoded.roles : [],
            uid: decoded.uid,
            username: decoded.username || '',
        };

        return payload;
    } catch (error) {
        console.error('[TokenUtils] Failed to decode token:', error);
        return null;
    }
}

/**
 * Check if a token is expired based on its expiration timestamp
 * 
 * @param tokenPayload - The decoded token payload
 * @returns True if the token is expired, false otherwise
 */
export function isTokenExpired(tokenPayload: JwtTokenPayload): boolean {
    if (!tokenPayload.exp) {
        return true;
    }

    const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
}

/**
 * Get the time remaining until token expiration in seconds
 * 
 * @param tokenPayload - The decoded token payload
 * @returns Time remaining in seconds, or 0 if expired
 */
export function getTokenTimeRemaining(tokenPayload: JwtTokenPayload): number {
    if (!tokenPayload.exp) {
        return 0;
    }

    const expirationTime = tokenPayload.exp * 1000;
    const remaining = Math.max(0, expirationTime - Date.now());
    return Math.floor(remaining / 1000);
}
