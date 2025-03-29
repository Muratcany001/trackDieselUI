import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';

interface LoginRequest {
  id: number;
  name: string;
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  // diğer response alanları...
}

export interface Car {
  id?: number;
  plate: string;
  name:string;
  age:number;
  errorHistory?: Issue[];
  lastMaintenanceDate:Date;
}
export interface Issue{
  id?:number;
  model?:string;
  engineType?:string;
  partName?:string;
  description?:string;
  dateReported?:Date;
  isReplaced?:boolean;
  carId?:number;
}
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = "https://localhost:7029";
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) { }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Bir hata oluştu';
    
    if (error.status === 0) {
      errorMessage = 'API sunucusuna bağlanılamıyor. Lütfen API\'nin çalıştığından emin olun.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Hata: ${error.error.message}`;
    } else {
      errorMessage = `Hata Kodu: ${error.status}\nMesaj: ${error.message}`;
    }
    
    console.error('API Hatası:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  login(user: { name: string, password: string }): Observable<LoginResponse> {
    const requestBody: LoginRequest = {
      id: 0,
      name: user.name,
      email: `${user.name}@example.com`,
      password: user.password
    };
    console.log('API URL:', `${this.apiUrl}/api/auth/login`);
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/login`, requestBody, { 
      headers: this.headers,
      withCredentials: false
    }).pipe(
      tap(response => {
        console.log('Login başarılı:', response);
        if (response?.token) {
          localStorage.setItem('token', response.token);
        }
      }),
      catchError(error => {
        console.error('Login hatası detayları:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        return this.handleError(error);
      })
    );
  }

  addCar(car: Car): Observable<Car> {
    return this.http.post<Car>(`${this.apiUrl}/cars/addCar`, car, { headers: this.headers });
  }

  getCars(): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/cars`, { headers: this.headers });
  }

  updateCar(car: Car): Observable<Car> {
    return this.http.put<Car>(`${this.apiUrl}/cars/updateCar`, car, { headers: this.headers });
  }

  deleteCar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cars/deleteCar/${id}`, { headers: this.headers });
  }

  getCarCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/cars/count`, { headers: this.headers });
  }

  getCarByPlate(plate: string): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/cars/GetCarByPlate/${plate}`, { headers: this.headers });
  }

  getAllIssues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cars/issues`, { headers: this.headers });
  }
}
