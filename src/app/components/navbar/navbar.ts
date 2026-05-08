import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../services/theme';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
  standalone: false
})
export class Navbar {
  // Inject the AuthService so the HTML template can use it[cite: 3]
  constructor(public authService: AuthService, public themeService: ThemeService) {}
}