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
}
