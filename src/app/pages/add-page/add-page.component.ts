import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService, CarWithoutValues, Part, Issue } from '../../restApiService/api.service';
import { AuthService } from '../../restApiService/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-page.component.html',
  styleUrls: ['./add-page.component.css']
})
export class AddPageComponent implements OnInit {
  carForm!: FormGroup;
  loading: boolean = false;
  showPartSelectionPanel: boolean = false;
  availableParts: Part[] = [];
  filteredParts: Part[] = [];
  loadingParts: boolean = false;
  selectedPart: Part | null = null;
  searchTerm: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    // isReplaced değiştiğinde değerleri güncelle
    this.carForm.get('isReplaced')?.valueChanges.subscribe(value => {
      this.onPartReplacedChange(value === 'true');
    });
  }

  initializeForm(): void {
    this.carForm = new FormGroup({
      carName: new FormControl('', Validators.required),
      carAge: new FormControl('', [Validators.required, Validators.min(0)]),
      carPlate: new FormControl('', Validators.required),
      lastMaintenanceDate: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      engineType: new FormControl('', Validators.required),
      partName: new FormControl({value: '', disabled: false}, Validators.required),
      description: new FormControl('', Validators.required),
      dateReported: new FormControl('', Validators.required),
      isReplaced: new FormControl('false', Validators.required),
      quantity: new FormControl({value: 1, disabled: true}, [Validators.required, Validators.min(1)])
    });
  }
  
  onPartReplacedChange(isReplaced: boolean): void {
    // Reset states first
    this.resetPartSelection();
    
    if (isReplaced) {
      // Parça değiştirilecekse
      this.loadAvailableParts();
      this.showPartSelectionPanel = true;
      this.carForm.get('partName')?.enable(); // Arama yapmak için enable et
      this.carForm.get('quantity')?.enable();
    } else {
      // Parça değiştirilmeyecekse
      this.showPartSelectionPanel = false;
      this.carForm.get('partName')?.enable(); // Serbest seçim için enable et
      this.carForm.get('quantity')?.disable();
      this.carForm.get('quantity')?.setValue(1);
    }
  }

  loadAvailableParts(): void {
    this.loadingParts = true;
    
    this.apiService.getAllParts().subscribe({
      next: (response: any) => {
        console.log('API parça yanıtı:', response);
        
        if (response && response.$values) {
          this.availableParts = response.$values;
        } else if (Array.isArray(response)) {
          this.availableParts = response;
        } else {
          console.warn('Beklenmeyen API yanıt formatı:', response);
          this.availableParts = [];
        }
        
        // Parçaları doğru şekilde işlemek için kontrol et ve stokta olmayanları filtrele
        this.availableParts = this.availableParts
          .map(part => {
            if (!part.id) console.warn('Parça ID bulunamadı:', part);
            if (!part.name) console.warn('Parça adı bulunamadı:', part);
            if (part.count === undefined || part.count === null) {
              console.warn('Parça count bulunamadı, varsayılan olarak 0 kullanılıyor:', part);
              part.count = 0;
            }
            
            return {
              ...part,
              count: typeof part.count === 'string' ? parseInt(part.count, 10) : part.count
            };
          })
          .filter(part => part.count > 0); // Sadece stokta olan parçaları göster
        
        this.filteredParts = [];
        this.loadingParts = false;
  
        if (this.availableParts.length === 0 && this.carForm.get('isReplaced')?.value === 'true') {
          alert('Sistemde kayıtlı değiştirilebilecek parça bulunamadı!');
        }
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
    
    // Eğer seçili parça varsa ve arama terimi değiştiyse, seçimi iptal et
    if (this.selectedPart && this.selectedPart.name.toLowerCase() !== searchTerm) {
      this.resetPartSelection();
    }
    
    if (searchTerm.length > 0 && this.carForm.get('isReplaced')?.value === 'true') {
      this.filteredParts = this.availableParts.filter(part => 
        part && part.name && part.name.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredParts = []; // Arama terimi yoksa veya parça değiştirilmeyecekse listeyi temizle
    }
  }

  selectPart(part: Part): void {
    this.selectedPart = part;
    
    // Form alanlarını güncelle
    this.carForm.patchValue({
      partName: part.name,
      quantity: 1
    });
    
    // Miktar alanını etkinleştir ve validasyonu güncelle
    const quantityControl = this.carForm.get('quantity');
    if (quantityControl) {
      quantityControl.enable();
      quantityControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(part.count)
      ]);
      quantityControl.updateValueAndValidity();
    }
    
    this.filteredParts = []; // Listeyi temizle
  }

  validateQuantity(): void {
    if (!this.selectedPart) return;
    
    const quantityControl = this.carForm.get('quantity');
    if (!quantityControl) return;

    let quantity = quantityControl.value;

    // Minimum 1 olmalı
    if (quantity < 1) {
      quantityControl.setValue(1);
    }

    // Maksimum stok miktarı kadar olabilir
    if (quantity > this.selectedPart.count) {
      alert(`Stokta sadece ${this.selectedPart.count} adet "${this.selectedPart.name}" bulunmaktadır! Miktar ${this.selectedPart.count} olarak ayarlandı.`);
      quantityControl.setValue(this.selectedPart.count);
    }
  }

  resetPartSelection(): void {
    this.selectedPart = null;
    this.filteredParts = [];
    this.searchTerm = '';
    
    // Parça değiştirilecekse inputu temizle
    if (this.carForm.get('isReplaced')?.value === 'true') {
      this.carForm.patchValue({
        partName: '',
        quantity: 1
      });
    }
  }

  resetForm(): void {
    this.carForm.reset({
      carName: '',
      carAge: '',
      carPlate: '',
      lastMaintenanceDate: '',
      model: '',
      engineType: '',
      partName: '',
      description: '',
      dateReported: '',
      isReplaced: 'false',
      quantity: 1
    });
    
    this.resetPartSelection();
    this.showPartSelectionPanel = false;
    this.carForm.get('partName')?.enable();
    this.carForm.get('quantity')?.disable();
  }

  // Helper method to ensure date is in proper ISO format
  formatDateForAPI(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '';
      }
      return date.toISOString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  addCar(): void {
    // Form geçerliliğini kontrol et
    if (this.carForm.invalid || this.loading) {
      this.markFormGroupTouched(this.carForm);
      
      // Hangi alanların eksik olduğunu tespit et ve göster
      const invalidControls: string[] = [];
      Object.keys(this.carForm.controls).forEach(key => {
        const control = this.carForm.get(key);
        if (control?.invalid) {
          invalidControls.push(key);
        }
      });
      
      console.error('Form geçersiz. Eksik alanlar:', invalidControls);
      alert(`Lütfen tüm zorunlu alanları doğru şekilde doldurun. Eksik alanlar: ${invalidControls.join(', ')}`);
      return;
    }

    // Form değerlerini al
    const formValue = this.carForm.getRawValue();
    console.log('Form değerleri:', formValue);
    
    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      alert("Kullanıcı bilgisi alınamadı.");
      return;
    }

    // Boolean tipine çevir: 'true' veya 'false' string değerleri yerine gerçek boolean değer kullan
    const isReplaced = formValue.isReplaced === 'true';

    // Parça değiştirilecekse ancak parça seçilmediyse hata ver
    if (isReplaced && !this.selectedPart) {
      alert("Parça değiştirilecekse lütfen listeden bir parça seçin.");
      return;
    }
    
    // Seçilen parçanın stok kontrolü
    if (isReplaced && this.selectedPart && (formValue.quantity <= 0 || formValue.quantity > this.selectedPart.count)) {
      alert(`Seçilen "${this.selectedPart.name}" parçasından ${formValue.quantity} adet kullanılamaz. Stok: ${this.selectedPart.count}.`);
      return;
    }

    // Tarihleri düzgün formatta hazırla
    const lastMaintenanceDate = this.formatDateForAPI(formValue.lastMaintenanceDate);
    const dateReported = this.formatDateForAPI(formValue.dateReported);
    
    // Tarih formatı kontrolü
    if (!lastMaintenanceDate || !dateReported) {
      alert("Lütfen geçerli tarih değerleri giriniz.");
      return;
    }

    

    // Issue verisini hazırla
    const issueData: Issue = {
      id: 0,
      model: formValue.model,
      engineType: formValue.engineType,
      partName: isReplaced ? (this.selectedPart?.name || '') : formValue.partName,
      description: formValue.description || 'Bilinmeyen arıza',
      dateReported: dateReported,
      isReplaced: isReplaced,
      carId: 0
    };

    // Description kontrolü
    if (!issueData.description) {
      console.error('Description alanı boş:', formValue);
      alert('Arıza açıklaması gereklidir. Lütfen bir açıklama seçin.');
      return;
    }

    // Parça değiştirilecekse ek bilgileri ekle
    if (isReplaced && this.selectedPart && this.selectedPart.id) {
      issueData.partId = this.selectedPart.id;
      issueData.count = Number(formValue.quantity);
    }

    // Car verisini hazırla - age property'sini parseInt kullanarak integer'a çevir
    const carData: CarWithoutValues = {
      id: 0, // Make sure this property exists if backend expects it
      name: formValue.carName,
      age: parseInt(formValue.carAge, 10), // String'i integer'a çevir
      plate: formValue.carPlate,
      lastMaintenanceDate: lastMaintenanceDate,
      errorHistory: [issueData],
      userId: userId,
      car: {} // Eksik car field'ını ekle
    };

    console.log("Gönderilen veri:", JSON.stringify(carData, null, 2));
    
    this.loading = true;
    this.apiService.addCar(carData).subscribe({
      next: (response) => {
        console.log('Araç başarıyla eklendi:', response);
        
        // Sadece araç ekleme başarılı ve parça değişimi yapılacaksa stok güncellemesi yap
        if (isReplaced && this.selectedPart && this.selectedPart.id && formValue.quantity) {
          // Numeric değerlere çevir
          const quantityToUse = Number(formValue.quantity);
          const partId = Number(this.selectedPart.id); // ID'nin numerik olduğundan emin ol
          const currentCount = Number(this.selectedPart.count);
          const newCount = currentCount - quantityToUse;
          
          if (newCount < 0) {
            console.error('Yeni stok negatif olamaz!');
            alert(`Stok hatası: ${currentCount} - ${quantityToUse} = ${newCount}`);
            this.loading = false;
            return;
          }
          
          console.log(`Stok güncelleniyor: ID=${partId}, Mevcut=${currentCount}, Kullanılan=${quantityToUse}, Yeni=${newCount}`);
          
          this.apiService.updatePart(partId, { count: newCount }).subscribe({
            next: (updatedStock) => {
              console.log('Stok güncellendi:', updatedStock);
              alert("Araç başarıyla eklendi ve stok güncellendi.");
              this.resetForm();
              this.loading = false;
            },
            error: (err) => {
              console.error('Stok güncelleme hatası detayları:', {
                error: err,
                partId: partId,
                newCount: newCount,
                requestData: { id: partId, count: newCount }
              });
              
              let errorMessage = 'Stok güncellenirken hata oluştu!';
              if (err.error) {
                if (typeof err.error === 'string') {
                  errorMessage += `\nHata: ${err.error}`;
                } else if (err.error.message) {
                  errorMessage += `\nHata: ${err.error.message}`;
                }
              }
              alert(errorMessage);
              this.loading = false;
            }
          });
        } else {
          alert("Araç başarıyla eklendi.");
          this.resetForm();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Araç ekleme hatası:', error);
        let errorMessage = 'Araç eklenirken bir hata oluştu.';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.title && error.error.errors) {
            errorMessage = `${error.error.title}: \n`;
            for (const key in error.error.errors) {
              errorMessage += `${key}: ${error.error.errors[key].join(', ')}\n`;
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        alert(errorMessage);
        this.loading = false;
      }
    });
  }

  // Logging helper to debug request
  logFormData(): void {
    const formValue = this.carForm.getRawValue();
    console.log('Form values:', formValue);
    
    console.log('isReplaced type:', typeof formValue.isReplaced);
    console.log('carAge type:', typeof formValue.carAge);
    console.log('quantity type:', typeof formValue.quantity);
    
    console.log('lastMaintenanceDate:', formValue.lastMaintenanceDate);
    console.log('dateReported:', formValue.dateReported);
  }
  
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
  
}