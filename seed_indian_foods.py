"""
Seed public.indian_food_nutrition with 250+ comprehensive foods:
every vegetable (raw & sabzis), sauces, chutneys, fruits, breads, rice & biryanis,
dals & curries, breakfast items, snacks & chaat, non-veg, drinks & beverages, and sweets.
Real 384-d embeddings (BAAI/bge-small-en-v1.5 via fastembed).

Usage:
    python seed_indian_foods.py
"""
import os
import sys

from dotenv import load_dotenv
from fastembed import TextEmbedding
from supabase import create_client

load_dotenv()
# Also check backend/.env
backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)

EMBED_MODEL = "BAAI/bge-small-en-v1.5"

# Format: (food_name, serving_unit, kcal, protein_g, carbs_g, fats_g, region, category, diet_type, aliases)
FOODS = [
    # =========================================================================
    # 1. BREADS, ROTIS & GRAINS
    # =========================================================================
    ("Roti", "1 piece (40g)", 104, 3.1, 18.0, 2.5, "Pan-Indian", "bread", "veg", ["chapati", "phulka", "rotli", "fulka"]),
    ("Butter Roti", "1 piece (45g)", 140, 3.2, 18.0, 6.0, "North", "bread", "veg", ["tandoori roti butter", "ghee roti", "butter chapati"]),
    ("Tandoori Roti", "1 piece (50g)", 125, 3.8, 23.0, 1.8, "North", "bread", "vegan", ["plain tandoori roti", "khameeri roti"]),
    ("Rumali Roti", "1 piece (50g)", 135, 3.5, 25.0, 2.0, "North", "bread", "veg", ["roomali roti"]),
    ("Plain Paratha", "1 piece (60g)", 190, 4.0, 26.0, 8.0, "North", "bread", "veg", ["paratha", "parantha", "sadha paratha", "tava paratha"]),
    ("Aloo Paratha", "1 piece (100g)", 260, 5.5, 36.0, 10.5, "Punjab", "bread", "veg", ["aloo parantha", "potato paratha"]),
    ("Gobhi Paratha", "1 piece (100g)", 240, 5.5, 33.0, 9.5, "Punjab", "bread", "veg", ["cauliflower paratha", "gobi parantha"]),
    ("Paneer Paratha", "1 piece (100g)", 290, 10.0, 31.0, 14.0, "Punjab", "bread", "veg", ["paneer parantha", "cottage cheese paratha"]),
    ("Methi Paratha", "1 piece (80g)", 210, 4.8, 28.0, 8.5, "North", "bread", "veg", ["fenugreek paratha", "methi parantha"]),
    ("Mooli Paratha", "1 piece (90g)", 220, 4.5, 30.0, 9.0, "Punjab", "bread", "veg", ["radish paratha", "mooli parantha"]),
    ("Pyaaz Paratha", "1 piece (90g)", 230, 4.5, 31.0, 9.5, "North", "bread", "veg", ["onion paratha", "pyaz parantha"]),
    ("Laccha Paratha", "1 piece (80g)", 280, 5.0, 34.0, 13.5, "North", "bread", "veg", ["layered paratha", "lachha parantha"]),
    ("Sattu Paratha", "1 piece (100g)", 280, 9.0, 36.0, 11.0, "Bihar", "bread", "veg", ["sattu parantha", "chana sattu roti"]),
    ("Naan", "1 piece (90g)", 262, 8.7, 45.0, 5.1, "North", "bread", "veg", ["plain naan", "tandoori naan"]),
    ("Butter Naan", "1 piece (100g)", 310, 9.0, 46.0, 10.0, "North", "bread", "veg", ["makhan naan"]),
    ("Garlic Naan", "1 piece (100g)", 295, 8.8, 45.0, 9.0, "North", "bread", "veg", ["lasun naan", "lehsun naan"]),
    ("Puri", "1 piece (30g)", 101, 1.9, 12.0, 5.2, "Pan-Indian", "bread", "veg", ["poori", "taleli puri"]),
    ("Bhatura", "1 piece (80g)", 250, 5.5, 33.0, 10.5, "Punjab", "bread", "veg", ["bature", "chole bhature bhatura"]),
    ("Thepla", "1 piece (45g)", 120, 3.5, 17.0, 4.5, "Gujarat", "bread", "veg", ["methi thepla", "gujarati thepla"]),
    ("Bajra Roti", "1 piece (50g)", 130, 3.8, 24.0, 2.5, "Rajasthan", "bread", "vegan", ["bajre ki roti", "pearl millet roti", "bajra bhakri"]),
    ("Jowar Roti", "1 piece (45g)", 115, 3.3, 22.0, 1.5, "Maharashtra", "bread", "vegan", ["jwari bhakri", "sorghum roti", "jowar bhakri"]),
    ("Makki ki Roti", "1 piece (60g)", 180, 3.5, 30.0, 5.0, "Punjab", "bread", "veg", ["cornmeal flatbread", "makke di roti"]),
    ("Missi Roti", "1 piece (50g)", 135, 5.0, 21.0, 3.5, "Punjab", "bread", "veg", ["besan roti", "chana flour roti"]),
    ("Ragi Roti", "1 piece (50g)", 125, 3.0, 25.0, 1.5, "South", "bread", "vegan", ["finger millet roti", "ragi bhakri"]),
    ("Amritsari Kulcha", "1 piece (120g)", 320, 7.5, 45.0, 12.0, "Punjab", "bread", "veg", ["stuffed kulcha", "aloo kulcha"]),
    ("Plain Kulcha", "1 piece (70g)", 190, 5.0, 34.0, 3.5, "North", "bread", "veg", ["kulche"]),
    ("Pav", "1 piece (40g)", 110, 3.2, 22.0, 1.0, "Maharashtra", "bread", "vegan", ["ladi pav", "bun"]),

    # =========================================================================
    # 2. RICE, BIRYANIS, PULAO & COMBOS
    # =========================================================================
    ("Steamed Rice", "1 katori (150g cooked)", 195, 4.0, 43.0, 0.4, "Pan-Indian", "rice", "vegan", ["chawal", "plain rice", "white rice", "bhaat", "boiled rice"]),
    ("Brown Rice", "1 katori (150g cooked)", 170, 3.8, 35.0, 1.6, "Modern", "rice", "vegan", ["brown chawal", "unpolished rice"]),
    ("Jeera Rice", "1 katori (150g)", 225, 4.2, 42.0, 4.5, "North", "rice", "veg", ["cumin rice", "zeera rice"]),
    ("Matar Pulao", "1 katori (150g)", 235, 5.2, 42.0, 5.0, "North", "rice", "veg", ["peas pulao", "mutter pulav"]),
    ("Veg Pulao", "1 katori (150g)", 230, 4.5, 40.0, 5.5, "North", "rice", "veg", ["vegetable pulao", "pulav", "tava pulao"]),
    ("Vegetable Biryani", "1 plate (250g)", 400, 8.5, 62.0, 13.0, "Hyderabad", "rice", "veg", ["veg biryani", "dum veg biryani"]),
    ("Paneer Biryani", "1 plate (250g)", 440, 14.0, 58.0, 16.0, "North", "rice", "veg", ["cottage cheese biryani"]),
    ("Chicken Biryani", "1 plate (300g)", 490, 24.0, 58.0, 16.0, "Hyderabad", "rice", "non-veg", ["murgh biryani", "hyderabadi chicken biryani"]),
    ("Mutton Biryani", "1 plate (300g)", 560, 26.0, 56.0, 24.0, "Hyderabad", "rice", "non-veg", ["gosht biryani"]),
    ("Egg Biryani", "1 plate (250g)", 420, 16.0, 55.0, 14.0, "Pan-Indian", "rice", "non-veg", ["anda biryani"]),
    ("Khichdi", "1 katori (200g)", 210, 7.5, 36.0, 4.0, "Pan-Indian", "rice", "veg", ["dal khichdi", "moong khichdi", "khichuri"]),
    ("Curd Rice", "1 katori (200g)", 220, 6.0, 34.0, 6.5, "South", "rice", "veg", ["dahi chawal", "thayir sadam", "daddojanam"]),
    ("Lemon Rice", "1 katori (150g)", 230, 4.0, 40.0, 6.0, "South", "rice", "vegan", ["chitranna", "nimbu chawal"]),
    ("Tamarind Rice", "1 katori (150g)", 240, 4.0, 42.0, 6.5, "South", "rice", "vegan", ["puliyodharai", "imli rice", "pulihora"]),
    ("Tomato Rice", "1 katori (150g)", 215, 3.8, 38.0, 5.5, "South", "rice", "vegan", ["thakkali sadam"]),
    ("Sambar Rice", "1 plate (250g)", 310, 8.5, 52.0, 7.0, "South", "rice", "vegan", ["sambar sadam", "bisibelebath"]),
    ("Rajma Chawal", "1 plate (300g)", 420, 14.0, 70.0, 8.0, "Punjab", "rice", "veg", ["rajma rice", "rajma chawal combo"]),
    ("Chole Chawal", "1 plate (300g)", 440, 13.5, 72.0, 10.0, "Punjab", "rice", "veg", ["chhole rice", "chana chawal"]),
    ("Kadhi Chawal", "1 plate (300g)", 380, 10.0, 60.0, 10.0, "North", "rice", "veg", ["kadhi rice", "kadhi chawal combo"]),
    ("Dal Chawal", "1 plate (300g)", 360, 12.0, 65.0, 5.5, "Pan-Indian", "rice", "veg", ["dal rice", "dal bhat"]),

    # =========================================================================
    # 3. DALS, LEGUMES & CURRIES
    # =========================================================================
    ("Dal Tadka", "1 katori (150g)", 160, 8.5, 22.0, 4.5, "North", "dal", "veg", ["tadka dal", "arhar dal", "toor dal", "tuvar dal"]),
    ("Dal Fry", "1 katori (150g)", 170, 8.0, 21.0, 6.0, "North", "dal", "veg", ["dal fry"]),
    ("Moong Dal", "1 katori (150g)", 140, 9.0, 20.0, 2.5, "Pan-Indian", "dal", "vegan", ["yellow moong dal", "moong ki dal", "peeli dal"]),
    ("Green Moong Dal", "1 katori (150g)", 145, 9.5, 21.0, 2.5, "Pan-Indian", "dal", "vegan", ["hari moong dal", "chilka moong dal"]),
    ("Masoor Dal", "1 katori (150g)", 150, 9.5, 22.0, 2.5, "Pan-Indian", "dal", "vegan", ["red lentil dal", "laal masoor"]),
    ("Chana Dal", "1 katori (150g)", 190, 10.0, 28.0, 4.0, "Pan-Indian", "dal", "vegan", ["bengal gram dal", "chana daal"]),
    ("Urad Dal", "1 katori (150g)", 180, 10.5, 26.0, 3.5, "North", "dal", "veg", ["dhuli urad dal", "white urad dal"]),
    ("Dal Makhani", "1 katori (150g)", 230, 9.0, 24.0, 11.0, "Punjab", "dal", "veg", ["maa ki dal", "black dal", "kaali dal"]),
    ("Panchmel Dal", "1 katori (150g)", 185, 10.0, 25.0, 5.0, "Rajasthan", "dal", "veg", ["panchratna dal", "mixed dal"]),
    ("Sambar", "1 katori (150g)", 110, 5.0, 17.0, 2.5, "South", "dal", "vegan", ["sambhar"]),
    ("Rasam", "1 katori (150g)", 60, 2.0, 9.0, 1.8, "South", "dal", "vegan", ["tomato rasam", "pepper rasam"]),
    ("Rajma", "1 katori (150g)", 210, 11.0, 30.0, 5.0, "Punjab", "dal", "vegan", ["rajma masala", "kidney beans curry", "red kidney beans"]),
    ("Chole", "1 katori (150g)", 230, 10.5, 32.0, 7.0, "Punjab", "dal", "vegan", ["chana masala", "chickpea curry", "chhole", "amritsari chole"]),
    ("Kala Chana", "1 katori (150g)", 195, 11.0, 29.0, 4.0, "North", "dal", "vegan", ["black chickpeas curry", "sukha kala chana"]),
    ("Safed Matar Curry", "1 katori (150g)", 180, 9.5, 30.0, 2.5, "North", "dal", "vegan", ["ghugni", "matar chaat base", "white peas curry"]),
    ("Lobia Curry", "1 katori (150g)", 175, 10.0, 27.0, 3.0, "Pan-Indian", "dal", "vegan", ["black eyed peas curry", "chawli curry", "rongi"]),
    ("Kadhi Pakora", "1 katori (150g)", 180, 5.5, 16.0, 10.5, "Punjab", "dal", "veg", ["kadhi", "punjabi kadhi", "besan kadhi"]),
    ("Gujarati Kadhi", "1 katori (150g)", 130, 4.0, 14.0, 6.0, "Gujarat", "dal", "veg", ["sweet kadhi"]),
    ("Sprouts Curry", "1 katori (150g)", 140, 9.0, 20.0, 2.8, "Pan-Indian", "dal", "vegan", ["moong sprouts usal", "misal gravy"]),

    # =========================================================================
    # 4. COOKED SABZI (VEGETABLE DISHES)
    # =========================================================================
    ("Paneer Butter Masala", "1 katori (150g)", 340, 13.0, 12.0, 27.0, "Punjab", "sabzi", "veg", ["paneer makhani", "butter paneer"]),
    ("Palak Paneer", "1 katori (150g)", 260, 13.0, 9.0, 19.0, "Punjab", "sabzi", "veg", ["saag paneer", "spinach paneer"]),
    ("Matar Paneer", "1 katori (150g)", 270, 12.5, 14.0, 18.0, "Punjab", "sabzi", "veg", ["mutter paneer", "peas and paneer"]),
    ("Kadai Paneer", "1 katori (150g)", 280, 13.0, 10.0, 21.0, "Punjab", "sabzi", "veg", ["kadhai paneer", "karahi paneer"]),
    ("Shahi Paneer", "1 katori (150g)", 320, 11.5, 13.0, 25.0, "North", "sabzi", "veg", ["royal cottage cheese"]),
    ("Paneer Bhurji", "1 katori (100g)", 250, 14.0, 6.0, 19.0, "Punjab", "sabzi", "veg", ["scrambled paneer"]),
    ("Paneer Tikka Masala", "1 katori (150g)", 310, 14.0, 11.0, 23.0, "North", "sabzi", "veg", ["grilled paneer curry"]),
    ("Aloo Gobi", "1 katori (150g)", 150, 3.5, 18.0, 7.0, "North", "sabzi", "vegan", ["aloo gobhi", "potato cauliflower sabzi"]),
    ("Aloo Jeera", "1 katori (150g)", 170, 3.0, 25.0, 7.0, "North", "sabzi", "vegan", ["jeera aloo", "cumin potatoes"]),
    ("Aloo Matar", "1 katori (150g)", 165, 4.0, 22.0, 6.5, "North", "sabzi", "vegan", ["aloo mutter", "potato peas curry"]),
    ("Aloo Methi", "1 katori (150g)", 155, 3.8, 19.0, 7.0, "North", "sabzi", "vegan", ["potatoes with fenugreek leaves"]),
    ("Aloo Shimla Mirch", "1 katori (150g)", 145, 3.2, 18.0, 6.5, "North", "sabzi", "vegan", ["potato capsicum sabzi", "aloo bell pepper"]),
    ("Dum Aloo", "1 katori (150g)", 220, 3.5, 26.0, 11.5, "Kashmir/North", "sabzi", "veg", ["kashmiri dum aloo", "banarasi dum aloo"]),
    ("Bhindi Masala", "1 katori (120g)", 120, 3.0, 11.0, 7.5, "North", "sabzi", "vegan", ["bhindi fry", "okra sabzi", "lady finger"]),
    ("Kurkuri Bhindi", "1 katori (80g)", 160, 3.5, 14.0, 10.0, "North", "sabzi", "vegan", ["crispy okra"]),
    ("Baingan Bharta", "1 katori (150g)", 130, 3.0, 12.0, 8.0, "Punjab", "sabzi", "vegan", ["brinjal bharta", "roasted eggplant mash", "vangyache bharit"]),
    ("Aloo Baingan", "1 katori (150g)", 140, 2.8, 18.0, 6.5, "North", "sabzi", "vegan", ["potato eggplant curry"]),
    ("Mixed Veg Curry", "1 katori (150g)", 130, 3.5, 14.0, 6.5, "Pan-Indian", "sabzi", "vegan", ["mix veg", "sabzi", "sabji"]),
    ("Lauki Sabzi", "1 katori (150g)", 80, 2.0, 9.0, 4.0, "North", "sabzi", "vegan", ["dudhi sabzi", "bottle gourd curry", "ghiya sabzi"]),
    ("Lauki Kofta", "1 katori (150g)", 210, 4.5, 18.0, 13.5, "North", "sabzi", "veg", ["bottle gourd dumplings curry"]),
    ("Turai Sabzi", "1 katori (150g)", 75, 1.8, 8.0, 4.0, "North", "sabzi", "vegan", ["ridge gourd curry", "tori sabji", "peerkangai"]),
    ("Tinda Sabzi", "1 katori (150g)", 90, 2.5, 10.0, 4.5, "North", "sabzi", "vegan", ["tinda masala", "apple gourd"]),
    ("Karela Sabzi", "1 katori (120g)", 110, 2.5, 12.0, 6.0, "North", "sabzi", "vegan", ["bitter gourd fry", "karela fry", "bharwa karela"]),
    ("Parwal Sabzi", "1 katori (120g)", 105, 2.2, 11.0, 5.5, "North/East", "sabzi", "vegan", ["pointed gourd curry", "potol"]),
    ("Arbi Masala", "1 katori (120g)", 160, 2.5, 24.0, 6.5, "North", "sabzi", "vegan", ["colocasia fry", "arbi fry", "taro root"]),
    ("Sarson ka Saag", "1 katori (150g)", 140, 4.5, 11.0, 8.5, "Punjab", "sabzi", "veg", ["mustard greens saag", "saag"]),
    ("Palak Corn", "1 katori (150g)", 160, 4.5, 18.0, 8.0, "North", "sabzi", "veg", ["spinach and sweet corn curry"]),
    ("Soya Chunks Curry", "1 katori (150g)", 190, 20.0, 14.0, 6.5, "Pan-Indian", "sabzi", "vegan", ["soya chaap", "soya nuggets curry", "meal maker"]),
    ("Soya Chaap Masala", "1 katori (150g)", 240, 15.0, 18.0, 12.0, "Delhi", "sabzi", "veg", ["tandoori chaap gravy"]),
    ("Mushroom Masala", "1 katori (150g)", 150, 5.0, 10.0, 10.0, "North", "sabzi", "vegan", ["mushroom curry", "khumbh masala"]),
    ("Matar Mushroom", "1 katori (150g)", 165, 6.0, 14.0, 9.0, "North", "sabzi", "vegan", ["peas and mushroom curry"]),
    ("Sev Tamatar", "1 katori (120g)", 210, 4.5, 20.0, 12.5, "Gujarat/MP", "sabzi", "veg", ["sev tameta nu shaak", "sev tomato sabzi"]),
    ("Gatta Curry", "1 katori (150g)", 220, 7.5, 19.0, 12.0, "Rajasthan", "sabzi", "veg", ["gatte ki sabzi", "besan gatta"]),
    ("Malai Kofta", "1 katori (150g)", 360, 7.0, 24.0, 26.0, "North", "sabzi", "veg", ["cottage cheese dumplings in rich gravy"]),
    ("Methi Matar Malai", "1 katori (150g)", 290, 6.5, 18.0, 21.0, "North", "sabzi", "veg", ["fenugreek peas creamy curry"]),
    ("Cabbage Sabzi", "1 katori (120g)", 95, 2.0, 10.0, 5.0, "Pan-Indian", "sabzi", "vegan", ["patta gobhi sabzi", "bandha gobi"]),
    ("Capsicum Besan", "1 katori (120g)", 135, 4.5, 13.0, 7.5, "Maharashtra/Gujarat", "sabzi", "vegan", ["shimla mirch besan", "bharwan mirch"]),
    ("Gajar Matar", "1 katori (120g)", 105, 2.5, 16.0, 3.5, "North", "sabzi", "vegan", ["carrot peas dry sabzi"]),

    # =========================================================================
    # 5. RAW VEGETABLES & SALADS
    # =========================================================================
    ("Cucumber", "1 medium (100g)", 15, 0.7, 3.6, 0.1, "Pan-Indian", "vegetable", "vegan", ["kheera", "kakdi"]),
    ("Tomato", "1 medium (100g)", 18, 0.9, 3.9, 0.2, "Pan-Indian", "vegetable", "vegan", ["tamatar", "raw tomato"]),
    ("Onion", "1 medium (80g)", 32, 0.9, 7.4, 0.1, "Pan-Indian", "vegetable", "vegan", ["pyaaz", "kanda", "raw onion"]),
    ("Carrot", "1 medium (80g)", 33, 0.8, 7.7, 0.2, "Pan-Indian", "vegetable", "vegan", ["gajar", "raw carrot"]),
    ("Radish", "1 medium (100g)", 16, 0.7, 3.4, 0.1, "Pan-Indian", "vegetable", "vegan", ["mooli", "white radish", "daikon"]),
    ("Beetroot", "1 medium (100g)", 43, 1.6, 9.6, 0.2, "Pan-Indian", "vegetable", "vegan", ["chukandar", "raw beetroot"]),
    ("Green Salad", "1 plate (100g)", 25, 1.2, 5.0, 0.2, "Pan-Indian", "vegetable", "vegan", ["kachumber", "salad", "cucumber tomato salad", "sirka salad"]),
    ("Boiled Potato", "1 medium (100g)", 87, 1.9, 20.0, 0.1, "Pan-Indian", "vegetable", "vegan", ["ubla aloo", "boiled aloo"]),
    ("Boiled Sweet Potato", "1 medium (100g)", 86, 1.6, 20.1, 0.1, "Pan-Indian", "vegetable", "vegan", ["shakarkandi", "sweet potato chaat"]),
    ("Sprouts Salad", "1 katori (100g)", 105, 7.5, 16.0, 1.5, "Pan-Indian", "vegetable", "vegan", ["moong sprouts", "sprouts chaat", "raw sprouts"]),
    ("Spinach (Raw)", "1 cup (30g)", 7, 0.9, 1.1, 0.1, "Pan-Indian", "vegetable", "vegan", ["raw palak", "spinach leaves"]),
    ("Capsicum (Raw)", "1 medium (100g)", 20, 0.9, 4.6, 0.2, "Pan-Indian", "vegetable", "vegan", ["shimla mirch", "green bell pepper"]),
    ("Broccoli", "1 katori florets (90g)", 31, 2.5, 6.0, 0.3, "Modern", "vegetable", "vegan", ["boiled broccoli", "steamed broccoli"]),

    # =========================================================================
    # 6. FRUITS
    # =========================================================================
    ("Apple", "1 medium (150g)", 78, 0.4, 20.0, 0.3, "Pan-Indian", "fruit", "vegan", ["seb", "kashmiri apple"]),
    ("Banana", "1 medium (100g)", 90, 1.1, 23.0, 0.3, "Pan-Indian", "fruit", "vegan", ["kela"]),
    ("Mango", "1 medium (200g)", 120, 1.6, 30.0, 0.8, "Pan-Indian", "fruit", "vegan", ["aam", "alphonso", "dasheri"]),
    ("Papaya", "1 bowl cubed (150g)", 60, 0.7, 15.0, 0.4, "Pan-Indian", "fruit", "vegan", ["papita", "cut papaya"]),
    ("Guava", "1 medium (100g)", 68, 2.6, 14.3, 0.9, "Pan-Indian", "fruit", "vegan", ["amrood", "peru"]),
    ("Orange", "1 medium (130g)", 62, 1.2, 15.4, 0.2, "Pan-Indian", "fruit", "vegan", ["santra", "nagpur santra", "tangerine"]),
    ("Sweet Lime", "1 medium (130g)", 55, 1.0, 13.5, 0.2, "Pan-Indian", "fruit", "vegan", ["mosambi", "mousambi"]),
    ("Pomegranate", "1 bowl seeds (100g)", 83, 1.7, 18.7, 1.2, "Pan-Indian", "fruit", "vegan", ["anar", "anaar dana"]),
    ("Grapes", "1 bowl (100g)", 69, 0.7, 18.1, 0.2, "Pan-Indian", "fruit", "vegan", ["angoor", "green grapes", "black grapes"]),
    ("Watermelon", "1 bowl diced (150g)", 45, 0.9, 11.5, 0.2, "Pan-Indian", "fruit", "vegan", ["tarbooz", "water melon"]),
    ("Muskmelon", "1 bowl diced (150g)", 50, 1.3, 12.0, 0.3, "Pan-Indian", "fruit", "vegan", ["kharbooja", "cantaloupe"]),
    ("Pineapple", "1 bowl diced (150g)", 75, 0.8, 19.5, 0.2, "Pan-Indian", "fruit", "vegan", ["ananas"]),
    ("Chikoo", "1 medium (80g)", 66, 0.4, 16.0, 0.9, "Pan-Indian", "fruit", "vegan", ["sapodilla", "sapota"]),
    ("Kiwi", "1 medium (70g)", 42, 0.8, 10.0, 0.4, "Modern", "fruit", "vegan", ["kiwifruit"]),
    ("Strawberry", "1 cup (150g)", 48, 1.0, 11.7, 0.5, "Modern", "fruit", "vegan", ["strawberries"]),
    ("Pear", "1 medium (150g)", 85, 0.6, 22.5, 0.2, "Pan-Indian", "fruit", "vegan", ["nashpati"]),
    ("Fresh Coconut Meat", "1 piece (30g)", 105, 1.0, 4.5, 10.0, "South/Coastal", "fruit", "vegan", ["nariyal", "raw coconut"]),
    ("Custard Apple", "1 medium (150g)", 110, 2.5, 26.0, 0.5, "Pan-Indian", "fruit", "vegan", ["sitaphal", "sharifa"]),

    # =========================================================================
    # 7. SAUCES, CHUTNEYS, DIPS & CONDIMENTS
    # =========================================================================
    ("Mint Coriander Chutney", "2 tbsp (30g)", 20, 0.8, 3.0, 0.5, "Pan-Indian", "sauce", "vegan", ["green chutney", "hari chutney", "pudina chutney"]),
    ("Sweet Tamarind Chutney", "2 tbsp (30g)", 65, 0.3, 16.0, 0.1, "North", "sauce", "vegan", ["imli chutney", "saunth chutney", "meethi chutney"]),
    ("Coconut Chutney", "2 tbsp (30g)", 70, 0.9, 2.5, 6.5, "South", "sauce", "vegan", ["nariyal chutney", "white chutney"]),
    ("Tomato Chutney", "2 tbsp (30g)", 35, 0.6, 5.5, 1.2, "South", "sauce", "vegan", ["south indian tomato chutney"]),
    ("Garlic Chutney", "1 tbsp (15g)", 45, 0.8, 3.5, 3.0, "Maharashtra/Gujarat", "sauce", "vegan", ["lasun chutney", "vada pav red chutney"]),
    ("Peanut Chutney", "2 tbsp (30g)", 95, 3.5, 3.5, 7.5, "South/Maharashtra", "sauce", "vegan", ["shengdana chutney"]),
    ("Tomato Ketchup", "1 tbsp (15g)", 20, 0.2, 5.0, 0.0, "Modern", "sauce", "vegan", ["ketchup", "sauce"]),
    ("Mayonnaise", "1 tbsp (15g)", 95, 0.2, 1.0, 10.5, "Modern", "sauce", "veg", ["mayo"]),
    ("Mint Mayo", "1 tbsp (15g)", 80, 0.3, 1.5, 8.5, "Modern", "sauce", "veg", ["hari mayo"]),
    ("Schezwan Sauce", "1 tbsp (15g)", 35, 0.4, 4.5, 1.8, "Indo-Chinese", "sauce", "vegan", ["schezwan chutney"]),
    ("Soy Sauce", "1 tbsp (15ml)", 10, 1.3, 1.0, 0.0, "Indo-Chinese", "sauce", "vegan", ["soya sauce"]),
    ("Chilli Sauce", "1 tbsp (15g)", 15, 0.3, 3.5, 0.1, "Indo-Chinese", "sauce", "vegan", ["red chilli sauce", "green chilli sauce"]),
    ("Hummus", "2 tbsp (30g)", 75, 2.4, 6.0, 5.0, "Modern", "sauce", "vegan", ["chickpea dip"]),
    ("Ghee", "1 tsp (5g)", 45, 0.0, 0.0, 5.0, "Pan-Indian", "sauce", "veg", ["desi ghee", "clarified butter"]),
    ("Table Butter", "1 small cube (10g)", 72, 0.1, 0.1, 8.1, "Pan-Indian", "sauce", "veg", ["amul butter", "makhan"]),
    ("Mixed Fruit Jam", "1 tbsp (20g)", 55, 0.1, 14.0, 0.0, "Modern", "sauce", "vegan", ["kissan jam"]),
    ("Pickle (Achar)", "1 tsp (10g)", 25, 0.2, 1.0, 2.2, "Pan-Indian", "sauce", "vegan", ["achar", "mango pickle", "mixed pickle", "nimbu achar"]),
    ("Sirka Pyaaz", "1 small bowl (40g)", 20, 0.4, 4.5, 0.1, "North", "sauce", "vegan", ["vinegar onion", "restaurant pyaz"]),

    # =========================================================================
    # 8. DAIRY & ALTERNATIVES
    # =========================================================================
    ("Dahi", "1 katori (100g)", 61, 3.5, 4.7, 3.3, "Pan-Indian", "dairy", "veg", ["curd", "yogurt", "plain dahi"]),
    ("Greek Yogurt", "1 katori (100g)", 95, 9.0, 4.0, 4.5, "Modern", "dairy", "veg", ["hung curd", "chakka"]),
    ("Sweet Dahi", "1 katori (100g)", 115, 3.2, 18.0, 3.2, "Bengal", "dairy", "veg", ["mishti doi", "sweet curd", "meetha dahi"]),
    ("Raita", "1 katori (100g)", 70, 3.2, 6.0, 3.5, "North", "dairy", "veg", ["boondi raita", "cucumber raita", "mix veg raita"]),
    ("Pineapple Raita", "1 katori (100g)", 90, 2.8, 14.0, 2.5, "North", "dairy", "veg", ["sweet pineapple curd"]),
    ("Milk", "1 glass (200ml)", 124, 6.4, 9.6, 6.6, "Pan-Indian", "dairy", "veg", ["doodh", "full cream milk", "cow milk"]),
    ("Toned Milk", "1 glass (200ml)", 105, 6.2, 9.5, 3.0, "Pan-Indian", "dairy", "veg", ["toned doodh"]),
    ("Skimmed Milk", "1 glass (200ml)", 70, 6.5, 9.8, 0.4, "Pan-Indian", "dairy", "veg", ["double toned milk", "fat free milk"]),
    ("Paneer (raw)", "50g", 133, 9.0, 1.5, 10.0, "Pan-Indian", "dairy", "veg", ["cottage cheese", "fresh paneer"]),
    ("Tofu", "100g", 76, 8.0, 1.9, 4.8, "Modern", "dairy", "vegan", ["soya paneer", "soy bean curd"]),
    ("Soya Milk", "1 glass (200ml)", 90, 7.0, 4.0, 4.0, "Modern", "dairy", "vegan", ["soy milk"]),
    ("Almond Milk", "1 glass (200ml)", 40, 1.5, 1.5, 3.0, "Modern", "dairy", "vegan", ["unsweetened almond milk"]),
    ("Oat Milk", "1 glass (200ml)", 110, 2.5, 18.0, 3.5, "Modern", "dairy", "vegan", ["oats milk"]),
    ("Cheese Slice", "1 slice (20g)", 65, 4.0, 0.5, 5.2, "Modern", "dairy", "veg", ["processed cheese", "amul cheese"]),
    ("Mozzarella Cheese", "30g shredded", 85, 6.5, 1.0, 6.5, "Modern", "dairy", "veg", ["pizza cheese"]),

    # =========================================================================
    # 9. BREAKFAST & SOUTH INDIAN SPECIALTIES
    # =========================================================================
    ("Idli", "1 piece (40g)", 58, 2.0, 12.0, 0.4, "South", "breakfast", "vegan", ["idly", "steamed rice cake"]),
    ("Rava Idli", "1 piece (45g)", 75, 2.2, 12.5, 1.8, "South", "breakfast", "veg", ["sooji idli"]),
    ("Plain Dosa", "1 piece (80g)", 133, 3.0, 22.0, 3.5, "South", "breakfast", "vegan", ["dosa", "sada dosa"]),
    ("Masala Dosa", "1 piece (180g)", 250, 5.5, 38.0, 8.5, "South", "breakfast", "vegan", ["masala dosai", "aloo masala dosa"]),
    ("Mysore Masala Dosa", "1 piece (200g)", 290, 6.0, 40.0, 12.0, "South", "breakfast", "vegan", ["mysore dosa"]),
    ("Rava Dosa", "1 piece (90g)", 170, 3.5, 25.0, 6.5, "South", "breakfast", "veg", ["sooji dosa", "rava onion dosa"]),
    ("Rava Upma", "1 katori (150g)", 215, 5.0, 33.0, 7.0, "South", "breakfast", "veg", ["upma", "suji upma"]),
    ("Semiya Upma", "1 katori (150g)", 205, 4.5, 34.0, 6.0, "South", "breakfast", "veg", ["vermicelli upma"]),
    ("Medu Vada", "1 piece (50g)", 135, 4.5, 14.0, 7.0, "South", "breakfast", "vegan", ["vada", "urad vada", "sambar vada"]),
    ("Uttapam", "1 piece (120g)", 190, 5.0, 31.0, 5.0, "South", "breakfast", "vegan", ["uthappam", "onion uttapam"]),
    ("Poha", "1 plate (150g)", 250, 5.0, 45.0, 6.0, "Maharashtra", "breakfast", "vegan", ["kanda poha", "flattened rice", "batata poha"]),
    ("Oats Porridge", "1 katori (200g cooked)", 150, 5.5, 26.0, 3.0, "Modern", "breakfast", "vegan", ["oats", "oatmeal", "daliya oats"]),
    ("Vegetable Daliya", "1 katori (150g)", 160, 5.0, 29.0, 3.0, "North", "breakfast", "vegan", ["dalia", "broken wheat porridge"]),
    ("Besan Chilla", "1 piece (70g)", 120, 6.0, 14.0, 4.5, "North", "breakfast", "vegan", ["besan cheela", "chilla", "gram flour pancake"]),
    ("Moong Dal Chilla", "1 piece (70g)", 110, 7.0, 13.0, 3.0, "North", "breakfast", "vegan", ["moong cheela", "dal chilla"]),
    ("Sabudana Khichdi", "1 katori (150g)", 290, 3.0, 48.0, 10.0, "Maharashtra", "breakfast", "vegan", ["sago khichdi", "vrat khichdi"]),
    ("Bread Omelette", "2 slices + 2 eggs", 330, 17.0, 28.0, 17.0, "Pan-Indian", "breakfast", "non-veg", ["egg sandwich indian"]),
    ("Egg Omelette", "2 eggs", 190, 13.0, 1.5, 14.5, "Pan-Indian", "breakfast", "non-veg", ["masala omelette", "plain omelet"]),
    ("Egg Bhurji", "2 eggs scrambled", 210, 13.5, 4.0, 16.0, "Pan-Indian", "breakfast", "non-veg", ["anda bhurji", "scrambled eggs"]),
    ("Boiled Egg", "1 egg (50g)", 78, 6.3, 0.6, 5.3, "Pan-Indian", "breakfast", "non-veg", ["anda", "egg", "uble hue ande", "hard boiled egg"]),
    ("French Toast", "2 slices", 280, 10.0, 32.0, 12.0, "Modern", "breakfast", "non-veg", ["sweet french toast"]),
    ("Brown Bread Toast with Butter", "2 slices", 170, 5.5, 25.0, 5.5, "Modern", "breakfast", "veg", ["bread butter", "toast", "toasted bread"]),
    ("Peanut Butter Toast", "2 slices", 270, 11.0, 27.0, 13.5, "Modern", "breakfast", "vegan", ["pb toast"]),
    ("Avocado Toast", "1 slice with toppings", 180, 4.0, 16.0, 12.0, "Modern", "breakfast", "vegan", ["avocado on toast"]),

    # =========================================================================
    # 10. SNACKS, CHAAT & STREET FOOD
    # =========================================================================
    ("Samosa", "1 piece (80g)", 262, 4.0, 28.0, 15.0, "North", "snack", "vegan", ["aloo samosa", "punjabi samosa"]),
    ("Aloo Tikki", "1 piece (60g)", 140, 2.5, 18.0, 6.5, "North", "snack", "vegan", ["tikki", "potato patty"]),
    ("Pani Puri", "6 pieces with paani", 180, 3.5, 30.0, 5.0, "Pan-Indian", "snack", "vegan", ["golgappe", "puchka", "golgappa"]),
    ("Sev Puri", "1 plate (6 puris)", 210, 4.5, 32.0, 7.5, "Maharashtra", "snack", "vegan", ["sev batata puri"]),
    ("Bhel Puri", "1 plate (100g)", 190, 4.5, 33.0, 4.5, "Maharashtra", "snack", "vegan", ["bhelpuri", "sukha bhel"]),
    ("Dahi Puri", "1 plate (6 puris)", 280, 7.0, 38.0, 11.0, "Maharashtra", "snack", "veg", ["dahi batata puri", "dahi sev puri"]),
    ("Papdi Chaat", "1 plate (150g)", 310, 6.5, 42.0, 13.0, "North", "snack", "veg", ["dahi papdi chaat", "chaat"]),
    ("Dahi Bhalla", "2 pieces (150g)", 270, 8.0, 32.0, 12.0, "North", "snack", "veg", ["dahi vada", "dahi bare"]),
    ("Pav Bhaji", "1 plate (2 pav + bhaji)", 440, 10.0, 62.0, 17.0, "Maharashtra", "snack", "veg", ["pao bhaji"]),
    ("Vada Pav", "1 piece (130g)", 290, 7.0, 42.0, 10.5, "Maharashtra", "snack", "vegan", ["wada pav", "bombay burger"]),
    ("Misal Pav", "1 plate (1 bowl misal + 2 pav)", 460, 14.0, 64.0, 16.5, "Maharashtra", "snack", "vegan", ["puneri misal", "kolhapuri misal"]),
    ("Dhokla", "2 pieces (80g)", 130, 5.0, 20.0, 3.5, "Gujarat", "snack", "veg", ["khaman dhokla", "khaman"]),
    ("Khandvi", "4 pieces (80g)", 140, 4.5, 16.0, 6.5, "Gujarat", "snack", "veg", ["patuli"]),
    ("Pakora", "4 pieces (60g)", 180, 4.5, 16.0, 11.0, "North", "snack", "vegan", ["pakoda", "bhajiya", "bhajji", "mix veg pakora", "pyaaz pakora"]),
    ("Paneer Pakora", "2 pieces (80g)", 230, 9.5, 14.0, 15.0, "North", "snack", "veg", ["cottage cheese fritters"]),
    ("Bread Pakora", "1 piece (100g)", 260, 5.5, 28.0, 14.0, "North", "snack", "vegan", ["stuffed bread pakoda"]),
    ("Mirchi Vada", "1 piece (100g)", 210, 4.0, 24.0, 11.0, "Rajasthan", "snack", "vegan", ["mirchi pakoda", "chilli bajji"]),
    ("Kachori", "1 piece (80g)", 280, 5.0, 32.0, 15.0, "North/Rajasthan", "snack", "vegan", ["khasta kachori", "pyaz kachori", "dal kachori"]),
    ("Veg Momos (Steamed)", "6 pieces (120g)", 180, 5.0, 34.0, 2.5, "Northeast/Tibet", "snack", "vegan", ["steamed vegetable momo", "dim sum"]),
    ("Veg Momos (Fried)", "6 pieces (120g)", 280, 5.5, 35.0, 13.5, "Northeast/Tibet", "snack", "vegan", ["fried momo"]),
    ("Chicken Momos", "6 pieces (120g)", 220, 14.0, 30.0, 4.5, "Northeast/Tibet", "snack", "non-veg", ["steamed chicken momo"]),
    ("Maggi Noodles", "1 bowl (1 pack 70g)", 310, 6.0, 43.0, 12.5, "Modern", "snack", "veg", ["instant noodles", "masala maggi"]),
    ("Veg Sandwich", "2 slices bread", 210, 5.5, 34.0, 6.0, "Modern", "snack", "veg", ["plain veg sandwich", "cucumber sandwich"]),
    ("Grilled Cheese Sandwich", "1 sandwich", 340, 11.0, 32.0, 18.0, "Modern", "snack", "veg", ["veg cheese grilled sandwich"]),
    ("Veg Burger", "1 burger", 380, 9.0, 52.0, 15.0, "Modern", "snack", "veg", ["aloo tikki burger"]),
    ("Veg Frankie", "1 roll", 320, 7.5, 46.0, 12.0, "Maharashtra", "snack", "veg", ["veg kathi roll", "frankie roll"]),
    ("Paneer Kathi Roll", "1 roll", 390, 14.0, 44.0, 18.0, "Bengal", "snack", "veg", ["paneer roll"]),
    ("Chicken Kathi Roll", "1 roll", 410, 22.0, 42.0, 17.0, "Bengal", "snack", "non-veg", ["chicken frankie", "chicken roll"]),
    ("French Fries", "1 medium serving (100g)", 290, 3.4, 38.0, 14.0, "Modern", "snack", "vegan", ["fries", "finger chips"]),
    ("Spring Roll", "2 pieces (100g)", 240, 4.5, 28.0, 12.0, "Indo-Chinese", "snack", "vegan", ["veg spring roll"]),
    ("Roasted Makhana", "1 katori (30g)", 105, 3.5, 21.0, 0.3, "North", "snack", "vegan", ["fox nuts", "phool makhana", "roasted lotus seeds"]),
    ("Roasted Chana", "1 handful (30g)", 110, 6.0, 18.0, 1.5, "Pan-Indian", "snack", "vegan", ["bhuna chana", "roasted chickpeas"]),
    ("Peanuts", "1 handful (30g)", 170, 7.5, 5.0, 14.5, "Pan-Indian", "snack", "vegan", ["moongphali", "roasted peanuts", "singdana"]),
    ("Almonds", "10 pieces (12g)", 70, 2.5, 2.5, 6.0, "Pan-Indian", "snack", "vegan", ["badam", "roasted almonds"]),
    ("Cashews", "10 pieces (15g)", 85, 2.7, 4.5, 6.8, "Pan-Indian", "snack", "vegan", ["kaju"]),
    ("Walnuts", "4 halves (12g)", 80, 1.8, 1.6, 7.8, "Pan-Indian", "snack", "vegan", ["akhrot"]),
    ("Papad (roasted)", "1 piece (12g)", 40, 2.5, 6.0, 0.4, "Pan-Indian", "snack", "vegan", ["papadum", "roasted papad"]),
    ("Papad (fried)", "1 piece (15g)", 75, 2.5, 6.5, 4.5, "Pan-Indian", "snack", "vegan", ["fried papad"]),
    ("Aloo Bhujia", "30g (small handful)", 175, 2.5, 13.0, 12.5, "North", "snack", "vegan", ["bhujia sev", "haldiram bhujia"]),
    ("Chakli / Murukku", "2 pieces (40g)", 190, 3.0, 24.0, 9.0, "South/Maharashtra", "snack", "vegan", ["murukku", "chakli"]),
    ("Khakhra", "2 pieces (40g)", 150, 4.0, 24.0, 4.5, "Gujarat", "snack", "vegan", ["gujarati khakhra", "methi khakhra"]),
    ("Biscuits (Marie)", "4 pieces (28g)", 120, 2.0, 21.0, 3.0, "Pan-Indian", "snack", "veg", ["parle-g", "tea biscuits", "marie gold"]),

    # =========================================================================
    # 11. NON-VEGETARIAN (CHICKEN, MUTTON, FISH, SEAFOOD)
    # =========================================================================
    ("Chicken Curry", "1 katori (150g)", 260, 22.0, 7.0, 16.0, "Pan-Indian", "non-veg", "non-veg", ["murgh curry", "chicken masala", "homestyle chicken"]),
    ("Butter Chicken", "1 katori (150g)", 320, 21.0, 10.0, 22.0, "Punjab", "non-veg", "non-veg", ["murgh makhani", "chicken makhani"]),
    ("Kadhai Chicken", "1 katori (150g)", 280, 23.0, 8.0, 17.5, "North", "non-veg", "non-veg", ["kadai chicken", "karahi chicken"]),
    ("Chicken Tikka", "4 pieces (120g)", 210, 28.0, 3.5, 9.0, "Punjab", "non-veg", "non-veg", ["tandoori chicken tikka"]),
    ("Tandoori Chicken", "1 leg / quarter (150g)", 270, 30.0, 5.0, 14.0, "Punjab", "non-veg", "non-veg", ["chicken tandoori", "tandoori murgh"]),
    ("Chicken Saagwala", "1 katori (150g)", 250, 23.0, 6.0, 15.0, "North", "non-veg", "non-veg", ["palak chicken", "spinach chicken"]),
    ("Chicken Shawarma", "1 roll", 390, 24.0, 36.0, 16.0, "Modern", "non-veg", "non-veg", ["shawarma wrap"]),
    ("Egg Curry", "1 katori (150g, 2 eggs)", 250, 14.0, 7.0, 18.0, "Pan-Indian", "non-veg", "non-veg", ["anda curry", "dim kosha"]),
    ("Mutton Curry", "1 katori (150g)", 300, 24.0, 6.0, 20.0, "Pan-Indian", "non-veg", "non-veg", ["gosht curry", "tariwala mutton"]),
    ("Mutton Rogan Josh", "1 katori (150g)", 330, 24.0, 7.0, 23.0, "Kashmir", "non-veg", "non-veg", ["rogan josh"]),
    ("Keema Pav", "1 bowl keema + 2 pav", 490, 28.0, 48.0, 20.0, "Mumbai/Parsi", "non-veg", "non-veg", ["mutton keema", "minced mutton"]),
    ("Fish Curry", "1 katori (150g)", 210, 20.0, 6.0, 12.0, "Bengal/Kerala", "non-veg", "non-veg", ["machhli curry", "macher jhol", "meen curry"]),
    ("Fish Fry", "2 pieces (120g)", 240, 22.0, 8.0, 13.5, "Coastal/Bengal", "non-veg", "non-veg", ["amritsari fish", "rava fish fry", "machli fry"]),
    ("Prawn Masala", "1 katori (150g)", 220, 22.0, 8.0, 11.0, "Coastal", "non-veg", "non-veg", ["jhinga curry", "shrimp masala", "chemmeen curry"]),

    # =========================================================================
    # 12. BEVERAGES & DRINKS
    # =========================================================================
    ("Masala Chai", "1 cup (150ml)", 80, 2.0, 11.0, 3.0, "Pan-Indian", "beverage", "veg", ["chai", "tea with milk", "doodh chai", "adrak chai"]),
    ("Black Tea", "1 cup (150ml)", 5, 0.2, 1.0, 0.0, "Modern", "beverage", "vegan", ["sugarless tea", "lemon tea"]),
    ("Green Tea", "1 cup (150ml)", 3, 0.2, 0.5, 0.0, "Modern", "beverage", "vegan", ["herbal tea"]),
    ("Filter Coffee", "1 cup (150ml)", 90, 2.5, 11.0, 4.0, "South", "beverage", "veg", ["kaapi", "south indian filter coffee"]),
    ("Cold Coffee", "1 glass (250ml)", 180, 4.5, 26.0, 6.5, "Modern", "beverage", "veg", ["iced coffee", "frappe"]),
    ("Black Coffee", "1 cup (150ml)", 5, 0.3, 0.8, 0.0, "Modern", "beverage", "vegan", ["coffee", "americano", "black coffee no sugar"]),
    ("Chaas", "1 glass (200ml)", 40, 2.0, 3.5, 1.5, "Pan-Indian", "beverage", "veg", ["buttermilk", "lassi salted", "mattha", "masala chaas"]),
    ("Sweet Lassi", "1 glass (250ml)", 200, 6.0, 30.0, 6.0, "Punjab", "beverage", "veg", ["lassi", "punjabi lassi"]),
    ("Mango Lassi", "1 glass (250ml)", 230, 6.0, 38.0, 6.0, "Punjab", "beverage", "veg", ["aam lassi"]),
    ("Nimbu Pani", "1 glass (250ml)", 45, 0.4, 11.0, 0.1, "Pan-Indian", "beverage", "vegan", ["lemonade", "shikanji", "nimbu soda"]),
    ("Fresh Coconut Water", "1 whole (250ml)", 45, 1.5, 9.0, 0.5, "Coastal", "beverage", "vegan", ["nariyal pani", "daab"]),
    ("Sugarcane Juice", "1 glass (250ml)", 180, 0.8, 45.0, 0.2, "Pan-Indian", "beverage", "vegan", ["ganne ka ras"]),
    ("Badam Milk", "1 glass (200ml)", 175, 6.0, 22.0, 7.0, "North", "beverage", "veg", ["badam doodh", "almond milk drink"]),
    ("Haldi Doodh", "1 cup (150ml)", 110, 4.5, 11.0, 5.0, "Pan-Indian", "beverage", "veg", ["turmeric milk", "golden milk"]),
    ("Fresh Orange Juice", "1 glass (250ml)", 110, 1.8, 25.0, 0.5, "Pan-Indian", "beverage", "vegan", ["santra juice", "mosambi juice"]),
    ("Watermelon Juice", "1 glass (250ml)", 75, 1.5, 18.0, 0.3, "Pan-Indian", "beverage", "vegan", ["tarbooz juice"]),
    ("Mango Shake", "1 glass (250ml)", 220, 5.5, 36.0, 6.5, "Pan-Indian", "beverage", "veg", ["aam shake"]),
    ("Banana Shake", "1 glass (250ml)", 210, 6.0, 35.0, 5.5, "Pan-Indian", "beverage", "veg", ["kela shake"]),
    ("Whey Protein Shake", "1 scoop (30g) in water", 120, 24.0, 3.0, 1.5, "Modern", "beverage", "veg", ["protein shake", "whey", "protein powder"]),
    ("Rooh Afza Sharbat", "1 glass (250ml)", 130, 0.2, 32.0, 0.0, "North", "beverage", "vegan", ["rose milk", "gulab sharbat"]),
    ("Cola / Cold Drink", "1 can (330ml)", 140, 0.0, 35.0, 0.0, "Modern", "beverage", "vegan", ["coca cola", "pepsi", "thums up", "soda"]),
    ("Diet Coke", "1 can (330ml)", 2, 0.0, 0.4, 0.0, "Modern", "beverage", "vegan", ["diet cola", "coke zero"]),

    # =========================================================================
    # 13. SWEETS & DESSERTS
    # =========================================================================
    ("Gulab Jamun", "1 piece (50g)", 150, 2.0, 22.0, 6.0, "North", "sweet", "veg", ["gulab jamun", "kala jamun"]),
    ("Rasgulla", "1 piece (50g)", 110, 2.5, 23.0, 1.0, "Bengal/Odisha", "sweet", "veg", ["roshogolla", "sponge rasgulla"]),
    ("Rasmalai", "1 piece (60g)", 175, 4.5, 20.0, 8.5, "Bengal", "sweet", "veg", ["roshomalai"]),
    ("Jalebi", "2 pieces (50g)", 190, 1.5, 33.0, 6.5, "North", "sweet", "veg", ["imarti", "garma garam jalebi"]),
    ("Rabdi", "1 small katori (80g)", 240, 6.0, 22.0, 14.0, "North", "sweet", "veg", ["rabri"]),
    ("Kaju Katli", "2 pieces (30g)", 140, 3.0, 17.0, 7.0, "North", "sweet", "veg", ["kaju barfi", "cashew fudge"]),
    ("Besan Ladoo", "1 piece (40g)", 190, 3.5, 22.0, 10.0, "North", "sweet", "veg", ["laddu", "ladoo", "besan ke laddu"]),
    ("Motichoor Ladoo", "1 piece (40g)", 185, 2.5, 25.0, 8.5, "North", "sweet", "veg", ["boondi ladoo"]),
    ("Kheer", "1 katori (120g)", 190, 5.0, 28.0, 6.5, "Pan-Indian", "sweet", "veg", ["rice pudding", "payasam", "firni", "phirni"]),
    ("Seviyan Kheer", "1 katori (120g)", 195, 4.8, 30.0, 6.5, "Pan-Indian", "sweet", "veg", ["vermicelli kheer", "sheer khurma"]),
    ("Moong Dal Halwa", "1 small katori (80g)", 310, 6.0, 35.0, 17.0, "Rajasthan/North", "sweet", "veg", ["moong halwa"]),
    ("Gajar ka Halwa", "1 katori (120g)", 260, 4.5, 34.0, 12.0, "North", "sweet", "veg", ["carrot halwa", "gajrela"]),
    ("Sooji Halwa", "1 katori (100g)", 240, 3.5, 34.0, 10.0, "North", "sweet", "veg", ["sheera", "rava kesari", "suji halwa"]),
    ("Ice Cream (Vanilla)", "1 scoop (80g)", 160, 3.0, 19.0, 8.5, "Modern", "sweet", "veg", ["vanilla ice cream", "ice cream"]),
    ("Kulfi", "1 stick (70g)", 180, 4.0, 20.0, 9.5, "North", "sweet", "veg", ["malai kulfi", "matka kulfi"]),
    ("Shrikhand", "1 katori (100g)", 220, 6.5, 32.0, 8.0, "Maharashtra/Gujarat", "sweet", "veg", ["amrakhand", "kesar shrikhand"]),
]

