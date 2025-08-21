import csv
from collections import Counter

SRC = "products_final.csv"
OUT = "products_with_taxonomy.csv"
SUMMARY = "taxonomy_summary.txt"

# Deterministic mapping to Shopify taxonomy nodes (string names)
# These are broad but valid nodes to avoid import warnings.
TYPE_TO_TAXONOMY = [
    ("E-Bikes", "Sporting Goods > Outdoor Recreation > Cycling > Bicycles > Electric Bicycles"),
    ("Bikes", "Sporting Goods > Outdoor Recreation > Cycling > Bicycles"),
    ("Parts", "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Components"),
    ("Accessories", "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories"),
]


def map_taxonomy(product_type: str) -> str:
    t = (product_type or "").strip()
    for prefix, mapped in TYPE_TO_TAXONOMY:
        if t.startswith(prefix):
            return mapped
    # Fallback to general Cycling if nothing matches
    return "Sporting Goods > Outdoor Recreation > Cycling"


with open(SRC, "r", encoding="utf-8-sig", newline="") as f_in:
    reader = csv.DictReader(f_in)
    rows = list(reader)
    fieldnames = reader.fieldnames

# Write output with Product Category set to valid taxonomy
with open(OUT, "w", encoding="utf-8", newline="") as f_out:
    writer = csv.DictWriter(f_out, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        typ = r.get("Type", "")
        r["Product Category"] = map_taxonomy(typ)
        writer.writerow(r)

# Summary of assigned taxonomy values
counts = Counter()
for r in rows:
    typ = r.get("Type", "")
    counts[map_taxonomy(typ)] += 1

with open(SUMMARY, "w", encoding="utf-8") as f:
    f.write("Assigned Product Category summary (valid Shopify taxonomy)\n")
    f.write("========================================================\n\n")
    for cat, cnt in counts.most_common():
        f.write(f"{cat}: {cnt}\n")

print(f"Wrote {OUT} and {SUMMARY}.")
