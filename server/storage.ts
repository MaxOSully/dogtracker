import { 
  clients, Client, InsertClient,
  dogs, Dog, InsertDog,
  appointments, Appointment, InsertAppointment,
  expenditures, Expenditure, InsertExpenditure,
  ClientWithDogs, AppointmentWithClientAndDogs
} from "@shared/schema";

export interface IStorage {
  // Client operations
  getClients(): Promise<ClientWithDogs[]>;
  getClient(id: number): Promise<ClientWithDogs | undefined>;
  searchClients(term: string): Promise<ClientWithDogs[]>;
  createClient(client: InsertClient, dogsInfo: InsertDog[]): Promise<ClientWithDogs>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<ClientWithDogs | undefined>;
  
  // Dog operations
  getDogsByClientId(clientId: number): Promise<Dog[]>;
  createDog(dog: InsertDog): Promise<Dog>;
  updateDog(id: number, dog: Partial<InsertDog>): Promise<Dog | undefined>;
  deleteDog(id: number): Promise<boolean>;
  
  // Appointment operations
  getAppointments(): Promise<AppointmentWithClientAndDogs[]>;
  getAppointment(id: number): Promise<AppointmentWithClientAndDogs | undefined>;
  getAppointmentsByClientId(clientId: number): Promise<AppointmentWithClientAndDogs[]>;
  getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<AppointmentWithClientAndDogs[]>;
  createAppointment(appointment: InsertAppointment): Promise<AppointmentWithClientAndDogs>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<AppointmentWithClientAndDogs | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Financials operations
  getExpenditures(): Promise<Expenditure[]>;
  getExpendituresByDateRange(startDate: Date, endDate: Date): Promise<Expenditure[]>;
  createExpenditure(expenditure: InsertExpenditure): Promise<Expenditure>;
  updateExpenditure(id: number, expenditure: Partial<InsertExpenditure>): Promise<Expenditure | undefined>;
  deleteExpenditure(id: number): Promise<boolean>;
  
  // Summary operations
  getOverdueClients(): Promise<ClientWithDogs[]>;
  getSuggestedFollowUps(): Promise<ClientWithDogs[]>;
  getFinancialSummary(startDate: Date, endDate: Date): Promise<{
    income: number;
    expenses: number;
    net: number;
  }>;
}

export class MemStorage implements IStorage {
  private clientsData: Map<number, Client>;
  private dogsData: Map<number, Dog>;
  private appointmentsData: Map<number, Appointment>;
  private expendituresData: Map<number, Expenditure>;
  private clientIdCounter: number;
  private dogIdCounter: number;
  private appointmentIdCounter: number;
  private expenditureIdCounter: number;

  constructor() {
    this.clientsData = new Map();
    this.dogsData = new Map();
    this.appointmentsData = new Map();
    this.expendituresData = new Map();
    this.clientIdCounter = 1;
    this.dogIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.expenditureIdCounter = 1;
  }

  // Helper methods
  private getNextClientId(): number {
    return this.clientIdCounter++;
  }

  private getNextDogId(): number {
    return this.dogIdCounter++;
  }

  private getNextAppointmentId(): number {
    return this.appointmentIdCounter++;
  }

  private getNextExpenditureId(): number {
    return this.expenditureIdCounter++;
  }

  private async enrichClientWithDogsAndAppointments(client: Client): Promise<ClientWithDogs> {
    const dogs = await this.getDogsByClientId(client.id);
    const clientAppointments = Array.from(this.appointmentsData.values())
      .filter(appointment => appointment.clientId === client.id);
    
    // Sort appointments by date
    const sortedAppointments = [...clientAppointments].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Get past and future appointments based on current date
    const now = new Date();
    const pastAppointments = sortedAppointments.filter(appointment => {
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      return appointmentDate < now;
    });
    
    const futureAppointments = sortedAppointments.filter(appointment => {
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      return appointmentDate >= now;
    });
    
    const lastAppointment = pastAppointments.length > 0 
      ? pastAppointments[pastAppointments.length - 1] 
      : undefined;
      
    const nextAppointment = futureAppointments.length > 0 
      ? futureAppointments[0] 
      : undefined;

    return {
      ...client,
      dogs,
      lastAppointment,
      nextAppointment
    };
  }

