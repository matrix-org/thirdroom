export const roundUpToMultiple = (mul: number) => (x: number) => Math.ceil(x / mul) * mul;
export const roundUpToMultiple4 = roundUpToMultiple(4);
export const roundUpToMultiple8 = roundUpToMultiple(8);
