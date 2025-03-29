import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../restApiService/api.service';
import { map } from 'rxjs/operators'; // Bu satırı ekleyin
import { Observable } from 'rxjs'; // Bu da zaten yoksa ekleyin
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
  message:string='';
  carDetails:any={};
  constructor(
    private apiService: ApiService,
    private router: Router,
    private formBuilder: FormBuilder
  ){}
  ngOnInit(): void{
    this.loginForm = this.formBuilder.group({
      plateNumber:['',[Validators.required]]
    });
  }
  searchPlate(): void {
    if(this.loginForm.invalid){
      return;
    }
    const plateNumber = this.loginForm.value.plateNumber;
    
    this.apiService.getCarByPlate(plateNumber)
      .pipe(
        map(response => {
          // errorHistory.$values yerine direkt errorHistory array'ini kullan
          if (response.errorHistory && response.errorHistory.values) {
            return {
              ...response,
              errorHistory: response.errorHistory.values
            };
          }
          return response;
        })
      )
      .subscribe(
        (carData) => {
          this.carDetails = carData;
          console.log('Araç Detayları:', this.carDetails);
        },
        (error) => {
          this.message = "Araç bulunamadı";
          alert(this.message);
        }
      );  
  }
}
