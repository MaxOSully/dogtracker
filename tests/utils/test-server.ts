import { Express } from 'express';
import { Server } from 'http';
import supertest from 'supertest';
import { registerRoutes } from '../../server/routes';

// Create a test server setup to use in tests
async function createTestServer() {
  // Create an express app instance
  const express = require('express');
  const app: Express = express();
  
  // Set up middleware
  app.use(express.json());
  
  // Register API routes
  const server: Server = await registerRoutes(app);
  
  // Create a supertest instance
  const request = supertest(app);
  
  // Return everything needed for testing
  return { app, server, request };
}

export { createTestServer };