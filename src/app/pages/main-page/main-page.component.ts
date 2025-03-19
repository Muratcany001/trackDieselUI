import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent {
  plateNumber: string = '';

  searchPlate() {
    // Plaka arama işlemi burada yapılacak
    console.log('Aranan plaka:', this.plateNumber);
  }
}
