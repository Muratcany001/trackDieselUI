import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../restApiService/api.service';
import { AuthService } from '../../restApiService/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-page',
  imports:[ReactiveFormsModule,HttpClientModule,RouterModule,CommonModule],
  templateUrl: './delete-page.component.html',
  styleUrls: ['./delete-page.component.css']
})
export class DeletePageComponent {
  carForm!: FormGroup;
  loading:boolean =false;

  constructor(
    private apiService : ApiService,
    private authService : AuthService,
  ){}

  ngOnInit(): void{
      this.carForm = new FormGroup ({
        plateNumber : new FormControl('', Validators.required)
      });
  }
  deleteCar (){
    if(this.carForm.valid){
      const formValue = this.carForm.value;
      const userId = this.authService.getCurrentUserId();

      if(!userId){
        alert("Kullanıcı bulunamadı ");
        return;
      }
      const plateNumber = formValue.plateNumber;
      this.loading=true;
      this.apiService.deleteCar(plateNumber).subscribe({
        next: (response) => {
          console.log(response)
          this.carForm.reset()
          alert("Araç başarıyla silindi")
        },
        error: (error) => {
          console.error('Hata bulundu', error)
          if(error.error){
            console.error('Hata detayları',error.error)
          }
          alert("Kayıtlı araç bulunamadı");
        },
        complete: () => {
          this.loading=false;
        }});
    }
    else{
      alert('Lütfen tüm alanları doldurun');
    }
  }
}