# Merge extra 250+ varieties and meal combinations to reach 500+ foods
try:
    from backend.extra_foods import EXTRA_FOODS
except ImportError:
    try:
        from extra_foods import EXTRA_FOODS
    except ImportError:
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))
        from extra_foods import EXTRA_FOODS

_seen = set()
_merged = []
for _item in FOODS + EXTRA_FOODS:
    if _item[0] not in _seen:
        _seen.add(_item[0])
        _merged.append(_item)
FOODS = _merged


def build_text(row) -> str:
    name, unit, kcal, p, c, f, region, cat, diet, aliases = row
    alias_txt = ", ".join(aliases)
    return (
        f"{name} ({alias_txt}). Indian {cat} from {region}. {diet}. "
        f"Serving {unit}: {kcal} kcal, {p}g protein, {c}g carbs, {f}g fat."
    )


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY in environment or .env")

    print(f"Connecting to Supabase at {url}...")
    sb = create_client(url, key)
    print(f"Loading embedding model: {EMBED_MODEL}...")
    model = TextEmbedding(model_name=EMBED_MODEL)

    print(f"Generating embeddings for {len(FOODS)} comprehensive food items...")
    texts = [build_text(r) for r in FOODS]
    vectors = [v.tolist() for v in model.embed(texts)]

    records = []
    for r, vec in zip(FOODS, vectors):
        name, unit, kcal, p, c, f, region, cat, diet, aliases = r
        records.append({
            "food_name": name,
            "serving_unit": unit,
            "calories": kcal,
            "protein_g": p,
            "carbs_g": c,
            "fats_g": f,
            "region": region,
            "category": cat,
            "diet_type": diet,
            "aliases": aliases,
            "embedding": vec,
        })

    print(f"Upserting {len(records)} foods into Supabase indian_food_nutrition in batches...")
    batch_size = 25
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        sb.table("indian_food_nutrition").upsert(batch, on_conflict="food_name").execute()
        print(f"  Upserted batch {i // batch_size + 1} / {(len(records) + batch_size - 1) // batch_size}")

    print(f"\nSUCCESS! Seeded {len(records)} foods into indian_food_nutrition.")


if __name__ == "__main__":
    main()
