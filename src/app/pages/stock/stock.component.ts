import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Part } from '../../restApiService/api.service';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface PartWithSelection extends Part {
  selected?: boolean;
}

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [ReactiveFormsModule, HttpClientModule, RouterModule, CommonModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export class StockComponent implements OnInit {
  parts: PartWithSelection[] = [];
  filteredParts: PartWithSelection[] = [];
  stockForm: FormGroup;
  bulkForm: FormGroup;
  searchTerm: string = '';
  excludeZeroStock: boolean = true;
  isEditing: boolean = false;
  selectedPart: Part | null = null;
  showBulkUpdate: boolean = false;

  private searchSubject = new Subject<string>();

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.stockForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      count: [0, [Validators.required, Validators.min(0)]],
      state: ['active', Validators.required]
    });

    this.bulkForm = this.fb.group({
      count: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadParts();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchParts(term);
    });
  }

  loadParts(): void {
    this.apiService.getAllParts().subscribe({
      next: (data) => {
        this.parts = Array.isArray(data) ? data : [data];
        this.parts = this.parts.map(part => ({ ...part, selected: false }));
        this.applyFilters();
      },
      error: () => this.showMessage('Parçalar yüklenirken hata oluştu', 'error')
    });
  }

  applyFilters(): void {
    this.filteredParts = [...this.parts];

    if (this.searchTerm.trim()) {
      this.filteredParts = this.filteredParts.filter(part =>
        part.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.excludeZeroStock) {
      this.filteredParts = this.filteredParts.filter(part => part.count > 0);
    }
  }

  toggleAllParts(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filteredParts.forEach(part => part.selected = checked);
  }

  showBulkUpdateModal(): void {
    this.showBulkUpdate = true;
  }

  closeBulkUpdateModal(): void {
    this.showBulkUpdate = false;
    this.bulkForm.reset();
  }

  onSubmit(): void {
    if (this.stockForm.valid) {
      const formValue = this.stockForm.value;
      const part: Part = {
        id: 0,
        name: formValue.name,
        description: formValue.description || '',
        count: formValue.count,
        state: formValue.state,
        userId: ''
      };

      if (this.isEditing && this.selectedPart) {
        this.apiService.updatePart(this.selectedPart.id!, {
          count: part.count,
          state: part.state
        }).subscribe({
          next: () => {
            this.showMessage('Stok başarıyla güncellendi', 'success');
            this.resetForm();
            this.loadParts();
          },
          error: () => this.showMessage('Stok güncellenirken hata oluştu', 'error')
        });
      } else {
        this.apiService.addPart(part).subscribe({
          next: () => {
            this.showMessage('Stok başarıyla eklendi', 'success');
            this.resetForm();
            this.loadParts();
          },
          error: () => this.showMessage('Stok eklenirken hata oluştu', 'error')
        });
      }
    }
  }

  onBulkUpdate(): void {
    if (this.bulkForm.valid) {
      const count = this.bulkForm.get('count')?.value;
      const selectedParts = this.parts.filter(part => part.selected);

      if (selectedParts.length === 0) {
        this.showMessage('Lütfen en az bir parça seçin', 'warning');
        return;
      }

      const updatePromises = selectedParts.map(part =>
        this.apiService.updateStock(part.id!, count).toPromise()
      );

      Promise.all(updatePromises)
        .then(() => {
          this.showMessage('Toplu güncelleme başarılı', 'success');
          this.closeBulkUpdateModal();
          this.loadParts();
        })
        .catch(() => this.showMessage('Toplu güncelleme sırasında hata oluştu', 'error'));
    }
  }

  deletePart(id: number): void {
    if (confirm('Bu parçayı tamamen silmek istediğinizden emin misiniz?')) {
      this.apiService.deletePart(id).subscribe({
        next: () => {
          this.showMessage('Parça başarıyla silindi', 'success');
          this.loadParts();
        },
        error: () => this.showMessage('Parça silinirken hata oluştu', 'error')
      });
    }
  }

  editPart(part: Part): void {
    this.isEditing = true;
    this.selectedPart = part;
    this.stockForm.patchValue({
      name: part.name,
      description: part.description,
      count: part.count,
      state: part.state
    });
  }

  resetForm(): void {
    this.stockForm.reset({ state: 'active' });
    this.isEditing = false;
    this.selectedPart = null;
  }
  onSearchInputChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  searchParts(term: string): void {
    if (term.trim()) {
      this.apiService.searchPartsByName(term).subscribe({
        next: (data) => {
          this.parts = Array.isArray(data) ? data : [data];
          this.parts = this.parts.map(part => ({ ...part, selected: false }));
          this.applyFilters();
        },
        error: () => this.showMessage('Arama sırasında hata oluştu', 'error')
      });
    } else {
      this.loadParts();
    }
  }

  toggleZeroStockFilter(): void {
    this.excludeZeroStock = !this.excludeZeroStock;
    this.applyFilters();
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}