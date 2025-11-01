export const getLocal = (key, defaultValue = null) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
