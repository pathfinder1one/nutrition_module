import json
import sys
import os

sys.path.append("c:/Users/chira/Downloads/nutrition_module")
sys.path.append("c:/Users/chira/Downloads/nutrition_module/backend")

from seed_indian_foods import FOODS
from extra_foods import EXTRA_FOODS

print(f"Base foods count: {len(FOODS)}")
print(f"Extra foods count: {len(EXTRA_FOODS)}")

all_items = []
seen = set()

# Combine both catalogs
for item in FOODS + EXTRA_FOODS:
    name, unit, kcal, p, c, f, region, cat, diet, aliases = item
    norm = name.strip().lower()
    if norm in seen:
        continue
    seen.add(norm)
    all_items.append({
        "id": f"food_{len(all_items) + 1}",
        "name": name,
        "servingUnit": unit,
        "calories": kcal,
        "proteinG": float(p),
        "carbsG": float(c),
        "fatsG": float(f),
        "region": region,
        "category": cat,
        "dietType": diet,
        "aliases": aliases
    })

print(f"Total deduplicated foods: {len(all_items)}")

# Group by category
categories = {}
for i in all_items:
    c = i["category"]
    categories[c] = categories.get(c, 0) + 1

print("Categories breakdown:", categories)

# Write to TypeScript file for frontend
out_path = "c:/Users/chira/Downloads/nutrition_module/healthplus-main/frontend/src/data/indianFoodCatalog.ts"
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with open(out_path, "w", encoding="utf-8") as f:
    f.write("// Auto-generated 500+ Comprehensive Indian Foods, Ingredients, Vegetables, Fruits, Sauces, Snacks, Combos & Drinks Catalog\n\n")
    f.write("export interface CatalogFoodItem {\n")
    f.write("  id: string;\n")
    f.write("  name: string;\n")
    f.write("  servingUnit: string;\n")
    f.write("  calories: number;\n")
    f.write("  proteinG: number;\n")
    f.write("  carbsG: number;\n")
    f.write("  fatsG: number;\n")
    f.write("  region: string;\n")
    f.write("  category: string;\n")
    f.write("  dietType: 'veg' | 'vegan' | 'non-veg';\n")
    f.write("  aliases: string[];\n")
    f.write("}\n\n")
    f.write("export const INDIAN_FOOD_CATALOG: CatalogFoodItem[] = ")
    f.write(json.dumps(all_items, indent=2, ensure_ascii=False))
    f.write(";\n")

print(f"Successfully wrote {len(all_items)} foods to {out_path}!")

