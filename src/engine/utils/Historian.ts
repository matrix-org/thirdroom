export interface Historian<T> {
  history: T[];
  timestamps: number[];
}

export const createHistorian = <T>(): Historian<T> => ({
  history: [],
  timestamps: [],
});

export const trimHistorian = <T>(historian: Historian<T>, trimTime: number): T[] => {
  let indexToTrim = historian.timestamps.length;
  for (let i = historian.timestamps.length - 1; i >= 0; i--) {
    const t = historian.timestamps[i];
    if (t <= trimTime) {
      indexToTrim = i;
    }
  }
  historian.timestamps.splice(indexToTrim);
  return historian.history.splice(indexToTrim);
};

export const getHistory = <T>(historian: Historian<T>, time: number): T | undefined =>
  historian.history.at(historian.timestamps.indexOf(time));

export const addHistory = <T>(historian: Historian<T>, time: number, history: T) => {
  historian.timestamps.unshift(time);
  historian.history.unshift(history);
};
