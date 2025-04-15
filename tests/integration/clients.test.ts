import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import supertest from 'supertest';
import { Express } from 'express';
import { Server } from 'http';
import { createTestServer } from '../utils/test-server';
import { cleanupDatabase, seedTestData, closeDatabase } from '../utils/test-db';
import { InsertClient, InsertDog, Client, Dog } from '../../shared/schema';

describe('Client API', () => {
  let app: Express;
  let server: Server;
  let request: SuperTest<Test>;
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

  // Test retrieving all clients
  it('should get all clients', async () => {
    const response = await request.get('/api/clients');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('dogs');
    expect(Array.isArray(response.body[0].dogs)).toBe(true);
  });

  // Test retrieving a single client
  it('should get a specific client by ID', async () => {
    const clientId = testData.client.id;
    const response = await request.get(`/api/clients/${clientId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', clientId);
    expect(response.body).toHaveProperty('dogs');
    expect(Array.isArray(response.body.dogs)).toBe(true);
    expect(response.body.dogs.length).toBe(2);
  });

  // Test creating a new client with dogs
  it('should create a new client with dogs', async () => {
    const newClient: { client: InsertClient, dogs: Omit<InsertDog, 'clientId'>[] } = {
      client: {
        name: 'New Test Client',
        phone: '987-654-3210',
        address: '456 New St',
        frequency: 'Biweekly',
        notes: 'Notes for new test client'
      },
      dogs: [
        {
          name: 'New Dog 1',
          size: 'Small',
          hairLength: 'Medium'
        }
      ]
    };
    
    const response = await request
      .post('/api/clients')
      .send(newClient);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newClient.client.name);
    expect(response.body.dogs).toHaveLength(1);
    expect(response.body.dogs[0].name).toBe(newClient.dogs[0].name);
  });

  // Test updating a client
  it('should update a client', async () => {
    const clientId = testData.client.id;
    const updates = {
      name: 'Updated Client Name',
      frequency: 'Weekly'
    };
    
    const response = await request
      .put(`/api/clients/${clientId}`)
      .send(updates);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', clientId);
    expect(response.body.name).toBe(updates.name);
    expect(response.body.frequency).toBe(updates.frequency);
  });

  // Test updating a client with dogs (adding, updating, and removing)
  it('should update a client with modified dogs list', async () => {
    const clientId = testData.client.id;
    const dogToKeepId = testData.dogs[0].id;
    
    const updates = {
      name: 'Client With Updated Dogs',
      // Keep one existing dog with updates
      dogs: [
        {
          id: dogToKeepId, 
          name: 'Updated Dog Name',
          size: 'Small',
          hairLength: 'Medium'
        },
        // Add a new dog
        {
          name: 'Brand New Dog',
          size: 'Large',
          hairLength: 'Long'
        }
      ]
    };
    
    const response = await request
      .put(`/api/clients/${clientId}`)
      .send(updates);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', clientId);
    expect(response.body.name).toBe(updates.name);
    
    // Verify dogs were correctly updated
    expect(response.body.dogs).toHaveLength(2);
    
    // Find the updated dog
    const updatedDog = response.body.dogs.find((dog: Dog) => dog.id === dogToKeepId);
    expect(updatedDog).toBeDefined();
    expect(updatedDog.name).toBe('Updated Dog Name');
    
    // Find the new dog
    const newDog = response.body.dogs.find((dog: Dog) => dog.id !== dogToKeepId);
    expect(newDog).toBeDefined();
    expect(newDog.name).toBe('Brand New Dog');
    
    // Verify the other dog was deleted (only 2 dogs should be returned)
    expect(response.body.dogs).toHaveLength(2);
  });
});