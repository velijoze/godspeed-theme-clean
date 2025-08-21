import csv
import re

def standardize_category(category):
    if not category:
        return category

    # Main category translations
    main_translations = {
        'Zubehör': 'Accessories',
        'Teile': 'Parts'
    }

    # Direct replacements for exact matches
    exact_matches = {
        'Accessories > Bekleidung': 'Accessories > Clothing',
        'Bikes > KinderBikes': 'Bikes > Kids Bikes',
        'Bikes > Mountainbike': 'Bikes > Mountain Bikes',
        'Bikes > City / Trekking': 'Bikes > City & Trekking',
        'E-Bikes > E-MTB Full Suspension': 'E-Bikes > Mountain Bikes',
        'E-Bikes > E-bike City & Trekking': 'E-Bikes > City & Trekking',
        'E-Bikes > E-bike City, Tour & Trekking': 'E-Bikes > City & Trekking',
        'E-Bikes > E-MTB Full Suspension': 'E-Bikes > Mountain Bikes',
        'E-Bikes > E-MTB Hardtail': 'E-Bikes > Mountain Bikes'
    }

    # First, standardize the format
    category = category.replace(' - ', ' > ')
    category = re.sub(r'\s+', ' ', category).strip()

    # Apply main category translations first
    for old, new in main_translations.items():
        if category.startswith(old):
            category = category.replace(old, new, 1)

    # Then apply exact matches
    if category in exact_matches:
        return exact_matches[category]

    # Clean up special characters and formatting
    category = category.replace('&amp;', '&')
    category = category.replace('& -', '&')
    category = category.replace('  ', ' ')

    return category

def process_csv():
    with open('products_translated_english.csv', 'r', encoding='utf-8-sig') as infile, \
         open('products_clean_english.csv', 'w', encoding='utf-8', newline='') as outfile:
        reader = csv.DictReader(infile)
        writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
        writer.writeheader()
        
        for row in reader:
            # Clean both Category and Type fields
            category = standardize_category(row['Product Category'])
            row['Product Category'] = category
            row['Type'] = category  # Make Type match Category exactly
            writer.writerow(row)

if __name__ == '__main__':
    process_csv()