  private async enrichAppointmentWithClientAndDogs(appointment: Appointment): Promise<AppointmentWithClientAndDogs> {
    const client = await this.getClient(appointment.clientId);
    
    if (!client) {
      throw new Error(`Client with id ${appointment.clientId} not found`);
    }
    
    return {
      ...appointment,
      client,
      dogs: client.dogs
    };
  }

  // Client operations
  async getClients(): Promise<ClientWithDogs[]> {
    const clients = Array.from(this.clientsData.values());
    const enrichedClients = await Promise.all(
      clients.map(client => this.enrichClientWithDogsAndAppointments(client))
    );
    return enrichedClients;
  }

  async getClient(id: number): Promise<ClientWithDogs | undefined> {
    const client = this.clientsData.get(id);
    if (!client) return undefined;
    
    return this.enrichClientWithDogsAndAppointments(client);
  }

  async searchClients(term: string): Promise<ClientWithDogs[]> {
    const normalizedTerm = term.toLowerCase();
    const matchingClients = Array.from(this.clientsData.values()).filter(client => {
      return (
        client.name.toLowerCase().includes(normalizedTerm) ||
        client.phone.includes(normalizedTerm)
      );
    });
    
    const enrichedClients = await Promise.all(
      matchingClients.map(client => this.enrichClientWithDogsAndAppointments(client))
    );
    
    return enrichedClients;
  }

  async createClient(client: InsertClient, dogsInfo: InsertDog[]): Promise<ClientWithDogs> {
    const id = this.getNextClientId();
    const newClient: Client = { id, ...client };
    this.clientsData.set(id, newClient);
    
    // Create dogs for this client
    await Promise.all(dogsInfo.map(dogInfo => 
      this.createDog({ ...dogInfo, clientId: id })
    ));
    
    return this.enrichClientWithDogsAndAppointments(newClient);
  }

  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<ClientWithDogs | undefined> {
    const existingClient = this.clientsData.get(id);
    if (!existingClient) return undefined;
    
    const updatedClient = { ...existingClient, ...clientUpdate };
    this.clientsData.set(id, updatedClient);
    
    return this.enrichClientWithDogsAndAppointments(updatedClient);
  }

  // Dog operations
  async getDogsByClientId(clientId: number): Promise<Dog[]> {
    return Array.from(this.dogsData.values())
      .filter(dog => dog.clientId === clientId);
  }

  async createDog(dog: InsertDog): Promise<Dog> {
    const id = this.getNextDogId();
    const newDog: Dog = { id, ...dog };
    this.dogsData.set(id, newDog);
    return newDog;
  }

  async updateDog(id: number, dogUpdate: Partial<InsertDog>): Promise<Dog | undefined> {
    const existingDog = this.dogsData.get(id);
    if (!existingDog) return undefined;
    
    const updatedDog = { ...existingDog, ...dogUpdate };
    this.dogsData.set(id, updatedDog);
    
    return updatedDog;
  }

  async deleteDog(id: number): Promise<boolean> {
    if (!this.dogsData.has(id)) return false;
    return this.dogsData.delete(id);
  }

  // Appointment operations
  async getAppointments(): Promise<AppointmentWithClientAndDogs[]> {
    const appointments = Array.from(this.appointmentsData.values());
    const enrichedAppointments = await Promise.all(
      appointments.map(appointment => this.enrichAppointmentWithClientAndDogs(appointment))
    );
    return enrichedAppointments;
  }

  async getAppointment(id: number): Promise<AppointmentWithClientAndDogs | undefined> {
    const appointment = this.appointmentsData.get(id);
    if (!appointment) return undefined;
    
    return this.enrichAppointmentWithClientAndDogs(appointment);
  }

  async getAppointmentsByClientId(clientId: number): Promise<AppointmentWithClientAndDogs[]> {
    const clientAppointments = Array.from(this.appointmentsData.values())
      .filter(appointment => appointment.clientId === clientId);
    
    const enrichedAppointments = await Promise.all(
      clientAppointments.map(appointment => this.enrichAppointmentWithClientAndDogs(appointment))
    );
    
    return enrichedAppointments;
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<AppointmentWithClientAndDogs[]> {
    const appointments = Array.from(this.appointmentsData.values())
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= startDate && appointmentDate <= endDate;
      });
    
