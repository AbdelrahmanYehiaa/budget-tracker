import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // BehaviorSubject so our navbar icon can react instantly
  public isDarkMode = new BehaviorSubject<boolean>(false);

  constructor() {
    // Check local storage for a saved preference when the app loads
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.setDarkMode(true);
    }
  }

  toggleTheme() {
    this.setDarkMode(!this.isDarkMode.value);
  }

  private setDarkMode(isDark: boolean) {
    this.isDarkMode.next(isDark);
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }
}