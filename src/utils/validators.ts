export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isStrongEnoughPassword = (value: string) => value.trim().length >= 8;

export const isRequired = (value: string) => value.trim().length > 0;
