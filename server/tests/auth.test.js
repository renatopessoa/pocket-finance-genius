import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import authRoutes from '../routes/auth.js';
import pool from '../db.js';

// Mock the database pool
vi.mock('../db.js', () => ({
  default: {
    query: vi.fn(),
  }
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('returns 400 if required fields are missing', async () => {
      const res = await request(app).post('/api/auth/register').send({ name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nome, e-mail e senha são obrigatórios');
    });

    it('returns 409 if email already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'user1' }] }); // mock existing user

      const res = await request(app).post('/api/auth/register').send({ 
        name: 'Test', email: 'test@example.com', password: 'pass' 
      });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Este e-mail já está cadastrado');
    });

    it('creates user and returns 201 on success', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // mock no existing user
        .mockResolvedValueOnce({ 
          rows: [{ id: 'u1', name: 'Test', email: 'test@test.com' }] 
        }); // mock insert result

      const res = await request(app).post('/api/auth/register').send({ 
        name: 'Test', email: 'test@test.com', password: 'pass' 
      });
      
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 'u1', name: 'Test', email: 'test@test.com' });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 if email or password missing', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
    });

    it('returns 401 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).post('/api/auth/login').send({ 
        email: 'test@example.com', password: 'wrong' 
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('E-mail ou senha inválidos');
    });

    it('returns user data on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 1);
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 'u2', name: 'John', email: 'john@example.com', password_hash: hashedPassword }] 
      });

      const res = await request(app).post('/api/auth/login').send({ 
        email: 'john@example.com', password: 'password123' 
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'u2', name: 'John', email: 'john@example.com' });
    });
  });
});
