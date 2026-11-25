import { describe, expect, it } from 'vitest';
import { offsetDe, pagina } from '../../../src/shared/application/pagination.js';

describe('shared pagination contract', () => {
  it('returns data and consistent metadata for a populated page', () => {
    const result = pagina([{ id: 1 }, { id: 2 }], 21, { page: 2, limit: 10 });

    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      meta: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });
    expect(offsetDe({ page: 2, limit: 10 })).toBe(10);
  });

  it('keeps one page in metadata for an empty result set', () => {
    expect(pagina([], 0, { page: 1, limit: 10 }).meta.totalPages).toBe(1);
  });
});
