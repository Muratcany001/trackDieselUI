import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService, Car, CarWithoutValues } from '../../restApiService/api.service';
import { AuthService } from '../../restApiService/auth.service';



@Component({
  selector: 'app-add-page',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './add-page.component.html',
  styleUrls: ['./add-page.component.css']
})
export class AddPageComponent implements OnInit {
  carForm!: FormGroup;
  loading: boolean = false;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.carForm = new FormGroup({
      carName: new FormControl('', Validators.required),
      carAge: new FormControl('', Validators.required),
      carPlate: new FormControl('', Validators.required),
      lastMaintenanceDate: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      engineType: new FormControl('', Validators.required),
      partName: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      dateReported: new FormControl('', Validators.required),
      isReplaced: new FormControl('false', Validators.required)
    });
  }

  // add-page.component.ts'de
  addCar(): void {
    if (this.carForm.valid) {
      const formValue = this.carForm.value;
      const userId = this.authService.getCurrentUserId();
         
      if (!userId) {
        alert("Kullanıcı bilgisi alınamadı.");
        return;
      }
      
      // Tarihleri ISO formatına çeviriyoruz
      const lastMaintenanceDate = new Date(formValue.lastMaintenanceDate).toISOString();
      const dateReported = new Date(formValue.dateReported).toISOString();
      
      // Car nesnesini doğru formatta oluşturuyoruz
      const carData: CarWithoutValues = {
        name: formValue.carName,
        age: formValue.carAge,
        plate: formValue.carPlate,
        lastMaintenanceDate: lastMaintenanceDate,
        errorHistory: [
          {
            model: formValue.model,
            engineType: formValue.engineType,
            partName: formValue.partName,
            description: formValue.description,
            dateReported: dateReported,
            isReplaced: formValue.isReplaced === 'true',
            carId: 0
          }
        ],
        userId: userId
      };
      
      console.log("Gönderilen veri:", JSON.stringify(carData, null, 2)); // Debug için
      
      this.loading = true;
      this.apiService.addCar(carData).subscribe({
        next: (response) => {
          console.log('Başarılı:', response);
          alert("Araç başarıyla eklendi");
          this.carForm.reset();
        },
        error: (error) => {
          console.error('Hata:', error);
          if (error.error) {
            console.error('Hata Detayları:', error.error);
          }
          alert('Hata oluştu: ' + (error.error?.message || error.message));
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      alert('Lütfen tüm zorunlu alanları doldurun');
    }
  }
}