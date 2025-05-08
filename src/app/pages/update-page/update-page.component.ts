import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { ApiService } from '../../restApiService/api.service';
import { Route, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-page',
  imports:[ReactiveFormsModule,FormsModule,CommonModule],
  standalone:true,
  templateUrl: './update-page.component.html',
  styleUrls: ['./update-page.component.css']
})
export class UpdatePageComponent {
    plateNumber: string="";
    updateForm!:FormGroup;
    message:String="";
    carDetails:any ={};
    issues:any = [];
    isLoading: boolean=false;
    constructor(private http:HttpClient,
      private apiService:ApiService,
      private router: Router,
      private formBuilder: FormBuilder
    ){
      this.updateForm = this.formBuilder.group({
        plateNumber : ['',Validators.required],
        partName : ['',Validators.required],
        description:['',Validators.required],
        isReplaced:[false, Validators.required],
        dateReported: ['',Validators.required],
        lastMaintenanceDate: ['', Validators.required]
      })
    }
    updateCar(): void{
      this.isLoading=true;
      if(this.updateForm.invalid){
        this.message= "Lütfen tüm alanları doldurun"
        return;
      }
      const issues = [{
        PartName: this.updateForm.value.partName,
        Description: this.updateForm.value.description,
        IsReplaced: this.updateForm.value.isReplaced,
        DateReported: new Date(this.updateForm.value.dateReported)
      }];
      const token = localStorage.getItem('token');
      if(!token){
        alert('Lütfen önce giriş yapın');
        this.router.navigate(['/login']);
        return;
      }
      const plateNumber = this.updateForm.value.plateNumber;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }); 

      this.apiService.updateCar(
        this.updateForm.value.plateNumber, 
        issues
      ).subscribe({
        next: (response) => {
          // API'den gelen yanıtı işliyoruz
          this.carDetails = {
            plateNumber: this.updateForm.value.plateNumber,
            errorHistory: Array.isArray(response) ? response.map(issue => ({
              ...issue,
              dateReported: new Date(issue.dateReported)
            })) : [],
            lastMaintenanceDate: new Date(this.updateForm.value.lastMaintenanceDate)
          };
          this.message = 'Araç başarıyla güncellendi';
          this.isLoading = false;
        },
        error: (error) => {
          if (error.status== 400){
            this.message= 'Araç bulunamadı'
          }else {
          this.message = 'Araç güncellenirken hata oluştu: ' + (error.error?.message || error.message);
          }
          this.isLoading = false;
          console.error('Güncelleme hatası:', error);
        }
      });
  }
}
