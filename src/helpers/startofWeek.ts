export const startOfWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  today.setDate(today.getDate() - dayOfWeek);
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};
