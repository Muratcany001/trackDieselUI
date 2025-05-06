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
}
export interface newError{
  id?: number;
  code:string;
  description:string;
}
export interface WorstCars{
  id?:number;
  model:String;
  partName:String;
  count:number;
  userId:String;
}

export interface updateIssues {
  PartName:String;
  description:string;
  DateReported: Date;
}
export interface Car {
  id?: number;
  plate: string;
  name:string;
  age:number;
  errorHistory?: { $values: Issue[]};
  //errorHistory: { $values: Issue[] };
  lastMaintenanceDate:Date | string;
  userId:String;
}
export interface CarWithoutValues {
  id?: number;
  plate: string;
  name: string;
  age: number;
  errorHistory: Issue[]; // Direkt dizi
  lastMaintenanceDate: Date | string;
  userId: string;
}
interface ApiResponse {
  $id: string;
  $values: Array<{
    $id: string;
    description: string;
    userId: string;
    count: number;
  }>;
}
interface ApiResponse2 {
  $id: string;
  $values: Array<{
    $id: string;
    model:string;
    engineType:string;
    partName:string;
    count:number;
  }>;
}
export interface Issue{
  id?:number;
  model?:string;
  engineType?:string;
  partName?:string;
  description?:string;
  dateReported?:Date | string;
  isReplaced:boolean;
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

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }
  addCar(car: CarWithoutValues): Observable<Car> {
    const headers = this.getAuthHeaders();
  console.log('API Request Payload:', JSON.stringify(car, null, 2));
  
  return this.http.post<Car>(`${this.apiUrl}/cars/AddCar`, car, { 
    headers: headers,
    withCredentials: true
  }).pipe(
    catchError(error => {
      console.error('API Hatası Detayları:', {
        status: error.status,
        message: error.message,
        error: error.error
      });
      return throwError(() => error);
    })
  );
}
  getCars(): Observable<Car[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Car[]>(`${this.apiUrl}/cars/GetAll`, { headers });
  }
  addError(error: newError): Observable<newError> {
    const headers = this.getAuthHeaders();
    return this.http.post<newError>(`${this.apiUrl}/errors/AddError`, error, { headers });
  }
  logOut(){
    const token = localStorage.getItem('token');
    if (!token){
      return;
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}` )
    return this.http.post(`${this.apiUrl}/api/auth/logout`, {}, {headers} )
    }
  getError(errorName: string): Observable<newError> {
    const headers = this.getAuthHeaders();
    return this.http.get<newError>(`${this.apiUrl}/errors/GetErrorByName/${errorName}`, { headers });
  }

  updateCar(plateNumber: string, issues: any[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(
      `${this.apiUrl}/cars/UpdateCar/${plateNumber}`,
      issues.map(issue => ({
        partName: issue.PartName,
        description: issue.Description,
        isReplaced: issue.IsReplaced,
        dateReported: issue.DateReported.toISOString()
      })),
      { headers }
    );
  }
  getCarsAll(){
    const headers = this.getAuthHeaders();
    return this.http.get<Car []>(`${this.apiUrl}/cars/GetAll`,{ headers });
  }

  deleteCar(plate:string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/cars/deleteCar/${plate}`, { headers });
  }

  getCarCount(): Observable<number> {
    const headers = this.getAuthHeaders();
    return this.http.get<number>(`${this.apiUrl}/cars/count`, { headers });
  }

  getCarByPlate(plate: string): Observable<Car> {
    const headers = this.getAuthHeaders();
    return this.http.get<Car>(`${this.apiUrl}/cars/GetCarByPlate/${plate}`, { headers });
  }
  GetModelsWithBrokenParts(): Observable<ApiResponse2>{
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse2>(`${this.apiUrl}/cars/GetModelsWithBrokenParts`, { headers });
  }
  MostCommonProblems(): Observable<ApiResponse>{
    const headers=this.getAuthHeaders();
    return this.http.get<ApiResponse>(`${this.apiUrl}/cars/MostCommonProblems`, { headers });
  }
  getAllIssues(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/cars/issues`, { headers });
  }
}
