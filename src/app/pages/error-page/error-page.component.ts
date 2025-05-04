import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of, throwError } from 'rxjs';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.css']
})
export class ErrorPageComponent implements OnInit {
  errorForm: FormGroup;
  code: string = '';
  description: string = '';
  errorName: string = '';
  message: string = '';
  isSuccess: boolean = false;
  isLoading: boolean = false;
  geminiApiKey = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.errorForm = this.fb.group({
      errorName: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  getError() {
    if (this.errorForm.invalid) {
      this.message = 'Lütfen geçerli bir hata kodu girin';
      this.isSuccess = false;
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.errorName = this.errorForm.value.errorName;

    this.fetchErrorFromGemini(this.errorName).subscribe({
      next: (response) => {
        if (response.generatedText) {
          this.code = this.errorName;
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

  fetchErrorFromGemini(errorName: string) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
    const prompt = `OBD2 ${errorName} arıza kodu için:
  1. Arızanın teknik adını detaylıca anlat
  2. Arızalı olabilecek parçaları 1-2-3 şeklinde maddele
  3. Her madde EN FAZLA 3 kelime olsun
  4. Toplam yanıt 50 kelimeyi GEÇMESİN
  
  Örnek çıktı formatı:
  "Egzoz gazı devirdaim A devresi yüksek basın."
  Arızalı olabilecek Parçalar:
  1- Turbo pervanesi
  2- Vana sensörü
  3- Basınç hortumu"`;
    
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