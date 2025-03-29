import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../restApiService/api.service';

@Component({
  selector: 'app-add-page',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './add-page.component.html',
  styleUrls: ['./add-page.component.css']
})
export class AddPageComponent implements OnInit {
  carForm!: FormGroup;
  loading: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carForm = new FormGroup({
      carName: new FormControl('', Validators.required),
      carAge: new FormControl('', Validators.required),
      carPlate: new FormControl('', Validators.required),
      lastMaintenanceDate: new FormControl('', Validators.required),
      // Issue (errorHistory) alanları
      model: new FormControl('', Validators.required),           // Issue.model
      engineType: new FormControl('', Validators.required),      // Issue.engineType
      partName: new FormControl('', Validators.required),        // Issue.partName (tek değer olarak)
      description: new FormControl('', Validators.required),     // Issue.description
      dateReported: new FormControl('', Validators.required),    // Issue.dateReported
      isReplaced: new FormControl('false', Validators.required)    // Issue.isReplaced (string olarak geliyor; boolean'a çevrilecek)
    });
  }

  addCar(): void {
    if (this.carForm.valid) {
      const formValue = this.carForm.value;
      // Oluşturulan nesne, JSON örneğinizle uyumlu olacak şekilde düzenlendi:
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
            isReplaced: formValue.isReplaced === 'true'
          }
        ]
      };

      this.loading = true;
      this.apiService.addCar(carData).subscribe(
        (response) => {
          console.log('Car added successfully', response);
          alert("Car added succesfully");
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
