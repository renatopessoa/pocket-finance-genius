import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import transactionsRoutes from '../routes/transactions.js';
import pool from '../db.js';

const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

vi.mock('../db.js', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(() => Promise.resolve({
      query: vi.fn(),
      release: vi.fn(),
    })),
  }
}));

const app = express();
app.use(express.json());
app.use('/api/transactions', transactionsRoutes);

describe('Transactions API Integration', () => {
  let activeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    activeClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    pool.connect.mockResolvedValue(activeClient);
  });

  describe('GET /api/transactions', () => {
    it('returns 400 if user_id is missing', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('user_id obrigatório');
    });

    it('returns transactions successfully', async () => {
      const txMock = [{ id: 't1', amount: 100, type: 'income', category_name: 'Salary' }];
      pool.query.mockResolvedValueOnce({ rows: txMock });

      const res = await request(app).get('/api/transactions?user_id=u1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(txMock);
    });
  });

  describe('POST /api/transactions', () => {
    it('creates a single transaction and updates account balance', async () => {
      activeClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 't2', amount: 50, type: 'expense' }] }) // INSERT
        .mockResolvedValueOnce() // UPDATE account
        .mockResolvedValueOnce(); // COMMIT

      const payload = {
        amount: 50,
        description: 'Dinner',
        date: new Date().toISOString(),
        type: 'expense',
        category_id: 'c1',
        account_id: 'a1',
        user_id: 'u1'
      };

      const res = await request(app).post('/api/transactions').send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', 't2');
      
      // Verify transaction flow
      expect(activeClient.query).toHaveBeenCalledWith('BEGIN');
      expect(activeClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO pfg_transactions'),
        expect.any(Array)
      );
      // Verify account update
      expect(activeClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE pfg_accounts SET balance = balance + $1'),
        [-50, 'a1'] // -50 because it's an expense
      );
      expect(activeClient.query).toHaveBeenCalledWith('COMMIT');
      expect(activeClient.release).toHaveBeenCalled();
    });

    it('creates multiple transactions (installments) and updates account balance', async () => {
      activeClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 't3', amount: 25, type: 'expense' }] }) // INSERT 1
        .mockResolvedValueOnce() // UPDATE 1
        .mockResolvedValueOnce({ rows: [{ id: 't4', amount: 25, type: 'expense' }] }) // INSERT 2
        .mockResolvedValueOnce() // UPDATE 2
        .mockResolvedValueOnce(); // COMMIT

      const payload = [
        { amount: 25, description: 'Inst 1', type: 'expense', account_id: 'a1' },
        { amount: 25, description: 'Inst 2', type: 'expense', account_id: 'a1' }
      ];

      const res = await request(app).post('/api/transactions').send(payload);

      expect(res.status).toBe(201);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(activeClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('rolls back on error', async () => {
      activeClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockRejectedValueOnce(new Error('DB Error')); // INSERT fails

      const res = await request(app).post('/api/transactions').send({ amount: 100 });

      expect(res.status).toBe(500);
      expect(activeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(activeClient.release).toHaveBeenCalled();
    });
  });
});
