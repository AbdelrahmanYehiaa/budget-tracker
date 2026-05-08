export interface UserProfile {
  uid: string;
  email: string;
}

export interface Transaction {
  id?: string;     
  uid?: string;    
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category?: string;    
}


export interface Budget {
  id?: string;
  uid: string;
  category: string;
  limit: number;
  spent: number;
}
export interface Goal {
  id?: string;
  uid?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}