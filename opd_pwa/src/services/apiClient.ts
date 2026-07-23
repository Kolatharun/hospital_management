import { ApiResponse } from '../types';

export const isMockMode = true;

export const simulateLatency = async <T>(data: T, delayMs: number = 400): Promise<ApiResponse<T>> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return {
    success: true,
    data,
  };
};
