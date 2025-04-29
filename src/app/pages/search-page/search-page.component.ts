import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../restApiService/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { map, Subject, takeUntil } from 'rxjs';

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
        if (response.errorHistory && response.errorHistory['$values'] && Array.isArray(response.errorHistory['$values'])) {
          return {
            ...response,
            $values: response.$values.map((carData: any) => ({
              ...carData,
              errorHistory: carData.errorHistory && carData.errorHistory['$values']
                ? carData.errorHistory['$values'].map((issue: any) => ({
                    ...issue,
                    dateReported: new Date(issue.dateReported)
                  }))
                : []
            }))
          };
        }

        return response;
      }),
      takeUntil(this.destroy$)
    ).subscribe(
      (carData) => {
        console.log('Gelen Araç Verisi:', carData);
        this.cars = carData.$values || [];
        this.isLoading = false;
        this.message = 'Araçlar başarıyla yüklendi';
      },
      (error) => {
        console.error('Hata:', error);
        this.isLoading = false;
        this.message = 'Araçlar yüklenemedi';
      }
    );
  }
}
