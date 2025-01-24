import { Pool } from 'pg';

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Export a simplified query interface
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  end: () => pool.end()
}; 