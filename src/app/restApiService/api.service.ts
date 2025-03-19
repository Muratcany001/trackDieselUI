import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = "localhost4200";
  constructor(private http: HttpClient) { }
  
  login(user: any): Observable<any>{
    return this.http.post(`${this.apiUrl}/login`, user);
  }

  addCar(car:any): Observable<any>{
    return this.http.post(`${this.apiUrl}/cars/addCar`,car);
  }
  getCars(): Observable<any>{
    return this.http.get(`${this.apiUrl}/cars`)
  }
  updateCar(car:any): Observable<any>{
    return this.http.put(`${this.apiUrl}/cars/updateCar`,car);
  }
  deleteCar(id:number):Observable<any>{
    return this.http.delete(`${this.apiUrl}/cars/deleteCar/${id}`);
  }
  getCarCount(): Observable<any>{
    return this.http.get(`${this.apiUrl}/cars/deleteCar/GetCarCount`);
  }
  getCarByPlate(plate:string): Observable<any>{
    return this.http.get(`${this.apiUrl}/cars/getCarByPlate/${plate}`);
  }
  getPatDemandPrediction(): Observable<any>{
    return this.http.get(`${this.apiUrl}/part-demand-prediction`);
  }
}
