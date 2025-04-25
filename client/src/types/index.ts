// Re-export the types from schema
export type {
  Client,
  InsertClient,
  Dog,
  InsertDog,
  Appointment,
  InsertAppointment,
  Expenditure,
  InsertExpenditure,
  ClientWithDogs,
  AppointmentWithClientAndDogs
} from "@shared/schema";

// Additional frontend-specific types
export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type AppointmentFilter = {
  view: 'all' | 'upcoming' | 'past' | 'overdue';
  dateRange: DateRange;
  clientId?: number;
};

export type FinancialSummary = {
  income: number;
  expenses: number;
  net: number;
};

export type ServiceAnalysis = {
  serviceType: string;
  appointments: number;
  averagePrice: number;
  total: number;
};

export type ExpenseCategory = {
  category: string;
  amount: number;
  percentage: number;
};

export type DailyFinancials = {
  date: string;
  income: number;
  expenses: number;
  net: number;
};

export type DogFormInput = {
  id?: number;
  name: string;
  breed?: string;
  size: string;
  hairLength: string;
};
