import { pgTable, text, serial, integer, jsonb, date, time, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  frequency: integer("frequency_days"), // Number of days between appointments
  notes: text("notes"),
});

// Dog schema (linked to clients)
export const dogs = pgTable("dogs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  breed: text("breed"),  // Optional breed field
  size: text("size").notNull(), // small, medium, large
  hairLength: text("hair_length").notNull(), // short, medium, long
});

// Appointment schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  date: date("date").notNull(),
  time: time("time").notNull(),
  serviceType: text("service_type").notNull(),
  price: numeric("price").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Expenditure schema
export const expenditures = pgTable("expenditures", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  amount: numeric("amount").notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
});

export const insertDogSchema = createInsertSchema(dogs).omit({
  id: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertExpenditureSchema = createInsertSchema(expenditures).omit({
  id: true,
});

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Dog = typeof dogs.$inferSelect;
export type InsertDog = z.infer<typeof insertDogSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Expenditure = typeof expenditures.$inferSelect;
export type InsertExpenditure = z.infer<typeof insertExpenditureSchema>;

// Extended types for UI
export type ClientWithDogs = Client & {
  dogs: Dog[];
  lastAppointment?: Appointment;
  nextAppointment?: Appointment;
};

export type AppointmentWithClientAndDogs = Appointment & {
  client: Client;
  dogs: Dog[];
};
