import { ConvexClient } from '@convex/react';
import { nanoid } from 'nanoid';

interface MemoryVector {
  id: string;
  vector: Float32Array;
  metadata: {
    type: string;
    context: string;
    timestamp: number;
    importance: number;
  };
}

export class ConvexStore {
  private client: ConvexClient;
  private dimensions: number;

  constructor(deploymentUrl: string, dimensions: number = 1536) {
    this.client = new ConvexClient(deploymentUrl);
    this.dimensions = dimensions;
  }

  async storeVector(vector: Float32Array, metadata: MemoryVector['metadata']) {
    if (vector.length !== this.dimensions) {
      throw new Error(`Vector must have ${this.dimensions} dimensions`);
    }

    const id = `mem-${nanoid()}`;
    await this.client.mutation('memories:store', {
      id,
      vector: Array.from(vector), // Convert to regular array for storage
      metadata
    });

    return id;
  }

  async findSimilar(vector: Float32Array, limit: number = 5) {
    const results = await this.client.query('memories:findSimilar', {
      vector: Array.from(vector),
      limit
    });

    return results.map(result => ({
      ...result,
      vector: new Float32Array(result.vector) // Convert back to Float32Array
    }));
  }

  async getMemory(id: string): Promise<MemoryVector | null> {
    const memory = await this.client.query('memories:get', { id });
    if (!memory) return null;

    return {
      ...memory,
      vector: new Float32Array(memory.vector)
    };
  }
}