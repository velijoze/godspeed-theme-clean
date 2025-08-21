import csv
import re
from collections import Counter, defaultdict

# Terms to translate at the token/segment level (substring-safe)
SEGMENT_TRANSLATIONS = {
	# Main group names
	"Zubehör": "Accessories",
	"Teile": "Parts",
	"E-bike": "E-Bikes",

	# Accessories
	"Anhänger": "Trailers",
	"Bekleidung": "Clothing",
	"Bikeschuhe": "Bike Shoes",
	"Calze": "Socks",
	"Handschuhe": "Gloves",
	"Hosen": "Pants",
	"Jacke": "Jacket",
	"MTB Schutz": "MTB Protection",
	"Rucksäcke": "Backpacks",
	"Rücksäcke": "Backpacks",
	"Schutzbrille": "Goggles",
	"Shorts": "Shorts",
	"Technisches t-shirt": "Technical T-shirt",
	"Bambini": "Kids",
	"Mentoniera": "Full Face",
	"Körbe": "Baskets",
	"Pumpen": "Pumps",
	"Schlösser": "Locks",
	"Spiegel": "Mirrors",
	"Ständer": "Stands",
	"Gepäckträger": "Luggage Racks",
	"Handy": "Phone Mounts",
	"Caricatori": "Chargers",
	"Helme": "Helmets",
	"Helmetsts": "Helmets",

	# Bikes
	"KinderBikes": "Kids Bikes",
	"Mountainbike": "Mountain Bikes",
	"Jugend": "Youth",
	"Fully": "Full Suspension",

	# E-Bikes (subcats)
	"Zoll": "Inch",
	"Gebraucht": "Used",
	"Velo Sale": "Sale",
	"Kompaktes / Faltbares E-bike": "Compact / Foldable E-Bikes",
	"Kompaktes / Faltbares E-Bike": "Compact / Foldable E-Bikes",
	"Kompaktes / Faltbares E-Bikes": "Compact / Foldable E-Bikes",
	"Niedriger Einstieg": "Step-Through",
	"compatta pieghevole": "Compact Folding",
	"compatta & - pieghevole": "Compact Folding",
	"compatta": "Compact",
	"pieghevole": "Folding",
	"Cargo e-bike": "Cargo",
	"E-Bike Cargo": "Cargo",
	"City, Tour & Trekking": "City & Trekking",
	"E-Gravel": "Gravel",

	# Parts
	"Dämpfer & Federgabel": "Suspension",
	"Getriebe und Übersetzung": "Gears and Transmission",
	"Räder": "Wheels",
	"Saddlesstütze": "Seatpost",
	"Velopflege": "Bike Care",
}

# Whole-string replacements (broad structural normalization)
WHOLE_REPLACEMENTS = [
	# Bikes patterns
	(r"^Bikes\s*-\s*Kids.*$", "Bikes > Kids Bikes"),
	(r"^Bikes\s*-\s*Dirt.*$", "Bikes > Dirt Bikes"),
	(r"^Bikes\s*-\s*Mountain.*$", "Bikes > Mountain Bikes"),
	(r"^Bikes\s*-\s*Road.*$", "Bikes > Road Bikes"),

	# E-Bikes patterns
	(r"^E-Bikes\s*-\s*E-?Bike\s*Cargo.*$", "E-Bikes > Cargo"),
	(r"^E-Bikes\s*-\s*E-?MTB\s*Full\s*Suspension.*$", "E-Bikes > Mountain Bikes"),
	(r"^E-Bikes\s*-\s*E-?MTB\s*Hardtail.*$", "E-Bikes > Mountain Bikes"),
	(r"^E-Bikes\s*-\s*E-?bike\s*City,?\s*Tour\s*&\s*Trekking.*$", "E-Bikes > City & Trekking"),
]

# Foreign terms to assert none remain post-normalization (whole-word match)
FOREIGN_TERMS = [
	"Zubehör", "Anhänger", "Bekleidung", "Bikeschuhe", "Calze", "Handschuhe", "Hosen",
	"Jacke", "MTB Schutz", "Rucksäcke", "Rücksäcke", "Schutzbrille", "Mentoniera", "Körbe",
	"Pumpen", "Schlösser", "Spiegel", "Ständer", "Gepäckträger", "Handy", "Caricatori",
	"KinderBikes", "Mountainbike", "Jugend", "Zoll", "Gebraucht", "Velo Sale",
	"Kompaktes", "Faltbares", "Niedriger Einstieg", "compatta", "pieghevole",
	"Dämpfer", "Getriebe", "Übersetzung", "Räder", "Saddlesstütze", "Velopflege"
]

