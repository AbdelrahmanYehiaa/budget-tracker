import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UserProfile } from '../models/finance.model';

@Injectable({
  providedIn: 'root' // Centralized Dependency Injection[cite: 1, 3]
})
export class AuthService {
  // BehaviorSubject holds the current user state and notifies subscribers when it changes[cite: 3]
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  user$: Observable<UserProfile | null> = this.userSubject.asObservable();

  constructor(private afAuth: AngularFireAuth, private router: Router) {
    // Listen to Firebase auth state changes automatically
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userSubject.next({ uid: user.uid, email: user.email || '' });
      } else {
        this.userSubject.next(null);
      }
    });
  }

  // Register a new user
  async register(email: string, password: string) {
    try {
      await this.afAuth.createUserWithEmailAndPassword(email, password);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      throw error;
    }
  }

  // Login an existing user
  async login(email: string, password: string) {
    try {
      await this.afAuth.signInWithEmailAndPassword(email, password);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      throw error;
    }
  }

  // Logout
  async logout() {
    await this.afAuth.signOut();
    this.router.navigate(['/login']);
  }
}