export const RETRY_LIMIT = 5;

/** Sample without replacement, then restore exam order so shared materials stay together. */
export function pickRetryQuestions<Q extends { id: number }>(missed: readonly Q[]): Q[] {
  const pool = [...missed];
  if (pool.length <= RETRY_LIMIT) return pool;
  for (let i = 0; i < RETRY_LIMIT; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, RETRY_LIMIT).sort((a, b) => a.id - b.id);
}
