import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from '../../services/finance';
import { Goal, Transaction } from '../../models/finance.model'; 
import { Observable } from 'rxjs';

@Component({
  selector: 'app-goals',
  templateUrl: './goals.html',
  styleUrls: ['./goals.scss'],
  standalone: false
})
export class Goals implements OnInit {
  goalForm: FormGroup;
  goals$: Observable<Goal[]>;
  availableBalance: number = 0; // <-- variable to track your cash!

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService
  ) {
    this.goalForm = this.fb.group({
      title: ['', Validators.required],
      targetAmount: [null, [Validators.required, Validators.min(1)]],
      deadline: ['', Validators.required]
    });
    
    this.goals$ = this.financeService.goals$;

    // NEW: Automatically calculate how much money you actually have available
    this.financeService.transactions$.subscribe(transactions => {
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
      this.availableBalance = income - expenses;
    });
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.goalForm.invalid) return;
    try {
      await this.financeService.addGoal(this.goalForm.value);
      this.goalForm.reset();
    } catch (error) {
      console.error("Error saving goal", error);
    }
  }

  // UPDATED: The deposit function is now much smarter
  async addFunds(goal: Goal, amountString: string) {
    const amount = Number(amountString);
    if (!amount || amount <= 0) return;
    
    // 1. Stop the user if they don't have enough money!
    if (amount > this.availableBalance) {
      alert(`Insufficient funds! You only have $${this.availableBalance} available to deposit.`);
      return;
    }

    try {
      // 2. Add the money to the Goal
      const newTotal = (goal.currentAmount || 0) + amount;
      await this.financeService.updateGoal(goal.id!, newTotal);

      // 3. Automatically log this as an "Expense" so it subtracts from your main balance!
      await this.financeService.addTransaction({
        title: `Transfer to Goal: ${goal.title}`,
        amount: amount,
        type: 'expense',
        category: 'Savings',
        date: new Date().toISOString().split('T')[0]
      });

    } catch(error) {
      console.error("Error processing deposit:", error);
    }
  }

  deleteGoal(id: string) {
    if(confirm('Are you sure you want to delete this goal?')) {
      this.financeService.deleteGoal(id);
    }
  }

  getPercentage(current: number, target: number): number {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }
}