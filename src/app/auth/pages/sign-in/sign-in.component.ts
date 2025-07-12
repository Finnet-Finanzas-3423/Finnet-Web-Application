import { Component, Inject, inject, input, signal, ViewChild, WritableSignal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Login } from '../../models/login.model';
import { Profile } from '../../models/profile.model';
import { Router, RouterLink } from '@angular/router';
import { BonoService } from '../../../shared/services/bono.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  @ViewChild('password') passwordInput: any;

  private readonly router: Router = inject(Router);
  private authService = inject(AuthService);
  private bonoService = inject(BonoService);

  emailValue: string = '';
  passwordValue: string = '';
  showPassword: WritableSignal<boolean> = signal(false);
  isLoading: boolean = false;

  onShowPassword(){
    this.showPassword.set(!this.showPassword());
    this.passwordInput.nativeElement.type = this.showPassword() ? 'text' : 'password';
  }

  onSubmit() {
    if (!this.emailValue || !this.passwordValue) {
      return;
    }

    this.isLoading = true;

    this.authService.signIn(this.emailValue, this.passwordValue).subscribe({
      next: (response: Login) => {
        console.log('Login successful:', response);
        localStorage.setItem('token', response.token);
        localStorage.setItem('email', response.email);

        this.authService.profile().subscribe({
          next: (profile: Profile) => {
            console.log('Profile retrieved:', profile);
            localStorage.setItem('id', profile.id.toString());

            this.bonoService.getBonosByUser(profile.id).subscribe({
              next: (bonos) => {
                this.isLoading = false;

                if (bonos && bonos.length > 0) {
                  this.router.navigate(['/dashboard']);
                } else {
                  this.router.navigate(['/home']);
                }
              },
              error: (error) => {
                console.error('Error al verificar bonos:', error);
                this.isLoading = false;
                this.router.navigate(['/home']);
              }
            });
          },
          error: (error) => {
            console.error('Error retrieving profile:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.isLoading = false;
      },
    });
  }
}
