import { Component } from '@angular/core';
import { ApiService } from '../../restApiService/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-page.component.html',
  styleUrls: ['./ai-page.component.css']
})
export class AiPageComponent {
    cars:any[] = [];
    constructor(private apiService: ApiService){}
    
    loadCars() {
      this.apiService.getCars().subscribe(data => {
        this.cars = data;
      });
    }
    
    ngOnInit(): void {
      this.loadCars();
    }
    deleteCar(id:number):void{
      if(confirm('Bu aracı silmek istediğinize emin misiniz?')){
        this.apiService.deleteCar(id).subscribe(
          ()=> {
            alert('Araç başarıyla silindi.');
            this.loadCars();
          },
          (error) => {
            alert('Araç silinirken bir hata oluştu');
            console.error(error);
          }
        )
      }


    }
}
