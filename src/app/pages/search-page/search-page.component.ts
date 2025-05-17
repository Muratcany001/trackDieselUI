import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../restApiService/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, count, map, Observable, of, Subject, takeUntil, tap, throwError } from 'rxjs';
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
  carCount:number = 0;

  private destroy$ = new Subject<void>();

  constructor(private apiService: ApiService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCars();
    this.getCarCount();
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
          dateReported:item.dateReported,
          count: item.count
        })))
      )
      .subscribe({
        next: (filteredResponse) => {
          this.CommonProblems = filteredResponse;
          console.log(filteredResponse);
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
          dateReported:item.dateReported,
          count: item.count
        })))
      )
      .subscribe({
        next: (filteredResponse) => {
          this.MostBrokenParts = filteredResponse;
          console.log("GetModelsWithBrokenPart", filteredResponse);
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

  getCarCount(){
    this.apiService.getCarCount().subscribe(
      count => {
        console.log("Araç sayısı",count)
        this.carCount= Number(count);
      },
      error => {
        console.log("Karşılaşılan hata:",error)
      }
    )
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
      `${prob.description} --${prob.dateReported}-  (${prob.count} kez)`
    ).join(", ");
    const brokenPartsText = mostBrokenParts.map(part =>
      `${part.model} ${part.engineType} - ${part.partName} - ${part.dateReported}  (${part.count} kez)`
    ).join(", ");
    const prompt = `
Aşağıdaki verileri analiz edip özet bilgiler sağla:
EN ÇOK KARŞILAŞILAN SORUNLAR:
${commonProblemsText}

EN ÇOK ARIZALANAN PARÇALAR:
${brokenPartsText}

      İstenen çıktı formatı:
      Cevaba "Analiz sonuçları:" Diyerek başla
      1. 1 ay içerisinde en çok karşılaşılan 3 arızalı parçayı listele Bu madde 2. Maddenin sadece 1 ay içerisindeki halidir. örnek: mercedes c200 dizel turbo
      2. Ayrıca son 1 ay içerisinde en sık karşılaşılan 3 problemi ver. dateReport adlı öznitelikten çek bu verileri ve analiz yap. Örnek: çekiş düşüklüğü, gaz yememe sorunu, conta patlatma
      3. Tüm zamanlarda Araç modeli ve motor tipine göre en çok arızalanan 3 parçayı belirt. Format: “Model Motor Parça” (örnek: Passat Dizel Turbo).
      4. Yanıtını kısa ve öz tut, hikaye anlatma
      5. Yanıtı kısa, maddeli ve kullanıcıya yönelik net şekilde hazırla.
      6. Açıklamalar sade, teknik terimler anlaşılır olmalı.
      7. Sadece analiz yap. Karşında cevaplar, işte sonuçlar gibi cevaplar verme kullanıcıya dateReport vs vs şeyler yazma
      `;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200
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
  isOverThreeYears(date: Date): boolean {
    const threeYearsLater = new Date(date);
    threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
    return new Date() >= threeYearsLater;
  }
  
}
