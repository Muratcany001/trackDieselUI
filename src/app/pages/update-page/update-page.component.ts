import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ApiService, Part } from '../../restApiService/api.service';
import { Route, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-page',
  imports:[ReactiveFormsModule,FormsModule,CommonModule],
  standalone:true,
  templateUrl: './update-page.component.html',
  styleUrls: ['./update-page.component.css']
})
export class UpdatePageComponent implements OnInit {
    plateNumber: string="";
    updateForm!:FormGroup;
    message:String="";
    carDetails:any ={};
    issues:any = [];
    isLoading: boolean=false;
    availableParts: Part[] = [];
    filteredParts: Part[] = [];
    loadingParts: boolean = false;
    selectedPart: Part | null = null;
    searchTerm: string = '';
    loading: boolean = false;
    showPartSelectionPanel: boolean = false;

    constructor(private http:HttpClient,
      private apiService:ApiService,
      private router: Router,
      private formBuilder: FormBuilder
    ){
      this.updateForm = this.formBuilder.group({
        plateNumber : ['',Validators.required],
        partName : ['',Validators.required],
        description:['',Validators.required],
        isReplaced: [false, Validators.required],
        dateReported: ['',Validators.required],
        lastMaintenanceDate: ['', Validators.required],
        quantity: new FormControl({value: 0, disabled: true}, [Validators.required, Validators.min(0)])
      })
    }

    ngOnInit(): void {
      this.loadAvailableParts();
      
      // isReplaced değiştiğinde değerleri güncelle
      this.updateForm.get('isReplaced')?.valueChanges.subscribe(value => {
        this.onPartReplacedChange(value === 'true');
      });
    }

    updateCar(): void {
      this.isLoading = true;
      if (this.updateForm.invalid) {
        this.message = "Lütfen tüm alanları doldurun";
        return;
      }

      const formValue = this.updateForm.getRawValue();
      const isReplaced = formValue.isReplaced === 'true';

      // Parça değiştirilecekse ancak parça seçilmediyse hata ver
      if (isReplaced && !this.selectedPart) {
        alert("Parça değiştirilecekse lütfen listeden bir parça seçin.");
        this.isLoading = false;
        return;
      }

      // Seçilen parçanın stok kontrolü
      if (isReplaced && this.selectedPart && (formValue.quantity <= 0 || formValue.quantity > this.selectedPart.count)) {
        alert(`Seçilen "${this.selectedPart.name}" parçasından ${formValue.quantity} adet kullanılamaz. Stok: ${this.selectedPart.count}.`);
        this.isLoading = false;
        return;
      }

      const issues = [{
        PartName: formValue.partName,
        Description: formValue.description,
        IsReplaced: isReplaced,
        DateReported: new Date(formValue.dateReported)
      }];

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Lütfen önce giriş yapın');
        this.router.navigate(['/login']);
        return;
      }

