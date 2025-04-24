import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}

  // Retrieve the user ID from the JWT token stored in localStorage
  getCurrentUserId(): string | null {
    const token = localStorage.getItem('token'); // Get the token from localStorage

    if (!token) {
      console.error("Token not found in localStorage");
      return null; // Token is missing, return null
    }

    try {
      // Decode the JWT token
      const decoded: any = jwtDecode(token);

      // Log the decoded token to see its structure
      console.log('Decoded Token:', decoded);

      // Check for the 'nameidentifier' claim which holds the user ID
      if (!decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]) {
        console.error("User ID not found in the decoded token");
        return null; // If the 'nameidentifier' is missing, return null
      }

      // Return the user ID from the 'nameidentifier' claim
      return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null;
    } catch (error) {
      console.error("Error decoding the token:", error);
      return null; // Return null in case of decoding error
    }
  }
}
