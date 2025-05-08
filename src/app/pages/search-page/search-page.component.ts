import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../restApiService/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, map, of, Subject, takeUntil, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit, OnDestroy {
  CommonProblems: any[] = [];
  MostBrokenParts: any[] = [];
  cars: any[] = [];
  brokenParts: string = '';
  message: string = '';
  isLoading: boolean = true;
  geminiApiKey: string = '';
  MostCode: any[] = [];
  PartCode: any[] = [];
  description: string = '';
  isSuccess: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private apiService: ApiService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCars();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCars() {
    // 1. Common Problems
    this.apiService.MostCommonProblems()
      .pipe(
        map(response => response.$values.map((item: any) => ({
          description: item.description,
          count: item.count
        })))
      )
      .subscribe({
        next: (filteredResponse) => {
          this.CommonProblems = filteredResponse;
          this.checkIfDataReady();
        },
        error: (err) => console.error("Hata:", err)
      });

    // 2. Most Broken Parts
    this.apiService.GetModelsWithBrokenParts()
      .pipe(
        map(response => response.$values.map((item: any) => ({
          model: item.model,
          engineType: item.engineType,
          partName: item.partName,
          count: item.count
        })))
      )
      .subscribe({
        next: (filteredResponse) => {
          this.MostBrokenParts = filteredResponse;
          this.checkIfDataReady();
        },
        error: (err) => console.error("Hata bulundu:", err)
      });

    // 3. Car List
    this.apiService.getCars().pipe(
      map((response: any) => {
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
  checkIfDataReady() {
    if (this.CommonProblems.length > 0 && this.MostBrokenParts.length > 0) {
      this.fetchErrorFromGemini(this.CommonProblems, this.MostBrokenParts).subscribe({
        next: (response) => {
          if (response.generatedText) {
            this.MostCode = this.MostBrokenParts;
            this.PartCode = this.CommonProblems;
            this.description = response.generatedText;
            this.message = 'AI yanıtı başarıyla alındı';
            this.isSuccess = true;
          } else {
            this.message = 'AI yanıtı alınamadı';
            this.isSuccess = false;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.message = 'Hata oluştu: ' + error.message;
          this.isSuccess = false;
          this.isLoading = false;
        }
      });
    }
  }

  fetchErrorFromGemini(commonProblems: any[], mostBrokenParts: any[]) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;

    const commonProblemsText = commonProblems.map(prob =>
      `${prob.description} (${prob.count} kez)`
    ).join(", ");

    const brokenPartsText = mostBrokenParts.map(part =>
      `${part.model} ${part.engineType} - ${part.partName} (${part.count} kez)`
    ).join(", ");

    const prompt = `
Aşağıdaki verileri analiz edip özet bilgiler sağla:

EN ÇOK KARŞILAŞILAN SORUNLAR:
${commonProblemsText}

EN ÇOK ARIZALANAN PARÇALAR:
${brokenPartsText}

İstenen çıktı formatı:
En çok karşılaşılan 3 sorunu listele
2. Araç modeli ve motor tipine göre en çok arızalanan 5 parçayı listele örnek: passat dizel turbo, doblo dizel enjektör , transported dizel turbo, linea dizel enjektör
3. Yanıtını kısa ve öz tut, hikaye anlatma
4. Her maddeyi numaralandır
5. Bu prompt kullanıcı bilgilendirme otomasyonunda çalışacaktır yani bu vereceğin cevabı kullanıcı direkt olarak görecek ve prompt olarak yazıldıgının belli olmaması gerekiyor.
`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100
      }
    };

    interface GeminiResponse {
      candidates?: {
        content: {
          parts: { text: string }[]
        }
      }[];
    }

    return this.http.post<GeminiResponse>(apiUrl, requestBody).pipe(
      map(response => {
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        return { generatedText: text || 'Yanıt işlenemedi' };
      }),
      catchError(error => {
        console.error('Gemini Error:', error);
        return throwError(() => new Error('AI servisine bağlanılamadı'));
      })
    );
  }
}
