import { AsyncLocalStorage } from 'node:async_hooks';
import pg, { type PoolClient, type QueryResultRow } from 'pg';
import type { UnitOfWork } from '../application/unit-of-work.js';

const { Pool, types } = pg;

types.setTypeParser(20, (value) => Number.parseInt(value, 10));
types.setTypeParser(1700, (value) => Number.parseFloat(value));
types.setTypeParser(1082, (value) => value);

export interface Database extends UnitOfWork {
  query<T extends object = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  one<T extends object = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  ping(): Promise<void>;
  close(): Promise<void>;
}

interface TxContext {
  client: PoolClient;
  afterCommit: Array<() => void | Promise<void>>;
}

export class PgDatabase implements Database {
  private readonly als = new AsyncLocalStorage<TxContext>();

  constructor(private readonly pool: InstanceType<typeof Pool>) {}

  static connect(connectionString: string): PgDatabase {
    return new PgDatabase(new Pool({ connectionString, max: 10 }));
  }

  private get client(): PoolClient | InstanceType<typeof Pool> {
    return this.als.getStore()?.client ?? this.pool;
  }

  async query<T extends object = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.client.query<T & QueryResultRow>(sql, params);
    return result.rows;
  }

  async one<T extends object = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    return rows[0];
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    await this.client.query(sql, params);
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.als.getStore()) return work();

    const client = await this.pool.connect();
    const ctx: TxContext = { client, afterCommit: [] };
    let result: T;
    try {
      await client.query('BEGIN');
      result = await this.als.run(ctx, work);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
    for (const callback of ctx.afterCommit) {
      try {
        await callback();
      } catch (error) {
        console.error('Fallo en efecto posterior al commit', error);
      }
    }
    return result;
  }

  afterCommit(callback: () => void | Promise<void>): void {
    const ctx = this.als.getStore();
    if (ctx) ctx.afterCommit.push(callback);
    else void Promise.resolve().then(callback).catch((error) => console.error('Fallo en efecto diferido', error));
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
