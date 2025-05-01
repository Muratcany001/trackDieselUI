import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../restApiService/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, map, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit {
  cars: any[] = [];
  message:string = "";
  isLoading:boolean = true
;
  constructor(private apiService: ApiService) {}
  private destroy$ = new Subject<void>();
  ngOnInit(): void {
    this.loadCars();
  }
  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadCars() {
    this.isLoading = true;
    this.apiService.getCars().pipe(
      map((response: any) => {
        console.log('API Yanıtı:', response);
        
        // API yanıtından araç listesini al ($values içinde)
        const cars = response.$values || [];
        
        // Her bir aracı işle
        return cars.map((car: any) => {
          // ErrorHistory'i işle (eğer varsa)
          const errorHistory = car.errorHistory?.$values?.map((issue: any) => ({
            ...issue,
            dateReported: issue.dateReported ? new Date(issue.dateReported) : null
          })) || [];
          
          // LastMaintenanceDate'i Date objesine çevir
          const lastMaintenanceDate = car.lastMaintenanceDate 
            ? new Date(car.lastMaintenanceDate) 
            : null;
          
          return {
            ...car,
            errorHistory,
            lastMaintenanceDate,
            // Diğer tarih alanları varsa onları da çevirebilirsiniz
          };
        });
      }),
      catchError(error => {
        console.error('Hata:', error);
        return of([]); // Hata durumunda boş array dön
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (processedCars) => {
        console.log('İşlenmiş Araç Verileri:', processedCars);
        this.cars = processedCars;
        this.isLoading = false;
        this.message = `${processedCars.length} araç başarıyla yüklendi`;
      },
      error: (error) => {
        console.error('API Hatası:', error);
        this.isLoading = false;
        this.message = 'Araçlar yüklenirken hata oluştu';
      }
    });
  }
}
