export const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

export const getDaysInYear = (year) => new Date(year, 11, 31).getDate();

