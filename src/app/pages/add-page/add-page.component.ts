import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../restApiService/api.service';
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

  addCar(): void {
    if (this.carForm.valid) {
      const formValue = this.carForm.value;

      // Auth servisi ile kullanıcı ID'sini al
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        alert("Kullanıcı bilgisi alınamadı.");
        return;
      }

      // carData nesnesini oluştur
      const carData = {
        name: formValue.carName,
        age: formValue.carAge,
        plate: formValue.carPlate,
        lastMaintenanceDate: formValue.lastMaintenanceDate,
        errorHistory: [
          {
            model: formValue.model,
            engineType: formValue.engineType,
            partName: formValue.partName,
            description: formValue.description,
            dateReported: formValue.dateReported,
            isReplaced: formValue.isReplaced === 'true',
            carId: 0 // Backend tarafından otomatik olarak oluşturulacak ID
          }
        ],
        userId: userId, // Kullanıcı ID'sini ekle
      };

      this.loading = true;
      this.apiService.addCar(carData).subscribe(
        (response) => {
          console.log('Car added successfully', response);
          alert("Car added successfully");
          this.loading = false;
        },
        (error) => {
          console.error('Error adding car:', error);
          this.loading = false;
        }
      );
    } else {
      alert('Form is invalid');
    }
  }
}
