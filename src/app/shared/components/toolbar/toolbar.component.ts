import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import {Profile} from '../../../auth/models/profile.model';
import {AuthService} from '../../../auth/services/auth.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  styleUrls: ['./toolbar.component.css'],
  standalone: true
})
export class ToolbarComponent implements OnInit {
  isScrolled = false;
  username = '';
  userInitials = '';
  notificationCount = 2;
  userProfile: Profile | null = null;
  isLoading = true;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.profile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.username = profile.name;
        this.getUserInitials();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
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

  private getUserInitials(): void {
    if (this.userProfile) {
      const name = this.userProfile.name;
      const nameParts = name.split(' ');

      if (nameParts.length > 1) {
        this.userInitials = nameParts[0][0] + nameParts[1][0];
      } else {
        this.userInitials = name.substring(0, 2).toUpperCase();
      }
    }
  }
}
