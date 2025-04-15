import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertClientSchema,
  insertDogSchema,
  insertAppointmentSchema,
  insertExpenditureSchema,
  InsertDog
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Clients
  app.get("/api/clients", async (req: Request, res: Response) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get clients", error });
    }
  });

  app.get("/api/clients/search", async (req: Request, res: Response) => {
    try {
      const { term } = req.query;
      if (!term || typeof term !== "string") {
        return res.status(400).json({ message: "Search term is required" });
      }
      const clients = await storage.searchClients(term);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to search clients", error });
    }
  });

  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to get client", error });
    }
  });

  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      // Validate client data
      const clientData = insertClientSchema.parse(req.body.client);
      
      // Validate dogs data
      const dogsSchema = z.array(insertDogSchema.omit({ clientId: true }));
      const parsedDogs = dogsSchema.parse(req.body.dogs);
      
      // At this point, we don't have the client ID yet, so we pass the dogs as is
      // The createClient method will set the proper clientId for each dog
      const client = await storage.createClient(clientData, parsedDogs as InsertDog[]);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client", error });
    }
  });

  app.put("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // Validate client data
      const clientData = insertClientSchema.partial().parse(req.body);
      
      // Handle updated dogs if present in the request
      if (req.body.dogs !== undefined) {
        // Get existing dogs for this client
        const existingDogs = await storage.getDogsByClientId(id);
        const existingDogIds = new Set(existingDogs.map(dog => dog.id));
        
        // Parse dogs from request
        const dogsSchema = z.array(z.object({
          id: z.number().optional(), // Optional for new dogs
          name: z.string(),
          size: z.string(),
          hairLength: z.string()
        }));
        
        const dogsData = dogsSchema.parse(req.body.dogs);
        
        // Process each dog: create new ones, update existing ones
        for (const dogData of dogsData) {
          if (dogData.id) {
            // Update existing dog
            await storage.updateDog(dogData.id, {
              name: dogData.name,
              size: dogData.size,
              hairLength: dogData.hairLength
            });
            
            // Remove from existingDogIds set to track which dogs to keep
            existingDogIds.delete(dogData.id);
          } else {
            // Create new dog
            await storage.createDog({
              clientId: id,
              name: dogData.name,
              size: dogData.size,
              hairLength: dogData.hairLength
            });
          }
        }
        
        // Delete dogs that are no longer in the request
        // Fixed: Using forEach with async functions doesn't properly wait for completion
        // We need to use Promise.all to ensure all dogs are deleted before continuing
        await Promise.all(
          Array.from(existingDogIds).map(dogIdToDelete => 
            storage.deleteDog(dogIdToDelete)
          )
        );
      }
      
      // Update the client information
      const client = await storage.updateClient(id, clientData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client", error });
    }
  });

  // Dogs
  app.post("/api/dogs", async (req: Request, res: Response) => {
    try {
      // Validate dog data
      const dogData = insertDogSchema.parse(req.body);
      
      const dog = await storage.createDog(dogData);
      res.status(201).json(dog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create dog", error });
    }
  });

  app.put("/api/dogs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid dog ID" });
      }
      
      // Validate dog data
      const dogData = insertDogSchema.partial().parse(req.body);
      
      const dog = await storage.updateDog(id, dogData);
      if (!dog) {
        return res.status(404).json({ message: "Dog not found" });
      }
      
      res.json(dog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update dog", error });
    }
  });

  app.delete("/api/dogs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid dog ID" });
      }
      
      const deleted = await storage.deleteDog(id);
      if (!deleted) {
        return res.status(404).json({ message: "Dog not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete dog", error });
    }
  });

  // Appointments
  app.get("/api/appointments", async (req: Request, res: Response) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointments", error });
    }
  });

  app.get("/api/appointments/dateRange", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate || typeof startDate !== "string" || typeof endDate !== "string") {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const appointments = await storage.getAppointmentsByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointments by date range", error });
    }
  });

  app.get("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointment", error });
    }
  });

  app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
      // Validate appointment data
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment", error });
    }
  });

  app.put("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      // Validate appointment data
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      
      const appointment = await storage.updateAppointment(id, appointmentData);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appointment", error });
    }
  });

  app.delete("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      const deleted = await storage.deleteAppointment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment", error });
    }
  });

  // Expenditures
  app.get("/api/expenditures", async (req: Request, res: Response) => {
    try {
      const expenditures = await storage.getExpenditures();
      res.json(expenditures);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expenditures", error });
    }
  });

  app.get("/api/expenditures/dateRange", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate || typeof startDate !== "string" || typeof endDate !== "string") {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const expenditures = await storage.getExpendituresByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
      
      res.json(expenditures);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expenditures by date range", error });
    }
  });

  app.post("/api/expenditures", async (req: Request, res: Response) => {
    try {
      // Validate expenditure data
      const expenditureData = insertExpenditureSchema.parse(req.body);
      
      const expenditure = await storage.createExpenditure(expenditureData);
      res.status(201).json(expenditure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expenditure", error });
    }
  });

  app.put("/api/expenditures/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expenditure ID" });
      }
      
      // Validate expenditure data
      const expenditureData = insertExpenditureSchema.partial().parse(req.body);
      
      const expenditure = await storage.updateExpenditure(id, expenditureData);
      if (!expenditure) {
        return res.status(404).json({ message: "Expenditure not found" });
      }
      
      res.json(expenditure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expenditure", error });
    }
  });

  app.delete("/api/expenditures/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expenditure ID" });
      }
      
      const deleted = await storage.deleteExpenditure(id);
      if (!deleted) {
        return res.status(404).json({ message: "Expenditure not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expenditure", error });
    }
  });

  // Summary endpoints
  app.get("/api/summary/overdue-clients", async (req: Request, res: Response) => {
    try {
      const overdueClients = await storage.getOverdueClients();
      res.json(overdueClients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get overdue clients", error });
    }
  });

  app.get("/api/summary/suggested-followups", async (req: Request, res: Response) => {
    try {
      const suggestedFollowUps = await storage.getSuggestedFollowUps();
      res.json(suggestedFollowUps);
    } catch (error) {
      res.status(500).json({ message: "Failed to get suggested follow-ups", error });
    }
  });

  app.get("/api/summary/financials", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate || typeof startDate !== "string" || typeof endDate !== "string") {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const financialSummary = await storage.getFinancialSummary(
        new Date(startDate),
        new Date(endDate)
      );
      
      res.json(financialSummary);
    } catch (error) {
      res.status(500).json({ message: "Failed to get financial summary", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
