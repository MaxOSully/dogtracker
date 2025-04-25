import { 
  clients, Client, InsertClient,
  dogs, Dog, InsertDog,
  appointments, Appointment, InsertAppointment,
  expenditures, Expenditure, InsertExpenditure,
  ClientWithDogs, AppointmentWithClientAndDogs
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, desc, asc, SQL, sql } from "drizzle-orm";

export interface IStorage {
  // Client operations
  getClients(): Promise<ClientWithDogs[]>;
  getClient(id: number): Promise<ClientWithDogs | undefined>;
  searchClients(term: string): Promise<ClientWithDogs[]>;
  createClient(client: InsertClient, dogsInfo: InsertDog[]): Promise<ClientWithDogs>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<ClientWithDogs | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Dog operations
  getDogsByClientId(clientId: number): Promise<Dog[]>;
  createDog(dog: InsertDog): Promise<Dog>;
  updateDog(id: number, dog: Partial<InsertDog>): Promise<Dog | undefined>;
  deleteDog(id: number): Promise<boolean>;
  
  // Appointment operations
  getAppointments(): Promise<AppointmentWithClientAndDogs[]>;
  getAppointment(id: number): Promise<AppointmentWithClientAndDogs | undefined>;
  getAppointmentsByClientId(clientId: number): Promise<AppointmentWithClientAndDogs[]>;
  getAppointmentsByDateRange(startDate: Date, endDate: Date, clientId?: number): Promise<AppointmentWithClientAndDogs[]>;
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

export class DatabaseStorage implements IStorage {
  // Helper methods
  private async enrichClientWithDogsAndAppointments(client: Client): Promise<ClientWithDogs> {
    const dogs = await this.getDogsByClientId(client.id);
    
    // Get client's appointments
    const clientAppointments = await db.select().from(appointments)
      .where(eq(appointments.clientId, client.id));
    
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
    const clientsList = await db.select()
      .from(clients)
      .orderBy(asc(clients.id));
      
    const enrichedClients = await Promise.all(
      clientsList.map(client => this.enrichClientWithDogsAndAppointments(client))
    );
    return enrichedClients;
  }

  async getClient(id: number): Promise<ClientWithDogs | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) return undefined;
    
