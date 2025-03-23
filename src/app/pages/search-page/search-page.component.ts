import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../restApiService/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit {
  cars: any[] = [];
  
  constructor(private apiService: ApiService) {}
  
  ngOnInit(): void {
    this.loadCars();
  }
  
  loadCars() {
    this.apiService.getCars().subscribe(data => {
      this.cars = data;
    });
  }
  
  deleteCar(id: number): void {
    if(confirm('Bu aracı silmek istediğinize emin misiniz?')) {
      this.apiService.deleteCar(id).subscribe(
        () => {
          alert('Araç başarıyla silindi.');
          this.loadCars();
        },
        (error) => {
          alert('Araç silinirken bir hata oluştu');
          console.error(error);
        }
      );
    }
  }
}
