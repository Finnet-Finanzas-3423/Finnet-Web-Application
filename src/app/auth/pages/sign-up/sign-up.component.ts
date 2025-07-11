import { Component, ViewChild, signal, WritableSignal, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Login } from '../../models/login.model';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
  imports: [CommonModule, FormsModule, RouterLink]
})
export class SignUpComponent {
  @ViewChild('password') passwordInput: any;
  @ViewChild('confirmPassword') confirmPasswordInput: any;
  private readonly router: Router = inject(Router);
  private authService = inject(AuthService);

  emailValue: string = '';
  passwordValue: string = '';
  confirmPasswordValue: string = '';
  rucValue: string = '';
  razonSocialValue: string = '';
  direccionValue: string = '';
  sectorEmpresarialValue: string = 'Minería';
  errorMessage: string = '';

  sectorOptions: string[] = ['Minería', 'Agricultura', 'Tecnología', 'Finanzas', 'Construcción', 'Comercio', 'Otros'];

  showPassword: WritableSignal<boolean> = signal(false);
  showConfirmPassword: WritableSignal<boolean> = signal(false);

  onShowPassword(id: number) {
    if(id === 1) {
      this.showPassword.set(!this.showPassword());
      this.passwordInput.nativeElement.type = this.showPassword() ? 'text' : 'password';
      return;
    }
    this.showConfirmPassword.set(!this.showConfirmPassword());
    this.confirmPasswordInput.nativeElement.type = this.showConfirmPassword() ? 'text' : 'password';
  }

  onSubmit() {
    if (this.passwordValue !== this.confirmPasswordValue) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    // Only send the required fields to the API
    this.authService.signUp(
      this.emailValue,
      this.passwordValue,
      this.rucValue,
      this.razonSocialValue,
      this.direccionValue,
      this.sectorEmpresarialValue
    ).subscribe({
      next: (response: Login) => {
        console.log('Register successful:', response);
        this.router.navigate(['/auth/sign-in']);
      },
      error: (error) => {
        console.error('Login failed:', error);
        if (error.error && Array.isArray(error.error.message)) {
          this.errorMessage = error.error.message.join(', ');
        } else {
          this.errorMessage = error.error?.message || 'Error al registrar. Intenta nuevamente.';
        }
      },
    });
  }
}
