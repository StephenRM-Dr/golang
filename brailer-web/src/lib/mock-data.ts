import { Wallet, CreditCard, Landmark, ArrowUpCircle, ArrowDownCircle, MessageSquare } from "lucide-react";

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  bank: string;
  reference: string;
  type: 'income' | 'expense';
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 1, date: '2026-04-15', description: 'Abono cliente X', amount: 2500.00, bank: 'Banesco', reference: '984215', type: 'income' },
  { id: 2, date: '2026-04-14', description: 'Pago proveedor servicios', amount: -650.00, bank: 'Mercantil', reference: '112548', type: 'expense' },
  { id: 3, date: '2026-04-14', description: 'Transferencia recibida', amount: 1200.50, bank: 'BBVA', reference: '445871', type: 'income' },
  { id: 4, date: '2026-04-13', description: 'Gasto operativo oficina', amount: -150.25, bank: 'Banesco', reference: '221458', type: 'expense' },
  { id: 5, date: '2026-04-12', description: 'Venta de equipo usado', amount: 500.00, bank: 'Sofitasa', reference: '665897', type: 'income' },
];

export const CITIES = [
  "Barinas", "Caracas", "Concordia", "Maracaibo", "Mundovinyl", 
  "Todos", "San Cristobal", "Sublivinil", "Textivinyl", "Valencia"
];

export const BANKS = [
  "1 bancolombia", "2 banesco mundovinyl", "3 banesco textivinyl", 
  "4 venezuela mundovinyl", "5 venezuela textivinyl", "6 banesco edithmar", 
  "7 banesco ruben", "8 banesco jose luis", "9 venezuela jose luis", 
  "10 venezuela papa bausta", "11 venezuela edithmar", "12 venezuela dimas", 
  "13 bicentenario carolina", "14 sofitasa mundovinyl", "15 sofitasa textivinyl", 
  "16 venezuela ruben", "17 banesco esteban", "18 venezuela brailer", 
  "19 pascualino", "20 caja dolares", "21 caja bolivares", "22 cliente", 
  "23 Sin banco", "24 mercantil mundovinyl", "25 Plaza Mundovinyl", "26 Plaza Textivinyl"
];

export const MOCK_BALANCES = {
  total: 3400.25,
  monthlyIncome: 4200.50,
  monthlyExpenses: 800.25,
};
