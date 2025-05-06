import { Component, model, OnInit } from '@angular/core';
import { ApiService } from '../../restApiService/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, count, map, of, Subject, takeUntil, tap} from 'rxjs';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit {
  CommonProblems: any[] = [];
  MostBrokenParts: any[] = [];
  cars: any[] = [];
  commonProblems:string="";
  brokenParts:string="";
  message:string = "";
  isLoading:boolean = true;

  
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
    interface BrokenParts {
      $id:string;
      model:string;
      engineType:string;
      partName:string;
      count:number;
    }
    interface ApiResponse2 {
      $id:string;
      $values: BrokenParts[];
    }
    interface FilteredProblem2{
      model:string;
      engineType:string;
      partName:string;
      count:number;
    }
    interface ProblemItem {
      $id: string;
      description: string;
      userId: string;
      count: number;
    }
    
    interface ApiResponse {
      $id: string;
      $values: ProblemItem[];
    }
    
    interface FilteredProblem {
      description: string;
      count: number;
    }
    
    this.apiService.MostCommonProblems()
    .pipe(
      tap((rawResponse: ApiResponse) => {
        console.log("Ham api yanıtı: ",rawResponse)
      }),
      map((response2: { $id: string, $values: Array<{ $id: string, description: string, userId: string, count: number }> }) => {
        return response2.$values.map(item => ({
          description: item.description,
          count:item.count
        }));
      })
    ).subscribe({
      next: (filteredResponse) => {
        console.log("Filtrelenmiş veri",filteredResponse);
        this.CommonProblems = filteredResponse;
      },
      error: (err)=> console.error("Hata:",err)
    })
    this.apiService.GetModelsWithBrokenParts()
    .pipe(
      tap((rawResponse : ApiResponse2) =>{
        console.log("Ham api yanıtı2",rawResponse)
      }),
      map((response3: { $id:string, $values: Array<{$id: string, model: string, engineType: string, partName:string, count: number}>})=>{
        return response3.$values.map(item=> ({
          model:item.model,
          engineType:item.engineType,
          partName: item.partName,
          count: item.count
        }))
      })
    ).subscribe({
      next: (filteredResponse) => {
        console.log("Filtrelenmiş veri",filteredResponse);
        this.MostBrokenParts=filteredResponse;
      },
      error: (err) => console.error("Hata bulundu: ",err)
    })
    this.isLoading = true;
    this.apiService.getCars().pipe(
      map((response: any) => {
        console.log('API Yanıtı:', response);
        const cars = response.$values || [];
        return cars.map((car: any) => {
          const errorHistory = car.errorHistory?.$values?.map((issue: any) => ({
            ...issue,
            dateReported: issue.dateReported ? new Date(issue.dateReported) : null
          })) || [];
          const lastMaintenanceDate = car.lastMaintenanceDate 
            ? new Date(car.lastMaintenanceDate) 
            : null;
          return {
            ...car,
            errorHistory,
            lastMaintenanceDate,
          };
        });
      }),
      catchError(error => {
        console.error('Hata:', error);
        return of([]);
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
