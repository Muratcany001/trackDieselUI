import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../restApiService/api.service';

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
  constructor(
    private apiService: ApiService,
    private router: Router,
    private formBuilder: FormBuilder
  ){}
  ngOnInit(): void{
    this.loginForm = this.formBuilder.group({
      plateNumber:['',[Validators.required, Validators.minLength(5)]]
    });
  }
  searchPlate(): void{
    if(this.loginForm.invalid){
      return;
    }
    
    this.apiService.getCarByPlate(this.loginForm.value.plateNumber)
      .subscribe(
        (response) => {

          this.message="Araç bulundu";
          console.log(this.message);
        },
        (error) => {
          this.message="Araç bulunamadı";
          alert(this.message);
        }
      );
  }
}
