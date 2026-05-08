import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Firebase Imports
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';
import { Navbar } from './components/navbar/navbar';
import { NotFound } from './components/not-found/not-found';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { Transactions } from './pages/transactions/transactions';


import { Budgets } from './pages/budgets/budgets';
import { Goals } from './pages/goals/goals';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Reports } from './pages/reports/reports';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    App,
    Navbar,
    NotFound,
    Dashboard,
    Login,
    Transactions,
    Budgets,
    Goals, 
    Reports,
  ],

  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    // Initialize Firebase
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    // Angular Material Modules
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    // Reactive Forms
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatTableModule,
    MatSelectModule,

    MatProgressBarModule,
    FormsModule,
    CommonModule,
  ],
  providers: [],
  bootstrap: [App],
})
export class AppModule {}
