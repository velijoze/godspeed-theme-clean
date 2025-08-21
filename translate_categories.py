import csv
import sys

translations = {
    'Zubehör': 'Accessories',
    'Teile': 'Parts',
    'Getriebe und Übersetzung': 'Gears and Transmission',
    'Saddlesstütze': 'Seatpost',
    'Werkstatt / Werkzeuge': 'Tools',
    'Trinkflaschen': 'Bottles',
    'Kindersitz': 'Child Seats',
    'Sattel': 'Saddles',
    'Räder': 'Wheels',
    'Gepäckträger': 'Luggage Racks',
    'RÃ¤der': 'Wheels',
    'GepÃ¤cktrÃ¤ger': 'Luggage Racks',
    'Ständer': 'Stands',
    'Anhänger': 'Trailers',
    'Velotaschen': 'Bags',
    'Lenker': 'Handlebars',
    'Bekleidung': 'Clothing',
    'Körbe': 'Baskets',
    'Pumpen': 'Pumps',
    'Schlösser': 'Locks',
    'Spiegel': 'Mirrors',
    'KinderBikes': 'Kids Bikes',
    'Dämpfer & Federgabel': 'Shocks & Suspension Forks',
    'Velopflege': 'Bike Care',
    'Caricatori': 'Chargers',
    'Mountainbike': 'Mountain Bike',
    'E-bike City & Trekking': 'E-bike City & Trekking',
    'E-bike 24 Zoll': 'E-bike 24 Inch',
    'E-bike 26 Zoll': 'E-bike 26 Inch',
    'Gebraucht': 'Used',
    'Velo Sale': 'Bike Sale'
}

def translate_category(category):
    if not category:
        return category
    parts = category.split(' > ')
    translated_parts = []
    for part in parts:
        translated = translations.get(part.strip(), part.strip())
        translated_parts.append(translated)
    return ' > '.join(translated_parts)

def process_csv():
    with open('products_translated_english.csv', 'r', encoding='utf-8-sig') as infile, \
         open('products_fully_english.csv', 'w', encoding='utf-8', newline='') as outfile:
        reader = csv.DictReader(infile)
        writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
        writer.writeheader()
        
        for row in reader:
            # Translate both Category and Type fields
            category = translate_category(row['Product Category'])
            row['Product Category'] = category
            row['Type'] = category  # Make Type match Category exactly
            writer.writerow(row)

if __name__ == '__main__':
    process_csv()