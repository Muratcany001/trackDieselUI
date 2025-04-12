import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, newError } from '../../restApiService/api.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.css']
})
export class ErrorPageComponent implements OnInit {
  errorForm: FormGroup;
  code: string = '';
  description: string = '';
  errorName: string = '';
  message: string = '';
  isSuccess: boolean = false;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.errorForm = this.fb.group({
      errorName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    
  }

  getError() {
    if (this.errorForm.invalid) {
      this.message = 'Geçersiz form işlemi';
      this.isSuccess = false;
      return;
    }
  
    const errorName = this.errorForm.value.errorName;
    console.log('Sorgulanan hata kodu:', errorName);
    
    this.apiService.getError(errorName)
      .pipe(
        catchError(err => {
          console.error('API Hatası:', err);
          this.message = 'API bağlantı hatası';
          this.isSuccess = false;
          return of(null);
        })
      )
      .subscribe((response: any) => {
        console.log('Full API yanıtı:', response);
        
        if (response && response.code) {  // $id property'sini kontrol etmeye gerek yok
          this.code = response.code;
          this.description = response.description;
          console.log('Atanan değerler:', { 
            code: this.code, 
            description: this.description 
          });
          this.message = 'İşlem başarılı';
          this.isSuccess = true;
        } else {
          this.code = '';
          this.description = '';
          this.message = 'Arıza kodu bulunamadı';
          this.isSuccess = false;
        }
      });
  }
  addNewError (){
    const addError: newError = {
      code:'Hata kodu',
      description:'Açıklama'
    };
    this.apiService.addError(addError)
    .pipe(
      catchError(err=> {
        console.error('hata oluştu',err)
        return of(null);
      })
    )
    .subscribe(Response=>{
      if (Response){
        console.log('Hata başarıyla eklendi',Response)
      }
    })
  };
}
