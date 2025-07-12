import { Component, OnInit } from '@angular/core';
import { WelcomeComponent } from '../../../components/welcome/welcome.component';
import { DashboardComponent } from '../../../components/dashboard/dashboard.component';
import { CommonModule } from '@angular/common';
import { BonoService } from '../../services/bono.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [WelcomeComponent, DashboardComponent, CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit {
  isLoading: boolean = true;
  hasBonos: boolean = false;

  constructor(private bonoService: BonoService) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('id') ? Number(localStorage.getItem('id')) : null;

    if (!userId) {
      this.isLoading = false;
      return;
    }

    this.bonoService.getBonosByUser(userId).subscribe({
      next: (bonos) => {
        this.hasBonos = bonos && bonos.length > 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al verificar bonos:', error);
        this.isLoading = false;
        this.hasBonos = false;
      }
    });
  }
}