ASCII_ALLOWED = set(chr(c) for c in range(32, 127)) | {"\t", "\n", "\r"}


def normalize_category(raw: str) -> str:
	if not raw:
		return raw
	value = raw.replace(" - ", " > ")
	value = re.sub(r"\s+", " ", value).strip()

	# Whole-string structural replacements
	for pattern, replacement in WHOLE_REPLACEMENTS:
		if re.match(pattern, value, flags=re.IGNORECASE):
			value = replacement
			break

	# Segment translations with substring replacements
	segments = [seg.strip() for seg in value.split(" > ")]
	translated_segments = []
	for seg in segments:
		for src, dst in SEGMENT_TRANSLATIONS.items():
			if src in seg:
				seg = seg.replace(src, dst)
		translated_segments.append(seg)
	value = " > ".join(translated_segments)

	# If first segment contains E-Bikes variants, normalize main/sub structure
	parts = [p.strip() for p in value.split(" > ") if p.strip()]
	if parts:
		if parts[0].lower().startswith("e-bikes") or parts[0].lower().startswith("e-bike"):
			parts[0] = "E-Bikes"
			if len(parts) > 1 and parts[1].lower().startswith("e-bikes"):
				parts[1] = parts[1].replace("E-Bikes ", "").replace("E-bikes ", "").replace("E-bike ", "").strip()
		value = " > ".join(parts)

	# Final tidy
	value = value.replace("&amp;", "&")
	value = re.sub(r"\s+", " ", value).strip()
	return value


def run():
	in_path = "products_translated_english.csv"
	out_path = "products_final.csv"
	report_path = "verification_report.txt"

	with open(in_path, "r", encoding="utf-8-sig", newline="") as f_in, \
		 open(out_path, "w", encoding="utf-8", newline="") as f_out:
		reader = csv.DictReader(f_in)
		writer = csv.DictWriter(f_out, fieldnames=reader.fieldnames)
		writer.writeheader()

		for row in reader:
			cat = normalize_category(row.get("Product Category", ""))
			row["Product Category"] = cat
			row["Type"] = cat
			writer.writerow(row)

	# Verification
	non_ascii_rows = 0
	mismatched_type = 0
	foreign_hits = Counter()
	main_counts = defaultdict(Counter)

	with open(out_path, "r", encoding="utf-8", newline="") as f:
		reader = csv.DictReader(f)
		for row in reader:
			cat = row.get("Product Category", "")
			typ = row.get("Type", "")

			# Type matches Category
			if cat != typ:
				mismatched_type += 1

			# Non-ASCII detection
			if any(ch not in ASCII_ALLOWED for ch in cat):
				non_ascii_rows += 1

			# Foreign term detection with whole-word regex
			for term in FOREIGN_TERMS:
				if re.search(rf"\b{re.escape(term)}\b", cat):
					foreign_hits[term] += 1

			# Main/subcategory counts
			parts = [p.strip() for p in cat.split(" > ") if p.strip()]
			if parts:
				main = parts[0]
				sub = parts[1] if len(parts) > 1 else "(No subcategory)"
				main_counts[main][sub] += 1

	with open(report_path, "w", encoding="utf-8") as r:
		r.write("One-Pass Category Normalization Report\n")
		r.write("====================================\n\n")
		r.write(f"Type equals Category mismatches: {mismatched_type}\n")
		r.write(f"Rows with non-ASCII in Category: {non_ascii_rows}\n")
		r.write("Remaining foreign terms (should be empty):\n")
		for term, cnt in sorted(foreign_hits.items(), key=lambda x: (-x[1], x[0])):
			r.write(f"- {term}: {cnt}\n")
		if not foreign_hits:
			r.write("- None\n")
		r.write("\nCategory overview:\n")
		for main, subs in sorted(main_counts.items()):
			total = sum(subs.values())
			r.write(f"{main} (Total: {total})\n")
			for sub, cnt in sorted(subs.items()):
				r.write(f"  - {sub}: {cnt}\n")

if __name__ == "__main__":
	run()
