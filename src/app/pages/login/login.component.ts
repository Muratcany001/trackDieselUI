import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../restApiService/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterOutlet, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  
  constructor(
    private router: Router,
    private apiService: ApiService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const user = {
      name: this.loginForm.value.name,
      password: this.loginForm.value.password
    };

    console.log('Login denemesi:', user);
    this.apiService.login(user).subscribe({
      next: (response) => {
        console.log('Login yanıtı:', response);
        if (response && response.token) {
          console.log('Token alındı, localStorage\'a kaydediliyor');
          localStorage.setItem('token', response.token);
          this.router.navigate(['/mainPage']);
        } else {
          console.error('Yanıtta token yok:', response);
          this.errorMessage = 'Geçersiz yanıt alındı';
        }
      },
      error: (error) => {
        console.error('Login hatası:', error);
        if (error.status === 0) {
          this.errorMessage = 'API sunucusuna bağlanılamıyor. Lütfen API\'nin çalıştığından emin olun.';
        } else if (error.status === 401) {
          this.errorMessage = 'Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
        } else {
          this.errorMessage = `Giriş yapılırken bir hata oluştu: ${error.message}`;
        }
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }
}