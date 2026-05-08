import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FinanceService } from '../../services/finance';
import { Transaction, Budget } from '../../models/finance.model';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss'],
  standalone: false
})
export class Reports implements OnInit, OnDestroy {

  // Canvas references for the 3 charts
  @ViewChild('incomeExpenseChart') incomeExpenseChartRef!: ElementRef;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef;
  @ViewChild('savingsChart') savingsChartRef!: ElementRef;

  private incomeExpenseChart!: Chart;
  private categoryChart!: Chart;
  private savingsChart!: Chart;

  private txSub!: Subscription;
  private budgetSub!: Subscription;

  // Summary stats
  totalIncome: number = 0;
  totalExpenses: number = 0;
  netSavings: number = 0;
  savingsRate: number = 0;

  // Budget variance data for the table
  budgetVariances: { category: string; limit: number; spent: number; variance: number; status: string }[] = [];

  // For the monthly bar chart
  monthlyLabels: string[] = [];
  monthlyIncome: number[] = [];
  monthlyExpenses: number[] = [];

  // For the category pie chart
  categoryLabels: string[] = [];
  categoryAmounts: number[] = [];

  // Expense filter
  selectedMonth: string = 'all';
  availableMonths: { value: string; label: string }[] = [];

  transactions: Transaction[] = [];
  budgets: Budget[] = [];

  constructor(private financeService: FinanceService) {}

  ngOnInit() {
    this.txSub = this.financeService.transactions$.subscribe(transactions => {
      this.transactions = transactions;
      this.processTransactions(transactions);
      this.renderCharts();
    });

    this.budgetSub = this.financeService.budgets$.subscribe(budgets => {
      this.budgets = budgets;
      this.buildBudgetVariances(budgets);
    });
  }

  processTransactions(transactions: Transaction[]) {
    // Overall totals
    this.totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    this.totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    this.netSavings = this.totalIncome - this.totalExpenses;
    this.savingsRate = this.totalIncome > 0
      ? Math.round((this.netSavings / this.totalIncome) * 100)
      : 0;

    // Build available months for filter
    const monthSet = new Set<string>();
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthSet.add(key);
    });
    this.availableMonths = Array.from(monthSet).sort().reverse().map(key => {
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { value: key, label };
    });

    // Monthly grouped data (last 6 months) for bar chart
    const last6 = this.getLast6Months();
    this.monthlyLabels = last6.map(m => m.label);
    this.monthlyIncome = last6.map(m => {
      return transactions
        .filter(t => t.type === 'income' && this.getMonthKey(t.date) === m.key)
        .reduce((sum, t) => sum + Number(t.amount), 0);
    });
    this.monthlyExpenses = last6.map(m => {
      return transactions
        .filter(t => t.type === 'expense' && this.getMonthKey(t.date) === m.key)
        .reduce((sum, t) => sum + Number(t.amount), 0);
    });

    // Category breakdown for pie chart
    const filtered = this.selectedMonth === 'all'
      ? transactions.filter(t => t.type === 'expense')
      : transactions.filter(t => t.type === 'expense' && this.getMonthKey(t.date) === this.selectedMonth);

    const categoryMap: Record<string, number> = {};
    filtered.forEach(t => {
      const cat = t.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount);
    });

    this.categoryLabels = Object.keys(categoryMap);
    this.categoryAmounts = Object.values(categoryMap);
  }

  buildBudgetVariances(budgets: Budget[]) {
    this.budgetVariances = budgets.map(b => ({
      category: b.category,
      limit: b.limit,
      spent: b.spent,
      variance: b.limit - b.spent,
      status: b.spent > b.limit ? 'Over Budget' : b.spent > b.limit * 0.8 ? 'Near Limit' : 'On Track'
    }));
  }

  onMonthChange() {
    this.processTransactions(this.transactions);
    // Re-render only the category chart
    setTimeout(() => this.renderCategoryChart(), 0);
  }

  getLast6Months(): { key: string; label: string }[] {
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return result;
  }

  getMonthKey(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  renderCharts() {
    setTimeout(() => {
      this.renderIncomeExpenseChart();
      this.renderCategoryChart();
    }, 0);
  }

  renderIncomeExpenseChart() {
    if (this.incomeExpenseChart) this.incomeExpenseChart.destroy();
    if (!this.incomeExpenseChartRef?.nativeElement) return;

    this.incomeExpenseChart = new Chart(this.incomeExpenseChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.monthlyLabels,
        datasets: [
          {
            label: 'Income',
            data: this.monthlyIncome,
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderColor: '#4caf50',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Expenses',
            data: this.monthlyExpenses,
            backgroundColor: 'rgba(244, 67, 54, 0.7)',
            borderColor: '#f44336',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: ctx => ` $${Number(ctx.parsed['y'] ?? 0).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => `$${value}`
            }
          }
        }
      }
    });
  }

  renderCategoryChart() {
    if (this.categoryChart) this.categoryChart.destroy();
    if (!this.categoryChartRef?.nativeElement) return;
    if (this.categoryLabels.length === 0) return;

    const colors = [
      '#2196f3', '#f44336', '#4caf50', '#ff9800', '#9c27b0',
      '#00bcd4', '#e91e63', '#8bc34a', '#ff5722', '#607d8b'
    ];

    this.categoryChart = new Chart(this.categoryChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.categoryLabels,
        datasets: [{
          data: this.categoryAmounts,
          backgroundColor: colors.slice(0, this.categoryLabels.length),
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: $${(ctx.parsed as number).toFixed(2)}`
            }
          }
        }
      }
    });
  }

  getVarianceClass(status: string): string {
    if (status === 'Over Budget') return 'status-over';
    if (status === 'Near Limit') return 'status-near';
    return 'status-ok';
  }

  ngOnDestroy() {
    if (this.txSub) this.txSub.unsubscribe();
    if (this.budgetSub) this.budgetSub.unsubscribe();
    if (this.incomeExpenseChart) this.incomeExpenseChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.savingsChart) this.savingsChart.destroy();
  }
}
