export const getDateRange = (year: string, month: string) => {
  const startDate = new Date(`${year}-${month.padStart(2, '0')}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  return { startDate, endDate };
}