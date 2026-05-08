import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: false
})
export class Login implements OnInit {
  authForm: FormGroup;
  isLoginMode = true; // Toggle between Login and Register
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder, // Helper to build forms
    private authService: AuthService
  ) {
    // Initialize form with strict validation[cite: 1, 5]
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = null;
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    const { email, password } = this.authForm.value;
    this.errorMessage = null;

    try {
      if (this.isLoginMode) {
        await this.authService.login(email, password);
      } else {
        await this.authService.register(email, password);
      }
    } catch (err: any) {
      this.errorMessage = err.message;
    }
  }
}