import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../restApiService/api.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private formBuilder: FormBuilder
  ){}
  ngOnInit(){
  const token = localStorage.getItem('token');
  }
  logOut (){
    this.apiService.logOut()
    ?.pipe(
      map( response =>
        console.log("Api yanıtı", response)
      )
    )
  }
}
