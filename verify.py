import csv
from collections import Counter

categories = Counter()

with open('products_final.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        categories[row['Product Category']] += 1

with open('final_categories.txt', 'w', encoding='utf-8') as f:
    for cat, count in sorted(categories.items()):
        f.write(f"{cat}: {count}\n")
