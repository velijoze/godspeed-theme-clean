import csv

in_path = "products_final.csv"
out_path = "products_for_shopify.csv"

with open(in_path, "r", encoding="utf-8-sig", newline="") as f_in, \
     open(out_path, "w", encoding="utf-8", newline="") as f_out:
    reader = csv.DictReader(f_in)
    fieldnames = reader.fieldnames
    writer = csv.DictWriter(f_out, fieldnames=fieldnames)
    writer.writeheader()

    for row in reader:
        # Clear Shopify's Product Category so import doesn't reject non-taxonomy values
        row["Product Category"] = ""
        writer.writerow(row)

print(f"Wrote {out_path} with Product Category cleared for Shopify import.")
