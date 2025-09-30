export const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

export const getDatesinMonth = (month, year) => {
    const date = new Date(year, month - 1, 1);
    const dates = [];
    while (date.getMonth() === month - 1) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return dates;
};

export const getDaysInYear = (year) => new Date(year, 11, 31).getDate();

