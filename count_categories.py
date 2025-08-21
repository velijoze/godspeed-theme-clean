import csv
from collections import Counter, defaultdict

def count_categories():
    categories = Counter()
    main_categories = defaultdict(Counter)

    with open('products_clean_english.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            category = row['Product Category']
            if category:
                categories[category] += 1
                parts = category.split(' > ')
                if len(parts) > 1:
                    main_categories[parts[0]][parts[1]] += 1
                else:
                    main_categories[parts[0]]['(No subcategory)'] += 1

    with open('clean_category_summary.txt', 'w', encoding='utf-8') as f:
        f.write("Clean Category Structure Summary\n")
        f.write("============================\n\n")
        
        for main_cat, subcats in sorted(main_categories.items()):
            total = sum(subcats.values())
            f.write(f"{main_cat} (Total: {total})\n")
            for subcat, count in sorted(subcats.items()):
                f.write(f"  └─ {subcat} ({count})\n")
            f.write("\n")

if __name__ == '__main__':
    count_categories()