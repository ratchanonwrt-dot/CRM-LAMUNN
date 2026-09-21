/**
 * Runs a list of tasks with at most `limit` running concurrently, instead of firing them
 * all at once via Promise.all — an unbounded Promise.all of DB writes can burst past the
 * pgbouncer/Prisma connection pool size and cause the whole batch to queue and stall
 * (measured on production: 21 concurrent queries took 8+ seconds vs <1ms each in isolation).
 */
export async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
