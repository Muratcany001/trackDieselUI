import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { LoginComponent } from "./pages/login/login.component";
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from './restApiService/api.service';
import { Token } from '@angular/compiler';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink,ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'trackDieselUI';
  logoutForm!: FormGroup;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private formBuilder: FormBuilder
  ){}
  ngOnInit():void{
   this.logoutForm! = this.formBuilder.group({
   });
  }
  logOutService():void{
    const token = localStorage.getItem('token');
    if (!token){
      console.log("token bulunamadı")
      return;
    }
    this.apiService.logOut()?.subscribe(
      response => {
        console.log("Çıkış yapıldı")
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      },
      err => {
        console.log("Hatayla karılaşıldı",err)
      }
    );
  }
}
