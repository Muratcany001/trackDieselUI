import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../restApiService/api.service';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent {
  plateNumber: string = '';
  loginForm!: FormGroup;
  message: string = '';
  carDetails: any = {};

  constructor(
    private apiService: ApiService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      plateNumber: ['', [Validators.required]]
    });
  }

  searchPlate(): void {
    if (this.loginForm.invalid) {
      return;
    }
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Lütfen önce giriş yapın');
      this.router.navigate(['/login']);
      return;
    }
    
    const plateNumber = this.loginForm.value.plateNumber;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    this.apiService.getCarByPlate(plateNumber)
  .pipe(
    map(response => {
      console.log('API Yanıtı:', response);
      if (response.errorHistory && response.errorHistory['$values'] && Array.isArray(response.errorHistory['$values'])) {
        return {
          ...response,
          errorHistory: response.errorHistory['$values'].map((issue: any) => ({
            ...issue,
            dateReported: new Date(issue.dateReported)
          }))
        };
      }
      return response;
    })
  )
  .subscribe(
    (carData) => {
      console.log('Gelen Araç Verisi:', carData);
      this.carDetails = carData;
      this.message = "Araç bulundu";
    },
    (error) => {
      this.message = "Araç bulunamadı";
      console.error(error);
    }
  );
  }
}
