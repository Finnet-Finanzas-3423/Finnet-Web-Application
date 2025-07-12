import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Profile } from '../../../auth/models/profile.model';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  imports: [
    RouterLink,
    CommonModule
  ],
  styleUrls: ['./toolbar.component.css'],
  standalone: true
})
export class ToolbarComponent implements OnInit {
  isScrolled = false;
  userInitials = '';
  notificationCount = 2;
  userProfile: Profile | null = null;
  isLoading = true;
  isMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.profile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.userInitials = this.getUserInitials(profile.razonSocial);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 30;
    const toolbar = document.querySelector('.toolbar-container');
    if (this.isScrolled) {
      toolbar?.classList.add('scrolled');
    } else {
      toolbar?.classList.remove('scrolled');
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const userProfileElement = document.querySelector('.user-profile');
    if (userProfileElement && !userProfileElement.contains(event.target as Node) && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/sign-in']);
  }

  private getUserInitials(text: string): string {
    const parts = text.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  }
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
    this.isMenuOpen = false;
  }
}
