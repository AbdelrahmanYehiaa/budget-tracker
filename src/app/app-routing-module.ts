import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { NotFound } from './components/not-found/not-found';
import { Transactions } from './pages/transactions/transactions';
import { Budgets } from './pages/budgets/budgets';
import { Goals } from './pages/goals/goals';
import { Reports } from './pages/reports/reports';







const routes: Routes = [
  // Default Route
 { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'login', component: Login },
  { path: 'transactions', component: Transactions }, // Add this route!
  { path: 'budgets', component: Budgets },
  { path: 'goals', component: Goals },
  { path: 'reports', component: Reports },
  { path: '**', component: NotFound } // Wildcard route for 404 page 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }