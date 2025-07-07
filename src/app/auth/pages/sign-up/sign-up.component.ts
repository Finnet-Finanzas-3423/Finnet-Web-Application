import { Component, Inject, inject, input, signal, ViewChild, WritableSignal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Login } from '../../models/login.model';
import { Profile } from '../../models/profile.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  @ViewChild('password') passwordInput: any;
  @ViewChild('confirmPassword') confirmPasswordInput: any;
  private readonly router: Router = inject(Router);
  private authService = inject(AuthService);

  nameValue: string = '';
  fullNameValue: string = '';
  emailValue: string = '';
  passwordValue: string = '';
  confirmPasswordValue: string = '';
  errorMessage: string = '';

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
    this.authService.signUp(this.emailValue, this.passwordValue, this.nameValue, this.fullNameValue).subscribe({
      next: (response: Login) => {
        console.log('Register successful:', response);
        this.router.navigate(['/auth/sign-in']);
      },
      error: (error) => {   
        console.error('Login failed:', error);
      },
    });
  }
}
