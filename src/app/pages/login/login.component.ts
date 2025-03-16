import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule,RouterOutlet],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private router: Router) {}

  onLogin() {
    if (this.username && this.password) {
      if (this.username === "admin" && this.password === "123") {
        this.router.navigate(['/mainPage']);
      } else {
        alert('Geçersiz kullanıcı adı veya şifre!');
      }
    } else {
      alert('Lütfen kullanıcı adı ve şifre giriniz!');
    }
  }
  
}