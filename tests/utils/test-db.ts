import { sql } from 'drizzle-orm';
import { db, pool } from '../../server/db';
import { clients, dogs, appointments, expenditures } from '../../shared/schema';

// Helper to clean up the test database
async function cleanupDatabase() {
  try {
    // Delete all data from tables in reverse order of dependencies
    await db.delete(appointments);
    await db.delete(expenditures);
    await db.delete(dogs);
    await db.delete(clients);
    
    // Reset sequences
    await pool.query('ALTER SEQUENCE clients_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE dogs_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE appointments_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE expenditures_id_seq RESTART WITH 1');
  } catch (error) {
    console.error('Error cleaning database:', error?.message || error);
    throw error;
  }
}

// Helper to seed the database with test data
async function seedTestData() {
  try {
    // Create test client
    const [testClient] = await db.insert(clients)
      .values({
        name: 'Test Client',
        phone: '123-456-7890',
        address: '123 Test St',
        frequency: 'Monthly',
        notes: 'Test client notes'
      })
      .returning();
    
    // Create test dogs
    const [testDog1] = await db.insert(dogs)
      .values({
        clientId: testClient.id,
        name: 'Test Dog 1',
        size: 'Medium',
        hairLength: 'Short'
      })
      .returning();
    
    const [testDog2] = await db.insert(dogs)
      .values({
        clientId: testClient.id,
        name: 'Test Dog 2',
        size: 'Large',
        hairLength: 'Long'
      })
      .returning();
    
    // Create test appointment
    const [testAppointment] = await db.insert(appointments)
      .values({
        clientId: testClient.id,
        date: new Date().toISOString().split('T')[0], // Today
        time: '14:00',
        serviceType: 'Full Groom',
        price: '50.00',
        status: 'Scheduled',
        notes: 'Test appointment'
      })
      .returning();
    
    // Create test expenditure
    const [testExpenditure] = await db.insert(expenditures)
      .values({
        date: new Date().toISOString().split('T')[0], // Today
        amount: '25.00',
        category: 'Supplies',
        notes: 'Test expenditure'
      })
      .returning();
    
    return {
      client: testClient,
      dogs: [testDog1, testDog2],
      appointment: testAppointment,
      expenditure: testExpenditure
    };
  } catch (error) {
    console.error('Error seeding test data:', error?.message || error);
    throw error;
  }
}

// Close the database connection
async function closeDatabase() {
  await pool.end();
}

export { cleanupDatabase, seedTestData, closeDatabase };