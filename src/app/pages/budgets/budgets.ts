import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from '../../services/finance';
import { Budget } from '../../models/finance.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.html',
  styleUrls: ['./budgets.scss'],
  standalone: false
})
export class Budgets implements OnInit {
  budgetForm: FormGroup;
  budgets$: Observable<Budget[]>;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService
  ) {
    this.budgetForm = this.fb.group({
      category: ['', Validators.required],
      limit: [null, [Validators.required, Validators.min(1)]]
    });
    
    // Connect to our database observable
    this.budgets$ = this.financeService.budgets$;
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.budgetForm.invalid) return;

    try {
      await this.financeService.addBudget(this.budgetForm.value);
      this.budgetForm.reset();
    } catch (error) {
      console.error("Error saving budget", error);
    }
  }

  deleteBudget(id: string) {
    if(confirm('Are you sure you want to delete this budget?')) {
      this.financeService.deleteBudget(id);
    }
  }
}