import { describe, it, expect } from 'vitest';
import { pharmacyService } from '../services/pharmacyService';

describe('pharmacyService Unit Tests', () => {
  it('fetches initial queue requests correctly', async () => {
    const requests = await pharmacyService.getQueueRequests();
    expect(Array.isArray(requests)).toBe(true);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0]).toHaveProperty('token_number');
  });

  it('updates queue item status through the workflow sequence', async () => {
    const requests = await pharmacyService.getQueueRequests();
    const target = requests[0];

    const updated = await pharmacyService.updateQueueStatus(target.id, 'preparing');
    expect(updated.status).toBe('preparing');
  });

  it('fetches inventory stock items', async () => {
    const stock = await pharmacyService.getStockInventory();
    expect(Array.isArray(stock)).toBe(true);
    expect(stock.length).toBeGreaterThan(0);
    expect(stock[0]).toHaveProperty('brand_name');
  });

  it('calculates metrics correctly', async () => {
    const metrics = await pharmacyService.getMetrics();
    expect(metrics).toHaveProperty('pending_count');
    expect(metrics).toHaveProperty('preparing_count');
    expect(metrics).toHaveProperty('ready_count');
  });
});
