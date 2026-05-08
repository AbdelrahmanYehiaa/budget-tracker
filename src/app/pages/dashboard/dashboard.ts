import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FinanceService } from '../../services/finance';
import { AuthService } from '../../services/auth';
import { Transaction, Budget, Goal } from '../../models/finance.model';
import { Observable, Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  standalone: false
})
export class Dashboard implements OnInit, OnDestroy {
  @ViewChild('financeChart') chartRef!: ElementRef;
  chart!: Chart;
  private sub!: Subscription;

  transactions$: Observable<Transaction[]>;
  budgets$: Observable<Budget[]>;
  goals$: Observable<Goal[]>;

  totalIncome: number = 0;
  totalExpenses: number = 0;
  currentBalance: number = 0;
  recentTransactions: Transaction[] = [];
  userName: string = 'User';

  constructor(
    private financeService: FinanceService,
    private authService: AuthService
  ) {
    this.transactions$ = this.financeService.transactions$;
    this.budgets$ = this.financeService.budgets$;
    this.goals$ = this.financeService.goals$;
  }

  ngOnInit() {
    // 1. Get user email for the welcome message
    this.authService.user$.subscribe(user => {
      this.userName = user?.email?.split('@')[0] || 'User';
    });

    // 2. Subscribe to transactions for stats and the chart
    this.sub = this.transactions$.subscribe(transactions => {
      this.totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      this.totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
      this.currentBalance = this.totalIncome - this.totalExpenses;

      // Grab the 5 most recent transactions
      this.recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      // Draw the chart!
      this.updateChart();
    });
  }

  updateChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    setTimeout(() => {
      if (this.chartRef && this.chartRef.nativeElement) {
        
        // Optional: If there is no data, don't draw an empty circle
        if (this.totalIncome === 0 && this.totalExpenses === 0) return;

        this.chart = new Chart(this.chartRef.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
              data: [this.totalIncome, this.totalExpenses],
              backgroundColor: ['#4caf50', '#f44336'], 
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    }, 0);
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.chart) this.chart.destroy();
  }

  getPercentage(spent: number, limit: number): number {
    if (!limit || limit === 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  }
}