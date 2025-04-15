import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { SuperTest, Test } from 'supertest';
import { Express } from 'express';
import { Server } from 'http';
import { createTestServer } from '../utils/test-server';
import { cleanupDatabase, seedTestData, closeDatabase } from '../utils/test-db';
import { InsertAppointment } from '../../shared/schema';
import { format, addDays } from 'date-fns';

describe('Appointment API', () => {
  let app: Express;
  let server: Server;
  let request: any;
  let testData: any;

  // Set up test server and database
  beforeAll(async () => {
    const testServer = await createTestServer();
    app = testServer.app;
    server = testServer.server;
    request = testServer.request;
  });

  // Clean up database before each test
  beforeEach(async () => {
    await cleanupDatabase();
    testData = await seedTestData();
  });

  // Close server and database connection after all tests
  afterAll(async () => {
    server.close();
    await closeDatabase();
  });

  // Test retrieving all appointments
  it('should get all appointments', async () => {
    const response = await request.get('/api/appointments');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('date');
    expect(response.body[0]).toHaveProperty('client');
  });

  // Test retrieving a single appointment
  it('should get a specific appointment by ID', async () => {
    const appointmentId = testData.appointment.id;
    const response = await request.get(`/api/appointments/${appointmentId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', appointmentId);
    expect(response.body).toHaveProperty('client');
    expect(response.body.client).toHaveProperty('id', testData.client.id);
  });

  // Test creating a new appointment
  it('should create a new appointment', async () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    const newAppointment: InsertAppointment = {
      clientId: testData.client.id,
      date: format(tomorrow, 'yyyy-MM-dd'),
      time: '15:30',
      serviceType: 'Bath Only',
      price: '35.00',
      status: 'Scheduled',
      notes: 'Test appointment for tomorrow'
    };
    
    const response = await request
      .post('/api/appointments')
      .send(newAppointment);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.date).toBe(newAppointment.date);
    expect(response.body.time).toBe(newAppointment.time);
    expect(response.body.price).toBe(newAppointment.price);
  });

  // Test retrieving appointments by date range - critical test for our issue
  it('should retrieve appointments within a date range', async () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    
    // First, create a few appointments with different dates
    const appointmentToday: InsertAppointment = {
      clientId: testData.client.id,
      date: format(today, 'yyyy-MM-dd'),
      time: '10:00',
      serviceType: 'Full Groom',
      price: '50.00',
      status: 'Scheduled',
      notes: 'Test appointment for today'
    };
    
    const appointmentTomorrow: InsertAppointment = {
      clientId: testData.client.id,
      date: format(tomorrow, 'yyyy-MM-dd'),
      time: '11:30',
      serviceType: 'Nail Trim',
      price: '15.00',
      status: 'Scheduled',
      notes: 'Test appointment for tomorrow'
    };
    
    const appointmentNextWeek: InsertAppointment = {
      clientId: testData.client.id,
      date: format(nextWeek, 'yyyy-MM-dd'),
      time: '14:00',
      serviceType: 'Bath and Haircut',
      price: '45.00',
      status: 'Scheduled',
      notes: 'Test appointment for next week'
    };
    
    // Create the appointments
    await request.post('/api/appointments').send(appointmentToday);
    await request.post('/api/appointments').send(appointmentTomorrow);
    await request.post('/api/appointments').send(appointmentNextWeek);
    
    // Now test the date range endpoint - first with a range that includes all appointments
    const fullRangeResponse = await request
      .get(`/api/appointments/dateRange`)
      .query({
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(nextWeek, 'yyyy-MM-dd')
      });
    
    expect(fullRangeResponse.status).toBe(200);
    expect(Array.isArray(fullRangeResponse.body)).toBe(true);
    // Should include all our new appointments plus the seed appointment (4 total)
    expect(fullRangeResponse.body.length).toBe(4);
    
    // Test with a narrower range that includes only today and tomorrow
    const narrowRangeResponse = await request
      .get(`/api/appointments/dateRange`)
      .query({
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(tomorrow, 'yyyy-MM-dd')
      });
    
    expect(narrowRangeResponse.status).toBe(200);
    expect(Array.isArray(narrowRangeResponse.body)).toBe(true);
    // Should include only today and tomorrow appointments (3 total)
    expect(narrowRangeResponse.body.length).toBe(3);
    
    // Make sure the results are properly formatted with client and dogs info
    expect(narrowRangeResponse.body[0]).toHaveProperty('client');
    expect(narrowRangeResponse.body[0].client).toHaveProperty('id');
    expect(narrowRangeResponse.body[0]).toHaveProperty('dogs');
    expect(Array.isArray(narrowRangeResponse.body[0].dogs)).toBe(true);
  });

  // Test updating an appointment
  it('should update an appointment', async () => {
    const appointmentId = testData.appointment.id;
    const updates = {
      time: '16:45',
      serviceType: 'Premium Groom',
      price: '65.00'
    };
    
    const response = await request
      .put(`/api/appointments/${appointmentId}`)
      .send(updates);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', appointmentId);
    expect(response.body.time).toBe(updates.time);
    expect(response.body.serviceType).toBe(updates.serviceType);
    expect(response.body.price).toBe(updates.price);
  });

  // Test deleting an appointment
  it('should delete an appointment', async () => {
    const appointmentId = testData.appointment.id;
    
    const deleteResponse = await request
      .delete(`/api/appointments/${appointmentId}`);
    
    expect(deleteResponse.status).toBe(204);
    
    // Verify the appointment is no longer accessible
    const getResponse = await request.get(`/api/appointments/${appointmentId}`);
    expect(getResponse.status).toBe(404);
  });
});