      const plateNumber = formValue.plateNumber;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      this.apiService.updateCar(plateNumber, issues).subscribe({
        next: (response) => {
          // Araç güncelleme başarılı ve parça değişimi yapılacaksa stok güncellemesi yap
          if (isReplaced && this.selectedPart && this.selectedPart.id && formValue.quantity) {
            const quantityToUse = Number(formValue.quantity);
            const partId = Number(this.selectedPart.id);
            const currentCount = Number(this.selectedPart.count);
            const newCount = currentCount - quantityToUse;

            if (newCount < 0) {
              console.error('Yeni stok negatif olamaz!');
              alert(`Stok hatası: ${currentCount} - ${quantityToUse} = ${newCount}`);
              this.isLoading = false;
              return;
            }

            this.apiService.updatePart(partId, { count: newCount }).subscribe({
              next: (updatedStock) => {
                console.log('Stok güncellendi:', updatedStock);
                this.message = 'Araç ve stok başarıyla güncellendi';
                this.isLoading = false;
                this.loadAvailableParts(); // Parça listesini yenile
              },
              error: (err) => {
                console.error('Stok güncelleme hatası:', err);
                let errorMessage = 'Stok güncellenirken hata oluştu!';
                if (err.error) {
                  if (typeof err.error === 'string') {
                    errorMessage += `\nHata: ${err.error}`;
                  } else if (err.error.message) {
                    errorMessage += `\nHata: ${err.error.message}`;
                  }
                }
                alert(errorMessage);
                this.isLoading = false;
              }
            });
          } else {
            this.message = 'Araç başarıyla güncellendi';
            this.isLoading = false;
          }
        },
        error: (error) => {
          if (error.status == 400) {
            this.message = 'Araç bulunamadı';
          } else {
            this.message = 'Araç güncellenirken hata oluştu: ' + (error.error?.message || error.message);
          }
          this.isLoading = false;
          console.error('Güncelleme hatası:', error);
        }
      });
    }

    loadAvailableParts(): void {
      this.loadingParts = true;
      
      this.apiService.getAllParts().subscribe({
        next: (response: any) => {
          if (response && response.$values) {
            this.availableParts = response.$values;
          } else if (Array.isArray(response)) {
            this.availableParts = response;
          } else {
            console.warn('Beklenmeyen API yanıt formatı:', response);
            this.availableParts = [];
          }
          
          // Stokta olmayan parçaları filtrele
          this.availableParts = this.availableParts
            .map(part => ({
              ...part,
              count: typeof part.count === 'string' ? parseInt(part.count, 10) : part.count
            }))
            .filter(part => part.count > 0); // Sadece stokta olan parçaları göster
          
          this.filteredParts = [];
          this.loadingParts = false;
        },
        error: (err) => {
          console.error('Parça yükleme hatası:', err);
          this.availableParts = [];
          this.filteredParts = [];
          this.loadingParts = false;
          alert('Parça listesi yüklenirken hata oluştu!');
        }
      });
    }

    onPartSearch(event: Event): void {
      const searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();
      this.searchTerm = searchTerm;
      
      if (this.selectedPart && this.selectedPart.name.toLowerCase() !== searchTerm) {
        this.resetPartSelection();
      }
      
      if (searchTerm.length > 0 && this.updateForm.get('isReplaced')?.value === 'true') {
        this.filteredParts = this.availableParts.filter(part => 
          part && part.name && part.name.toLowerCase().includes(searchTerm)
        );
      } else {
        this.filteredParts = [];
      }
    }

    selectPart(part: Part): void {
      this.selectedPart = part;
      
      this.updateForm.patchValue({
        partName: part.name,
        quantity: 1
      });
      
      const quantityControl = this.updateForm.get('quantity');
      if (quantityControl) {
        quantityControl.enable();
        quantityControl.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(part.count)
        ]);
        quantityControl.updateValueAndValidity();
      }
      
      this.filteredParts = [];
    }

    validateQuantity(): void {
      if (!this.selectedPart) return;
      
      const quantityControl = this.updateForm.get('quantity');
      if (!quantityControl) return;

      let quantity = quantityControl.value;

      if (quantity < 1) {
        quantityControl.setValue(1);
      }

      if (quantity > this.selectedPart.count) {
        alert(`Stokta sadece ${this.selectedPart.count} adet "${this.selectedPart.name}" bulunmaktadır! Miktar ${this.selectedPart.count} olarak ayarlandı.`);
        quantityControl.setValue(this.selectedPart.count);
      }
    }

    resetPartSelection(): void {
      this.selectedPart = null;
      this.filteredParts = [];
      this.searchTerm = '';
      
      if (this.updateForm.get('isReplaced')?.value === 'true') {
        this.updateForm.patchValue({
          partName: '',
          quantity: 1
        });
      }
    }

    updatePart(): void {
      if (this.updateForm.invalid || this.isLoading || !this.selectedPart) {
        this.markFormGroupTouched(this.updateForm);
        return;
      }

      const formValue = this.updateForm.getRawValue();
      const newCount = Number(formValue.quantity);
      
      if (newCount < 0) {
        alert('Stok miktarı negatif olamaz!');
        return;
      }

      this.isLoading = true;
      
      if (!this.selectedPart?.id) {
        alert('Parça ID bulunamadı!');
        this.isLoading = false;
        return;
      }
      
      this.apiService.updatePart(this.selectedPart.id, { count: newCount }).subscribe({
        next: (updatedPart) => {
          console.log('Stok güncellendi:', updatedPart);
          alert("Stok başarıyla güncellendi.");
          this.resetPartSelection();
          this.loadAvailableParts(); // Listeyi yenile
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Stok güncelleme hatası:', err);
          let errorMessage = 'Stok güncellenirken hata oluştu!';
          if (err.error) {
            if (typeof err.error === 'string') {
              errorMessage += `\nHata: ${err.error}`;
            } else if (err.error.message) {
              errorMessage += `\nHata: ${err.error.message}`;
            }
          }
          alert(errorMessage);
          this.isLoading = false;
        }
      });
    }

    markFormGroupTouched(formGroup: FormGroup): void {
      Object.values(formGroup.controls).forEach(control => {
        control.markAsTouched();
      });
    }

    onPartReplacedChange(isReplaced: boolean): void {
      this.resetPartSelection();
      
      if (isReplaced) {
        this.loadAvailableParts();
        this.showPartSelectionPanel = true;
        this.updateForm.get('partName')?.enable();
        this.updateForm.get('quantity')?.enable();
      } else {
        this.showPartSelectionPanel = false;
        this.updateForm.get('partName')?.enable();
        this.updateForm.get('quantity')?.disable();
        this.updateForm.get('quantity')?.setValue(1);
      }
    }
}
