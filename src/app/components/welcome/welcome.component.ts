import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBonoComponent } from '../form-bono/form-bono.component';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  standalone: true,
  imports: [CommonModule, FormBonoComponent],
  animations: [
    trigger('pageAnimation', [
      // Animación de entrada suave
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(20px)'
        }),
        animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({
          opacity: 1,
          transform: 'translateY(0)'
        }))
      ]),
      // Animación de salida más suave
      transition(':leave', [
        style({
          opacity: 1,
          transform: 'translateY(0)'
        }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({
          opacity: 0,
          transform: 'translateY(10px)'
        }))
      ])
    ])
  ]
})
export class WelcomeComponent {
  showForm = false;

  constructor(private router: Router) { }

  navigateToCalculator(): void {
    // Cambia la vista al formulario
    this.showForm = true;

    // Scroll hacia arriba cuando cambia a formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToWelcome(): void {
    // Cambia la vista a bienvenida
    this.showForm = false;

    // Scroll hacia arriba al volver a la vista principal
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Opcional: si necesitas alguna lógica adicional para limpiar estado
    // this.resetearDatos();
  }
}
