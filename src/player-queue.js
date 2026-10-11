// Pure helpers: predictable queue behaviour, independent of React and Supabase.
export const REPEAT_MODES = ['off', 'all', 'one'];

export function uniqueIds(ids) {
  return [...new Set((ids || []).filter(id => typeof id === 'string' && id.length > 0))];
}
function mix(ids, random = Math.random) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createQueue(currentId, contextIds, {shuffle = false, repeat = 'off', random = Math.random} = {}) {
  const baseIds = uniqueIds(contextIds);
  if (currentId && !baseIds.includes(currentId)) baseIds.unshift(currentId);
  const cursor = Math.max(0, baseIds.indexOf(currentId));
  const ids = shuffle ? [currentId, ...mix(baseIds.filter(id => id !== currentId), random)] : baseIds;
  return {baseIds, ids, cursor: shuffle ? 0 : cursor, shuffle, repeat: REPEAT_MODES.includes(repeat) ? repeat : 'off'};
}
export function nextPosition(queue, {back = false, ended = false} = {}) {
  if (!queue?.ids?.length) return null;
  if (ended && queue.repeat === 'one') return queue.cursor;
  if (back) return queue.cursor > 0 ? queue.cursor - 1 : queue.repeat === 'all' ? queue.ids.length - 1 : queue.cursor;
  if (queue.cursor + 1 < queue.ids.length) return queue.cursor + 1;
  return queue.repeat === 'all' ? 0 : null;
}
export function toggleShuffle(queue, random = Math.random) {
  if (!queue?.ids?.length) return {...queue, shuffle: !queue.shuffle};
  const completed = queue.ids.slice(0, queue.cursor + 1);
  const upcoming = queue.ids.slice(queue.cursor + 1);
  const rest = queue.shuffle ? queue.baseIds.filter(id => upcoming.includes(id)) : mix(upcoming, random);
  return {...queue, shuffle: !queue.shuffle, ids: [...completed, ...rest]};
}
export function cycleRepeat(queue) {
  return {...queue, repeat: REPEAT_MODES[(REPEAT_MODES.indexOf(queue.repeat) + 1) % REPEAT_MODES.length]};
}
export function enqueueNext(queue, id) {
  if (!id || !queue?.ids?.length || queue.ids.includes(id)) return queue;
  const ids = [...queue.ids]; ids.splice(queue.cursor + 1, 0, id);
  const baseIds = queue.baseIds.includes(id) ? queue.baseIds : [...queue.baseIds, id];
  return {...queue, ids, baseIds};
}
export function removeUpcoming(queue, id) {
  const at = queue.ids.indexOf(id);
  if (at <= queue.cursor) return queue;
  return {...queue, ids: queue.ids.filter((x,i) => i !== at), baseIds: queue.baseIds.filter(x => x !== id)};
}
export function moveUpcoming(queue, id, delta) {
  const at = queue.ids.indexOf(id), to = at + delta;
  if (at <= queue.cursor || to <= queue.cursor || to >= queue.ids.length) return queue;
  const ids = [...queue.ids]; [ids[at],ids[to]] = [ids[to],ids[at]];
  return {...queue, ids, baseIds: ids};
}
export function resumePosition(position, duration) {
  const pos = Number(position), total = Number(duration);
  return Number.isFinite(pos) && Number.isFinite(total) && pos >= 12 && total >= 25 && pos < total - 10
    ? Math.floor(pos) : 0;
}
