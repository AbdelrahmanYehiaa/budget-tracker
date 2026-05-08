import { Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Goal, Transaction } from '../models/finance.model';
import { Budget } from '../models/finance.model';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {

  private goalsSubject = new BehaviorSubject<Goal[]>([]);
goals$: Observable<Goal[]> = this.goalsSubject.asObservable();
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);

  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
budgets$: Observable<Budget[]> = this.budgetsSubject.asObservable();

  transactions$: Observable<Transaction[]> = this.transactionsSubject.asObservable();
  private userId: string | null = null;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private injector: EnvironmentInjector // <-- 1. We inject the safe context here
  ) {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.loadTransactions();
      } else {
        this.userId = null;
        this.transactionsSubject.next([]); 
      }
    });
  }

 loadTransactions() {
    if (!this.userId) return;
    
    // Wrap ALL THREE database calls inside the single safe context!
    runInInjectionContext(this.injector, () => {
      
      // 1. Load Transactions
      this.firestore.collection<Transaction>('transactions', ref => 
        ref.where('uid', '==', this.userId)
      )
      .valueChanges({ idField: 'id' })
      .subscribe({
        next: (data) => this.transactionsSubject.next(data),
        error: (err) => console.error("Error loading transactions:", err)
      });

      // 2. Load Budgets
      this.firestore.collection<Budget>('budgets', ref => 
        ref.where('uid', '==', this.userId)
      )
      .valueChanges({ idField: 'id' })
      .subscribe({
        next: (data) => this.budgetsSubject.next(data),
        error: (err) => console.error("Error loading budgets:", err)
      });

      // 3. Load Goals (This must be inside the block!)
      this.firestore.collection<Goal>('goals', ref => 
        ref.where('uid', '==', this.userId)
      )
      .valueChanges({ idField: 'id' })
      .subscribe({
        next: (data) => this.goalsSubject.next(data),
        error: (err) => console.error("Error loading goals:", err)
      });

    });
  }

 async addTransaction(transaction: Transaction) {
    if (!this.userId) throw new Error('User not logged in');
    const newTx = { ...transaction, uid: this.userId };
    
    return runInInjectionContext(this.injector, async () => {
      // --- THE FIX: Grab both database references SYNCHRONOUSLY before any 'await' ---
      const transactionsRef = this.firestore.collection('transactions');
      const budgetsRef = this.firestore.collection('budgets');

      // 1. Save the transaction using the saved reference
      const result = await transactionsRef.add(newTx);

      console.log("1. New Expense Added. Category:", newTx.category, "Type:", newTx.type);

      // 2. Find the matching budget using the saved reference
      if (newTx.type === 'expense' && newTx.category) {
        const snapshot = await budgetsRef.ref
          .where('uid', '==', this.userId)
          .where('category', '==', newTx.category)
          .get();

        console.log("2. Did we find a matching budget?", !snapshot.empty);

        // If we found a budget with that category, update it!
        if (!snapshot.empty) {
          const budgetDoc = snapshot.docs[0];
          const data: any = budgetDoc.data();
          
          const currentSpent = Number(data.spent) || 0;
          const amountToAdd = Number(newTx.amount);
          const newTotal = currentSpent + amountToAdd;

          console.log(`3. Updating budget! Old Spent: ${currentSpent} + New Expense: ${amountToAdd} = ${newTotal}`);
          
          await budgetDoc.ref.update({ spent: newTotal });
        } else if (newTx.category !== 'Savings') {
          // Only warn if the missing budget ISN'T "Savings"
          console.warn("WARNING: Could not find a budget with the exact name:", newTx.category);
        }
      }

      return result;
    });
  }

  // --- Edit Transaction & Adjust Budgets ---
 

  async deleteTransaction(id: string) {
    // 4. We wrap the Delete call in the safe context!
    return runInInjectionContext(this.injector, () => {
      return this.firestore.collection('transactions').doc(id).delete();
    });
  }


 // --- Edit Transaction & Adjust Budgets ---
  async updateTransaction(id: string, newTx: Transaction, oldTx: Transaction) {
    if (!this.userId) throw new Error('User not logged in');
    
    return runInInjectionContext(this.injector, async () => {
      const transactionsRef = this.firestore.collection('transactions');
      const budgetsRef = this.firestore.collection('budgets');

      // 1. Update the transaction itself in the database
      await transactionsRef.doc(id).update(newTx);

      // 2. REVERSE the old transaction from the OLD budget category
      if (oldTx.type === 'expense' && oldTx.category) {
        const oldSnap = await budgetsRef.ref
          .where('uid', '==', this.userId)
          .where('category', '==', oldTx.category)
          .get();

        if (!oldSnap.empty) {
          const oldBudgetDoc = oldSnap.docs[0];
          const oldData: any = oldBudgetDoc.data();
          const currentSpent = Number(oldData.spent) || 0;
          // Subtract the old amount
          await oldBudgetDoc.ref.update({ spent: currentSpent - Number(oldTx.amount) });
        }
      }

      // 3. APPLY the new transaction to the NEW budget category
      if (newTx.type === 'expense' && newTx.category) {
        const newSnap = await budgetsRef.ref
          .where('uid', '==', this.userId)
          .where('category', '==', newTx.category)
          .get();

        if (!newSnap.empty) {
          const newBudgetDoc = newSnap.docs[0];
          const newData: any = newBudgetDoc.data();
          const currentSpent = Number(newData.spent) || 0;
          // Add the new amount
          await newBudgetDoc.ref.update({ spent: currentSpent + Number(newTx.amount) });
        }
      }
    });
  }


  async addBudget(budget: Budget) {
  if (!this.userId) throw new Error('User not logged in');
  const newBudget = { ...budget, uid: this.userId, spent: 0 }; // Default spent to 0
  return runInInjectionContext(this.injector, () => {
    return this.firestore.collection('budgets').add(newBudget);
  });
}

async updateBudget(id: string, budget: Partial<Budget>) {
  return runInInjectionContext(this.injector, () => {
    return this.firestore.collection('budgets').doc(id).update(budget);
  });
}

async deleteBudget(id: string) {
  return runInInjectionContext(this.injector, () => {
    return this.firestore.collection('budgets').doc(id).delete();
  });
}



async addGoal(goal: Goal) {
     if (!this.userId) throw new Error('User not logged in');
     const newGoal = { ...goal, uid: this.userId, currentAmount: 0 }; 
     return runInInjectionContext(this.injector, () => {
       return this.firestore.collection('goals').add(newGoal);
     });
   }

   async updateGoal(id: string, currentAmount: number) {
     return runInInjectionContext(this.injector, () => {
       return this.firestore.collection('goals').doc(id).update({ currentAmount });
     });
   }

   async deleteGoal(id: string) {
     return runInInjectionContext(this.injector, () => {
       return this.firestore.collection('goals').doc(id).delete();
     });
   }



}