
export const CATEGORY_RANGES = [
    { maxAge: 11, categoryId: 0, label: 'Preinfantil' },
    { minAge: 12, maxAge: 13, categoryId: 1, label: 'Infantil' },
    { minAge: 14, maxAge: 15, categoryId: 2, label: 'Cadete' },
    { minAge: 16, maxAge: 17, categoryId: 3, label: 'Junior' },
    { minAge: 18, maxAge: 20, categoryId: 4, label: 'Sub21' },
    { minAge: 18, maxAge: 22, categoryId: 5, label: 'Sub23' },
    { minAge: 18, maxAge: 35, categoryId: 6, label: 'Senior' },
    { minAge: 36, categoryId: 7, label: 'Master' }
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
