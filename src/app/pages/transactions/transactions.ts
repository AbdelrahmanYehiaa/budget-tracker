import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { FinanceService } from '../../services/finance';
import { Transaction, Budget } from '../../models/finance.model';
import { Observable } from 'rxjs';



@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.scss'],
  standalone: false
})
export class Transactions implements OnInit {
  transactionForm: FormGroup;
  displayedColumns: string[] = ['title', 'amount', 'type', 'date', 'actions'];
  dataSource = new MatTableDataSource<Transaction>();
  
  // Track if we are currently editing an item
  editingId: string | null = null;


  budgets$: Observable<Budget[]>;
editingTransaction: Transaction | null = null;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService
  ) {
    this.budgets$ = this.financeService.budgets$;
    this.transactionForm = this.fb.group({
      title: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['expense', Validators.required],
      category: [''],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit() {
    this.financeService.transactions$.subscribe(data => {
      this.dataSource.data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Populate the form with the selected transaction's data
 editTransaction(tx: Transaction) {
  // Save the old transaction so we can do the budget math later
  this.editingTransaction = tx;

  // Fill the form with the transaction's current details
  this.transactionForm.patchValue({
    title: tx.title,
    amount: tx.amount,
    type: tx.type,
    category: tx.category || '',
    date: tx.date
  });

  // Scroll to the top so the user sees the form
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelEdit() {
  this.editingTransaction = null;
  this.transactionForm.reset({
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });
}

  async onSubmit() {
  if (this.transactionForm.invalid) return;

  try {
    if (this.editingTransaction) {
      // WE ARE EDITING! 
      // Pass the ID, the new form values, AND the old saved transaction
      await this.financeService.updateTransaction(
        this.editingTransaction.id!, 
        this.transactionForm.value, 
        this.editingTransaction
      );
      this.editingTransaction = null; // Reset back to add mode
    } else {
      // WE ARE ADDING!
      await this.financeService.addTransaction(this.transactionForm.value);
    }

    // Reset the form back to default
    this.transactionForm.reset({
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error("Error saving transaction", error);
  }
}

  deleteTransaction(id: string) {
    if(confirm('Are you sure you want to delete this?')) {
      this.financeService.deleteTransaction(id);
      // If we delete the item we are currently editing, cancel the edit
      if (this.editingId === id) {
        this.cancelEdit();
      }
    }
  }


  

  
}