    return this.enrichClientWithDogsAndAppointments(client);
  }

  async searchClients(term: string): Promise<ClientWithDogs[]> {
    const searchTerm = `%${term}%`;
    const matchingClients = await db.select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      address: clients.address,
      frequency: clients.frequency,
      notes: clients.notes
    })
      .from(clients)
      .leftJoin(dogs, eq(dogs.clientId, clients.id))
      .where(
        sql`${clients.name} ILIKE ${searchTerm} OR ${clients.phone} ILIKE ${searchTerm} OR ${dogs.name} ILIKE ${searchTerm}`
      )
      .groupBy(clients.id);
    
    const enrichedClients = await Promise.all(
      matchingClients.map(client => this.enrichClientWithDogsAndAppointments(client))
    );
    
    return enrichedClients;
  }

  async createClient(client: InsertClient, dogsInfo: InsertDog[]): Promise<ClientWithDogs> {
    // Insert client and get the new client with ID
    const [newClient] = await db.insert(clients).values(client).returning();
    
    // Create dogs for this client
    if (dogsInfo.length > 0) {
      // Update the clientId for each dog to match the new client
      const dogsWithClientId = dogsInfo.map(dogInfo => ({
        ...dogInfo,
        clientId: newClient.id
      }));
      
      await Promise.all(dogsWithClientId.map(dogInfo => 
        this.createDog(dogInfo)
      ));
    }
    
    return this.enrichClientWithDogsAndAppointments(newClient);
  }

  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<ClientWithDogs | undefined> {
    // Ensure null values instead of undefined for optional fields
    const safeUpdate = { 
      ...clientUpdate,
      frequency: clientUpdate.frequency ?? null,
      notes: clientUpdate.notes ?? null 
    };
    
    const [updatedClient] = await db.update(clients)
      .set(safeUpdate)
      .where(eq(clients.id, id))
      .returning();
    
    if (!updatedClient) return undefined;
    
    return this.enrichClientWithDogsAndAppointments(updatedClient);
  }

  async deleteClient(id: number): Promise<boolean> {
    // First delete all dogs associated with this client
    await db.delete(dogs).where(eq(dogs.clientId, id));
    
    // Then delete all appointments associated with this client
    await db.delete(appointments).where(eq(appointments.clientId, id));
    
    // Finally delete the client
    const [deletedClient] = await db.delete(clients)
      .where(eq(clients.id, id))
      .returning();
    
    return !!deletedClient;
  }

  // Dog operations
  async getDogsByClientId(clientId: number): Promise<Dog[]> {
    return db.select().from(dogs).where(eq(dogs.clientId, clientId));
  }

  async createDog(dog: InsertDog): Promise<Dog> {
    const [newDog] = await db.insert(dogs).values(dog).returning();
    return newDog;
  }

  async updateDog(id: number, dogUpdate: Partial<InsertDog>): Promise<Dog | undefined> {
    const [updatedDog] = await db.update(dogs)
      .set(dogUpdate)
      .where(eq(dogs.id, id))
      .returning();
    
    return updatedDog;
  }

  async deleteDog(id: number): Promise<boolean> {
    const result = await db.delete(dogs).where(eq(dogs.id, id));
    return true; // In PostgreSQL, delete succeeds even if no rows were deleted
  }

  // Appointment operations
  async getAppointments(): Promise<AppointmentWithClientAndDogs[]> {
    const appointmentsList = await db.select().from(appointments);
    const enrichedAppointments = await Promise.all(
      appointmentsList.map(appointment => this.enrichAppointmentWithClientAndDogs(appointment))
    );
    return enrichedAppointments;
  }

  async getAppointment(id: number): Promise<AppointmentWithClientAndDogs | undefined> {
    const [appointment] = await db.select()
      .from(appointments)
      .where(eq(appointments.id, id));
    
    if (!appointment) return undefined;
    
    return this.enrichAppointmentWithClientAndDogs(appointment);
  }

  async getAppointmentsByClientId(clientId: number): Promise<AppointmentWithClientAndDogs[]> {
    const clientAppointments = await db.select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId));
    
    const enrichedAppointments = await Promise.all(
      clientAppointments.map(appointment => this.enrichAppointmentWithClientAndDogs(appointment))
    );
    
    return enrichedAppointments;
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date, clientId?: number): Promise<AppointmentWithClientAndDogs[]> {
    // Convert dates to string format for PostgreSQL
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const appointmentsInRange = await db.select()
      .from(appointments)
      .where(
        clientId 
          ? and(
              sql`${appointments.date} >= ${startDateStr} AND ${appointments.date} <= ${endDateStr}`,
              eq(appointments.clientId, clientId)
            )
          : sql`${appointments.date} >= ${startDateStr} AND ${appointments.date} <= ${endDateStr}`
      );
    
    const enrichedAppointments = await Promise.all(
      appointmentsInRange.map(appointment => this.enrichAppointmentWithClientAndDogs(appointment))
    );
    
    return enrichedAppointments;
  }

  async createAppointment(appointment: InsertAppointment): Promise<AppointmentWithClientAndDogs> {
    const [newAppointment] = await db.insert(appointments)
      .values(appointment)
      .returning();
    
    return this.enrichAppointmentWithClientAndDogs(newAppointment);
  }

  async updateAppointment(id: number, appointmentUpdate: Partial<InsertAppointment>): Promise<AppointmentWithClientAndDogs | undefined> {
    const [updatedAppointment] = await db.update(appointments)
      .set(appointmentUpdate)
      .where(eq(appointments.id, id))
      .returning();
    
    if (!updatedAppointment) return undefined;
    
    return this.enrichAppointmentWithClientAndDogs(updatedAppointment);
  }

  async deleteAppointment(id: number): Promise<boolean> {
    await db.delete(appointments).where(eq(appointments.id, id));
    return true;
  }

  // Financials operations
  async getExpenditures(): Promise<Expenditure[]> {
    return db.select().from(expenditures);
  }

  async getExpendituresByDateRange(startDate: Date, endDate: Date): Promise<Expenditure[]> {
    // Convert dates to string format for PostgreSQL
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return db.select()
      .from(expenditures)
      .where(
        sql`${expenditures.date} >= ${startDateStr} AND ${expenditures.date} <= ${endDateStr}`
      );
  }

  async createExpenditure(expenditure: InsertExpenditure): Promise<Expenditure> {
    const [newExpenditure] = await db.insert(expenditures)
      .values(expenditure)
      .returning();
    
    return newExpenditure;
  }

  async updateExpenditure(id: number, expenditureUpdate: Partial<InsertExpenditure>): Promise<Expenditure | undefined> {
    const [updatedExpenditure] = await db.update(expenditures)
      .set(expenditureUpdate)
      .where(eq(expenditures.id, id))
      .returning();
    
    return updatedExpenditure;
  }

  async deleteExpenditure(id: number): Promise<boolean> {
    await db.delete(expenditures).where(eq(expenditures.id, id));
    return true;
  }

  // Summary operations
  async getOverdueClients(): Promise<ClientWithDogs[]> {
    const allClients = await this.getClients();
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // Filter clients who haven't had an appointment in their specified frequency period
    // or haven't had an appointment in 30 days, and don't have any upcoming appointments
    return allClients.filter(client => {
      // Skip clients with no frequency set
      if (!client.frequency) return false;
      
      // If client has no appointments at all, they're overdue
      if (!client.lastAppointment) return true;
      
      // If client has an upcoming appointment, they're not overdue
      if (client.nextAppointment) {
        const nextAppointmentDate = new Date(client.nextAppointment.date);
        if (nextAppointmentDate >= now) return false;
      }
      
      const lastAppointmentDate = new Date(client.lastAppointment.date);
      
      // Check if it's been more than 30 days since last appointment
      const isOverThirtyDays = lastAppointmentDate < thirtyDaysAgo;
      
      // Check if it's been longer than their frequency period
      const daysSinceLastAppointment = Math.floor((now.getTime() - lastAppointmentDate.getTime()) / (1000 * 60 * 60 * 24));
      const isOverFrequencyPeriod = client.frequency > 0 && daysSinceLastAppointment > client.frequency;
      
      // Client is overdue if either condition is met
      return isOverThirtyDays || isOverFrequencyPeriod;
    });
  }

  async getSuggestedFollowUps(): Promise<ClientWithDogs[]> {
    const allClients = await this.getClients();
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    // Filter clients who will be due for an appointment within the next 7 days
    // based on their frequency setting
    return allClients.filter(client => {
      // Skip clients with no frequency set
      if (!client.frequency) return false;
      
      // Skip clients with upcoming appointments
      if (client.nextAppointment) {
        const nextAppointmentDate = new Date(client.nextAppointment.date);
        if (nextAppointmentDate <= sevenDaysFromNow) return false;
      }
      
      // If client has no previous appointments, they're not due soon
      if (!client.lastAppointment) return false;
      
      const lastAppointmentDate = new Date(client.lastAppointment.date);
      const daysSinceLastAppointment = Math.floor((now.getTime() - lastAppointmentDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDue = client.frequency - daysSinceLastAppointment;
      
      // Client will be due within the next 7 days
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });
  }

  async getFinancialSummary(startDate: Date, endDate: Date): Promise<{
    income: number;
    expenses: number;
    net: number;
  }> {
    // Convert dates to string format for PostgreSQL
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get income from appointments
    const appointmentsInRange = await db.select()
      .from(appointments)
      .where(
        sql`${appointments.date} >= ${startDateStr} AND ${appointments.date} <= ${endDateStr}`
      );
    
    const income = appointmentsInRange.reduce((total, appointment) => {
      return total + Number(appointment.price);
    }, 0);
    
    // Get expenses
    const expendituresInRange = await db.select()
      .from(expenditures)
      .where(
        sql`${expenditures.date} >= ${startDateStr} AND ${expenditures.date} <= ${endDateStr}`
      );
    
    const expenses = expendituresInRange.reduce((total, expenditure) => {
      return total + Number(expenditure.amount);
    }, 0);
    
    return {
      income,
      expenses,
      net: income - expenses
    };
  }
}

export const storage = new DatabaseStorage();
