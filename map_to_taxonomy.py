import csv
import io
import os
import re
import sys
import urllib.request
from collections import Counter

TAXONOMY_URLS = [
	"https://raw.githubusercontent.com/Shopify/product-taxonomy/main/data/taxonomy_with_ids.csv",
	"https://raw.githubusercontent.com/Shopify/product-taxonomy/main/data/taxonomy.csv",
	"https://raw.githubusercontent.com/Shopify/product-taxonomy/master/data/taxonomy_with_ids.csv",
	"https://raw.githubusercontent.com/Shopify/product-taxonomy/master/data/taxonomy.csv",
]
SRC_PRIMARY = "products_final.csv"
SRC_FALLBACK = "products_translated_english.csv"
MAP_REPORT = "shopify_taxonomy_mapping.csv"
OUT_CSV = "products_with_taxonomy.csv"

# Prefer products_final.csv; fallback to products_translated_english.csv
SRC_PATH = SRC_PRIMARY if os.path.exists(SRC_PRIMARY) else SRC_FALLBACK
if not os.path.exists(SRC_PATH):
	print("Source CSV not found.")
	sys.exit(1)

print("Downloading Shopify taxonomy…")
last_err = None
data = None
for url in TAXONOMY_URLS:
	try:
		with urllib.request.urlopen(url) as resp:
			data = resp.read().decode("utf-8", errors="replace")
			print(f"Loaded taxonomy from: {url}")
			break
	except Exception as e:
		last_err = e
		continue

if not data:
	print("Failed to download Shopify taxonomy:", last_err)
	sys.exit(1)

reader = csv.DictReader(io.StringIO(data))
taxonomy = []
for row in reader:
	full_name = row.get("full_name") or row.get("name") or ""
	if not full_name:
		continue
	taxonomy.append({
		"id": row.get("id", ""),
		"full_name": full_name,
		"tokens": set(re.findall(r"[a-z0-9]+", full_name.lower()))
	})

if not taxonomy:
	print("Failed to parse Shopify taxonomy.")
	sys.exit(1)

print(f"Reading source: {SRC_PATH}")
with open(SRC_PATH, "r", encoding="utf-8-sig", newline="") as f:
	reader = csv.DictReader(f)
	rows = list(reader)
	fieldnames = reader.fieldnames

# Collect unique categories
unique_cats = Counter()
for r in rows:
	c = (r.get("Product Category") or "").strip()
	unique_cats[c] += 1

# Token-overlap score + small bias for bike-related nodes
preferred = {"bike","bikes","bicycle","bicycles","cycling","helmet","helmets","light","lights","bag","bags","brake","pedal","wheel","seatpost","saddle","grip","handlebar","trainer","rollers","ebike","e-bikes","electric"}

def score(cat_str, node):
	cat_tokens = set(re.findall(r"[a-z0-9]+", cat_str.lower()))
	if not cat_tokens:
		return 0.0
	inter = cat_tokens & node["tokens"]
	base = (len(inter) / len(cat_tokens)) + (len(inter) / (len(node["tokens"]) or 1))
	bias = 0.15 if (node["tokens"] & preferred) else 0.0
	return base + bias

# Manual nudges for common cycling categories (map substrings)
MANUAL_HINTS = {
	"Accessories > Bags": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Bags",
	"Accessories > Bottles": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Water Bottles",
	"Accessories > Helmets": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Helmets",
	"Accessories > Lights": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Lights",
	"Accessories > Locks": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Locks",
	"Accessories > Pumps": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Pumps",
	"Accessories > Phone Mounts": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Phone Mounts",
	"Accessories > Tools": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Maintenance",
	"Accessories > Trailers": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Trailers",
	"Accessories > Child Seats": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Child Bicycle Seats",
	"Parts > Wheels": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Components > Bicycle Wheels",
	"Parts > Handlebars": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Components > Bicycle Handlebars",
	"Parts > Pedals": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Components > Bicycle Pedals",
	"Parts > Brakes": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Components > Bicycle Brakes",
	"Parts > Gears and Transmission": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Components > Bicycle Drivetrain Components",
	"Parts > Seatpost": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Components > Bicycle Seatposts",
	"Parts > Saddles": "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Components > Bicycle Saddles",
	"E-Bikes": "Sporting Goods > Outdoor Recreation > Cycling > Bicycles > Electric Bicycles",
	"Bikes > Road": "Sporting Goods > Outdoor Recreation > Cycling > Bicycles > Road Bicycles",
	"Bikes > Mountain": "Sporting Goods > Outdoor Recreation > Cycling > Bicycles > Mountain Bicycles",
	"Bikes > Gravel": "Sporting Goods > Outdoor Recreation > Cycling > Bicycles > Gravel Bicycles",
}

# Build a lookup from full_name to node for hints
name_to_node = {n["full_name"]: n for n in taxonomy}

mapping = {}
for cat, cnt in unique_cats.items():
	if not cat:
		mapping[cat] = {"mapped_name": "", "id": "", "score": 0.0, "method": "empty"}
		continue
	# Manual hint first (substring match)
	hint_match = None
	for key, target_name in MANUAL_HINTS.items():
		if key.lower() in cat.lower():
			hint_match = name_to_node.get(target_name)
			break
	best = None
	best_score = -1.0
	if hint_match:
		best = hint_match
		best_score = 1.0
	else:
		for node in taxonomy:
			s = score(cat, node)
			if s > best_score:
				best = node
				best_score = s
	mapping[cat] = {
		"mapped_name": best["full_name"],
		"id": best["id"],
		"score": round(best_score, 3),
		"method": "hint" if hint_match else "auto"
	}

# Write mapping report
with open(MAP_REPORT, "w", encoding="utf-8", newline="") as f:
	w = csv.writer(f)
	w.writerow(["original_category", "count", "mapped_full_name", "taxonomy_id", "match_score", "method"])
	for cat, cnt in unique_cats.most_common():
		m = mapping[cat]
		w.writerow([cat, cnt, m["mapped_name"], m["id"], m["score"], m["method"]])

# Produce Shopify-ready CSV: keep Type, set Product Category to mapped_full_name
with open(OUT_CSV, "w", encoding="utf-8", newline="") as f:
	writer = csv.DictWriter(f, fieldnames=fieldnames)
	writer.writeheader()
	for r in rows:
		src_cat = (r.get("Product Category") or "").strip()
		mapped = mapping.get(src_cat, {"mapped_name": ""})["mapped_name"]
		r["Product Category"] = mapped
		writer.writerow(r)

print("Wrote:", OUT_CSV)
print("Wrote:", MAP_REPORT)
