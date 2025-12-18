
export const CATEGORY_RANGES = [
    { maxAge: 9, categoryId: 1, label: 'Preinfantil' },
    { minAge: 10, maxAge: 11, categoryId: 2, label: 'Infantil' },
    { minAge: 12, maxAge: 13, categoryId: 3, label: 'Menores' },
    { minAge: 14, maxAge: 16, categoryId: 4, label: 'Cadete' },
    { minAge: 17, maxAge: 18, categoryId: 5, label: 'Junior' },
    { minAge: 19, maxAge: 20, categoryId: 6, label: 'Sub21' },
    { minAge: 21, maxAge: 22, categoryId: 7, label: 'Sub23' },
    { minAge: 23, maxAge: 34, categoryId: 8, label: 'Senior' },
    { minAge: 35, categoryId: 9, label: 'Master A' }
];

export const getCategoryByAge = (age) => {
    const category = CATEGORY_RANGES.find(range => {
        if (range.minAge && range.maxAge) {
            return age >= range.minAge && age <= range.maxAge;
        }
        if (range.maxAge) {
            return age <= range.maxAge;
        }
        if (range.minAge) {
            return age >= range.minAge;
        }
        return false;
    });

    return category ? category.categoryId : 0; // Default to Preinfantil if no match
};
