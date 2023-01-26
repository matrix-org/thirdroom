export interface Historian<T> {
  history: T[];
  timestamps: number[];
}

export const createHistorian = <T>(): Historian<T> => ({
  history: [],
  timestamps: [],
});

export const trimHistory = <T>(historian: Historian<T>, trimTime: number): T[] => {
  const indexToTrim = historian.timestamps.indexOf(trimTime);
  historian.timestamps = historian.timestamps.splice(indexToTrim);
  historian.history = historian.history.splice(indexToTrim);
  return historian.history;
};

export const getHistory = <T>(historian: Historian<T>, time: number): T | undefined =>
  historian.history.at(historian.timestamps.indexOf(time));

export const addHistory = <T>(historian: Historian<T>, time: number, history: T) => {
  historian.timestamps.push(time);
  historian.history.push(history);
};
