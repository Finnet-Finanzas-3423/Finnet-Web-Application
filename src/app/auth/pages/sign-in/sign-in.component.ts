import { Component, Inject, inject, input, signal, ViewChild, WritableSignal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Login } from '../../models/login.model';
import { Profile } from '../../models/profile.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  @ViewChild('password') passwordInput: any;

  private readonly router: Router = inject(Router);
  private authService = inject(AuthService);

  emailValue: string = '';
  passwordValue: string = '';
  showPassword: WritableSignal<boolean> = signal(false);

  onShowPassword(){
    this.showPassword.set(!this.showPassword());
    this.passwordInput.nativeElement.type = this.showPassword() ? 'text' : 'password';
  }

  onSubmit() {
    this.authService.signIn(this.emailValue, this.passwordValue).subscribe({
      next: (response: Login) => {
        console.log('Login successful:', response);
        localStorage.setItem('token', response.token);
        localStorage.setItem('email', response.email);
        this.authService.profile().subscribe({
          next: (profile:Profile) => {
            console.log('Profile retrieved:', profile);
            this.router.navigate(['/home']);
          },
          error: (error) => {
            console.error('Error retrieving profile:', error);
          }
        });
      },
      error: (error) => {   
        console.error('Login failed:', error);
        // Aquí puedes manejar el error, como mostrar un mensaje al usuario
      },
    });
  }
}
