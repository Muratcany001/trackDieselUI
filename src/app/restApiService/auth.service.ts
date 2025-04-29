import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}
  getCurrentUserId(): string | null {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Token not found in localStorage");
      return null;
    }

    try {
      const decoded: any = jwtDecode(token);
      console.log('Decoded Token:', decoded);
      if (!decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]) {
        console.error("User ID not found in the decoded token");
        return null;
      }
      return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null;
    } catch (error) {
      console.error("Error decoding the token:", error);
      return null; // Return null in case of decoding error
    }
  }
}