    const enrichedAppointments = await Promise.all(
      appointments.map(appointment => this.enrichAppointmentWithClientAndDogs(appointment))
    );
    
    return enrichedAppointments;
  }

  async createAppointment(appointment: InsertAppointment): Promise<AppointmentWithClientAndDogs> {
    const id = this.getNextAppointmentId();
    const createdAt = new Date();
    const newAppointment: Appointment = { 
      id, 
      ...appointment,
      createdAt 
    };
    
    this.appointmentsData.set(id, newAppointment);
    
    return this.enrichAppointmentWithClientAndDogs(newAppointment);
  }

  async updateAppointment(id: number, appointmentUpdate: Partial<InsertAppointment>): Promise<AppointmentWithClientAndDogs | undefined> {
    const existingAppointment = this.appointmentsData.get(id);
    if (!existingAppointment) return undefined;
    
    const updatedAppointment = { ...existingAppointment, ...appointmentUpdate };
    this.appointmentsData.set(id, updatedAppointment);
    
    return this.enrichAppointmentWithClientAndDogs(updatedAppointment);
  }

  async deleteAppointment(id: number): Promise<boolean> {
    if (!this.appointmentsData.has(id)) return false;
    return this.appointmentsData.delete(id);
  }

  // Financials operations
  async getExpenditures(): Promise<Expenditure[]> {
    return Array.from(this.expendituresData.values());
  }

  async getExpendituresByDateRange(startDate: Date, endDate: Date): Promise<Expenditure[]> {
    return Array.from(this.expendituresData.values())
      .filter(expenditure => {
        const expenditureDate = new Date(expenditure.date);
        return expenditureDate >= startDate && expenditureDate <= endDate;
      });
  }

  async createExpenditure(expenditure: InsertExpenditure): Promise<Expenditure> {
    const id = this.getNextExpenditureId();
    const newExpenditure: Expenditure = { id, ...expenditure };
    this.expendituresData.set(id, newExpenditure);
    return newExpenditure;
  }

  async updateExpenditure(id: number, expenditureUpdate: Partial<InsertExpenditure>): Promise<Expenditure | undefined> {
    const existingExpenditure = this.expendituresData.get(id);
    if (!existingExpenditure) return undefined;
    
    const updatedExpenditure = { ...existingExpenditure, ...expenditureUpdate };
    this.expendituresData.set(id, updatedExpenditure);
    
    return updatedExpenditure;
  }

  async deleteExpenditure(id: number): Promise<boolean> {
    if (!this.expendituresData.has(id)) return false;
    return this.expendituresData.delete(id);
  }

  // Summary operations
  async getOverdueClients(): Promise<ClientWithDogs[]> {
    const allClients = await this.getClients();
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // Filter clients who haven't had an appointment in the last 30 days
    // and have a specified frequency
    return allClients.filter(client => {
      if (!client.frequency || client.frequency === 'As Needed') return false;
      
      if (!client.lastAppointment) return true;
      
      const lastAppointmentDate = new Date(client.lastAppointment.date);
      return lastAppointmentDate < thirtyDaysAgo;
    });
  }

  async getSuggestedFollowUps(): Promise<ClientWithDogs[]> {
    const allClients = await this.getClients();
    const now = new Date();
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);
    
    // Filter clients who haven't had an appointment in the last 60 days
    // and don't have any upcoming appointments
    return allClients.filter(client => {
      if (client.nextAppointment) return false;
      
      if (!client.lastAppointment) return true;
      
      const lastAppointmentDate = new Date(client.lastAppointment.date);
      return lastAppointmentDate < sixtyDaysAgo;
    });
  }

  async getFinancialSummary(startDate: Date, endDate: Date): Promise<{
    income: number;
    expenses: number;
    net: number;
  }> {
    // Get income from appointments
    const appointments = await this.getAppointmentsByDateRange(startDate, endDate);
    const income = appointments.reduce((total, appointment) => {
      return total + Number(appointment.price);
    }, 0);
    
    // Get expenses
    const expenditures = await this.getExpendituresByDateRange(startDate, endDate);
    const expenses = expenditures.reduce((total, expenditure) => {
      return total + Number(expenditure.amount);
    }, 0);
    
    return {
      income,
      expenses,
      net: income - expenses
    };
  }
}

export const storage = new MemStorage();
