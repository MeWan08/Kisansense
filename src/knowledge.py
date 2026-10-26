"""Crop knowledge base for the KisanBot chatbot.

Contains curated agricultural information for all 22 crops in the dataset,
including growing conditions, regional suitability, and best practices.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

CROP_KNOWLEDGE = {
    "rice": {
        "name": "Rice",
        "emoji": "🌾",
        "season": "Kharif (June–November)",
        "water": "High — requires standing water (paddy irrigation)",
        "soil": "Clayey loam, alluvial soils with good water retention",
        "regions": [
            "West Bengal",
            "Punjab",
            "Haryana",
            "Uttar Pradesh",
            "Assam",
            "Tamil Nadu",
            "Kerala",
            "Andhra Pradesh",
        ],
        "temperature": "20–28°C",
        "rainfall": "150–300 mm",
        "tips": [
            "Maintain 5–7 cm standing water during vegetative growth",
            "Apply nitrogen in 3 split doses for best yields",
            "Use SRI (System of Rice Intensification) to save water",
            "Practice alternate wetting and drying to reduce methane emissions",
        ],
        "market": "India's staple crop — consistent domestic demand and MSP support",
    },
    "maize": {
        "name": "Maize",
        "emoji": "🌽",
        "season": "Kharif (June–October) and Rabi (October–April)",
        "water": "Moderate — needs timely irrigation at tasseling and grain filling",
        "soil": "Well-drained sandy loam to loamy soils",
        "regions": [
            "Rajasthan",
            "Madhya Pradesh",
            "Karnataka",
            "Andhra Pradesh",
            "Bihar",
            "Maharashtra",
        ],
        "temperature": "22–28°C",
        "rainfall": "60–115 mm",
        "tips": [
            "Critical irrigation at knee-high, tasseling, and grain-filling stages",
            "Intercrop with legumes to improve soil nitrogen",
            "Use hybrid varieties for higher yields",
            "Apply zinc sulfate to address common deficiency in Indian soils",
        ],
        "market": "Used for feed, starch, and increasingly for ethanol production",
    },
    "chickpea": {
        "name": "Chickpea (Chana)",
        "emoji": "🫘",
        "season": "Rabi (October–March)",
        "water": "Low — drought-tolerant pulse crop",
        "soil": "Well-drained sandy loam, tolerates alkaline soils (pH 6–8)",
        "regions": ["Madhya Pradesh", "Rajasthan", "Maharashtra", "Uttar Pradesh", "Karnataka"],
        "temperature": "17–20°C",
        "rainfall": "60–80 mm",
        "tips": [
            "Excellent rotation crop — fixes atmospheric nitrogen",
            "Avoid waterlogging; it causes root rot (Fusarium wilt)",
            "Seed treatment with Rhizobium inoculant boosts nodulation",
            "Harvest when 80% pods turn brown for best quality",
        ],
        "market": "Strong domestic demand as dal; India is the world's largest producer",
    },
    "kidneybeans": {
        "name": "Kidney Beans (Rajma)",
        "emoji": "🫘",
        "season": "Kharif (June–September) in hills, Rabi in plains",
        "water": "Moderate — regular irrigation needed",
        "soil": "Well-drained loamy soils, pH 5.5–7.5",
        "regions": ["Jammu & Kashmir", "Himachal Pradesh", "Uttarakhand", "Maharashtra"],
        "temperature": "18–22°C",
        "rainfall": "55–80 mm",
        "tips": [
            "Grows best at altitude (1000–2000m) in India",
            "Sensitive to frost and waterlogging",
            "Stake plants or use bush varieties for easier harvest",
            "Intercrop with maize in hilly regions",
        ],
        "market": "Premium price crop; high demand in North India as rajma-chawal staple",
    },
    "pigeonpeas": {
        "name": "Pigeon Peas (Toor/Arhar Dal)",
        "emoji": "🌿",
        "season": "Kharif (June–February), long-duration crop",
        "water": "Low to moderate — deep root system accesses subsoil moisture",
        "soil": "Well-drained loamy soils, tolerates red and laterite soils",
        "regions": ["Maharashtra", "Karnataka", "Madhya Pradesh", "Uttar Pradesh", "Telangana"],
        "temperature": "24–32°C",
        "rainfall": "120–170 mm",
        "tips": [
            "Intercrop with sorghum, groundnut, or short-duration pulses",
            "Long taproot makes it drought-resilient",
            "Practice ICRISAT's improved short-duration varieties for higher yields",
            "Watch for pod borer (Helicoverpa) — major pest",
        ],
        "market": "India's most consumed dal; consistent government procurement",
    },
    "mothbeans": {
        "name": "Moth Beans (Matki)",
        "emoji": "🌱",
        "season": "Kharif (July–October)",
        "water": "Very low — one of the most drought-tolerant crops",
        "soil": "Sandy, arid soils; thrives in poor soil conditions",
        "regions": ["Rajasthan", "Gujarat", "Western Madhya Pradesh"],
        "temperature": "26–30°C",
        "rainfall": "40–65 mm",
        "tips": [
            "Ideal for arid western Rajasthan (Thar region)",
            "Excellent cover crop — prevents sand erosion",
            "Minimal input crop, suitable for marginal farmers",
            "Short duration (60–75 days) allows catch-cropping",
        ],
        "market": "Growing demand as health food; used for sprouts and dal",
    },
    "mungbean": {
        "name": "Mung Bean (Moong Dal)",
        "emoji": "🌱",
        "season": "Kharif (July–October) and Spring (March–June)",
        "water": "Low to moderate — drought-tolerant",
        "soil": "Well-drained sandy loam, pH 6.2–7.2",
        "regions": ["Rajasthan", "Maharashtra", "Madhya Pradesh", "Andhra Pradesh", "Odisha"],
        "temperature": "26–29°C",
        "rainfall": "40–50 mm",
        "tips": [
            "Short duration (55–65 days) — fits between main crops",
            "Excellent green manure crop if ploughed before flowering",
            "Rich in protein (24%) — nutritionally important",
            "IPM (Integrated Pest Management) for yellow mosaic virus",
        ],
        "market": "Year-round demand for dal and sprouts; premium in summer",
    },
    "blackgram": {
        "name": "Black Gram (Urad Dal)",
        "emoji": "🌱",
        "season": "Kharif (July–October)",
        "water": "Low to moderate",
        "soil": "Heavy clay, loamy soils; tolerates mild salinity",
        "regions": [
            "Madhya Pradesh",
            "Uttar Pradesh",
            "Tamil Nadu",
            "Andhra Pradesh",
            "Maharashtra",
        ],
        "temperature": "28–34°C",
        "rainfall": "55–70 mm",
        "tips": [
            "Thrives in warm, humid conditions",
            "Fixes nitrogen — excellent rotation crop for cereals",
            "Sensitive to waterlogging; raised bed cultivation helps",
            "Used for making urad dal, idli batter, and papad",
        ],
        "market": "Essential for South Indian cuisine; stable demand year-round",
    },
    "lentil": {
        "name": "Lentil (Masoor Dal)",
        "emoji": "🌱",
        "season": "Rabi (October–March)",
        "water": "Low — thrives on residual moisture",
        "soil": "Clay loam, loamy soils with good drainage",
        "regions": ["Madhya Pradesh", "Uttar Pradesh", "Bihar", "West Bengal"],
        "temperature": "22–27°C",
        "rainfall": "30–50 mm",
        "tips": [
            "Does well on stored soil moisture — minimal irrigation",
            "Sensitive to salinity and alkalinity",
            "Harvest at physiological maturity to avoid shattering",
            "Phosphorus application is more critical than nitrogen",
        ],
        "market": (
            "Widely consumed across India; import-dependent, "
            "so domestic production has strong support"
        ),
    },
    "pomegranate": {
        "name": "Pomegranate",
        "emoji": "🍎",
        "season": "Mrig Bahar (June–July) is most common; Ambe Bahar (Jan–Feb) also practiced",
        "water": "Moderate — drip irrigation is ideal",
        "soil": "Well-drained sandy loam, tolerates alkaline and calcareous soils",
        "regions": ["Maharashtra (Solapur, Sangli, Nashik)", "Karnataka", "Rajasthan", "Gujarat"],
        "temperature": "21–25°C",
        "rainfall": "90–105 mm",
        "tips": [
            "Drip irrigation + mulching significantly improves fruit quality",
            "Watch for bacterial blight (Oily Spot) — major disease in Maharashtra",
            "Rest period (Bahar) management is key to timing harvests for market",
            "Aril color and TSS (Total Soluble Solids) determine premium pricing",
        ],
        "market": "High-value export crop; India is the world's largest producer",
    },
    "banana": {
        "name": "Banana",
        "emoji": "🍌",
        "season": "Year-round (10–12 month crop cycle)",
        "water": "High — needs consistent moisture; drip preferred",
        "soil": "Deep, rich loamy soils with good drainage, pH 6.5–7.5",
        "regions": ["Tamil Nadu", "Maharashtra", "Gujarat", "Andhra Pradesh", "Karnataka"],
        "temperature": "27–30°C",
        "rainfall": "80–115 mm",
        "tips": [
            "Tissue culture plants ensure disease-free, uniform plantations",
            "High-density planting (3,000–4,000 plants/ha) improves returns",
            "Bunch covers protect fruit from sunburn and pests",
            "Potassium is the most critical nutrient — apply potash regularly",
        ],
        "market": "India is the world's largest banana producer; strong domestic market",
    },
    "mango": {
        "name": "Mango",
        "emoji": "🥭",
        "season": "Flowering: Dec–Feb, Harvest: April–July",
        "water": "Low to moderate once established; critical during fruit development",
        "soil": "Deep alluvial soils, laterite soils; avoids waterlogging",
        "regions": [
            "Uttar Pradesh (Dasheri, Langra)",
            "Andhra Pradesh (Banganapalli)",
            "Maharashtra (Alphonso)",
            "Gujarat (Kesar)",
            "Karnataka (Badami)",
        ],
        "temperature": "28–36°C",
        "rainfall": "40–100 mm",
        "tips": [
            "Alternate bearing — use paclobutrazol cautiously for regular fruiting",
            "Mango stone weevil and fruit fly are key pests",
            "Pruning after harvest improves light penetration and next season's yield",
            "Hot water treatment (52°C, 5 min) essential for export quality",
        ],
        "market": (
            "India produces 40% of world's mangoes; "
            "huge export potential for Alphonso and Kesar"
        ),
    },
    "grapes": {
        "name": "Grapes",
        "emoji": "🍇",
        "season": "Pruning: Oct, Harvest: Feb–April (Thompson Seedless)",
        "water": "Moderate — drip irrigation with fertigation is standard",
        "soil": "Well-drained sandy loam, calcareous soils; pH 6.5–7.5",
        "regions": [
            "Maharashtra (Nashik, Sangli, Solapur)",
            "Karnataka (Bijapur)",
            "Andhra Pradesh",
        ],
        "temperature": "25–35°C",
        "rainfall": "35–60 mm",
        "tips": [
            "Bower/pergola system is standard in India (Nashik belt)",
            "Gibberellic acid (GA3) used for berry elongation in Thompson Seedless",
            "Downy mildew is the biggest threat during rainy season",
            "EU export requires strict MRL (Maximum Residue Limit) compliance",
        ],
        "market": "Nashik is India's grape capital; significant export to EU and Middle East",
    },
    "watermelon": {
        "name": "Watermelon",
        "emoji": "🍉",
        "season": "Summer (February–May), Kharif in some regions",
        "water": "Moderate — critical during fruit development",
        "soil": "Sandy loam, riverbed cultivation is common",
        "regions": ["Rajasthan", "Uttar Pradesh", "Karnataka", "Andhra Pradesh", "West Bengal"],
        "temperature": "25–28°C",
        "rainfall": "40–55 mm",
        "tips": [
            "Riverbed (diara) cultivation is traditional and productive",
            "Pollination by bees is essential — avoid pesticide spraying during flowering",
            "Use mulch to conserve moisture and suppress weeds",
            "Harvest when tendril opposite the fruit dries up (maturity indicator)",
        ],
        "market": "Peak season demand; high returns in early-season marketing",
    },
    "muskmelon": {
        "name": "Muskmelon",
        "emoji": "🍈",
        "season": "Summer (February–June)",
        "water": "Low to moderate — drought-tolerant once established",
        "soil": "Sandy soils, riverbed alluvial; tolerates light soils",
        "regions": ["Rajasthan", "Gujarat", "Uttar Pradesh", "Punjab", "Madhya Pradesh"],
        "temperature": "28–32°C",
        "rainfall": "20–40 mm",
        "tips": [
            "Thrives in hot, arid conditions with cool nights",
            "Stop irrigation a week before harvest for sweetness",
            "Raised beds and plastic mulch improve quality in semi-arid zones",
            "Harvest at 'half-slip' stage for best flavor and shelf life",
        ],
        "market": "Premium summer fruit; growing demand in urban markets",
    },
    "apple": {
        "name": "Apple",
        "emoji": "🍎",
        "season": "Harvest: July–October (varies by altitude)",
        "water": "Moderate — drip irrigation in modern orchards",
        "soil": "Well-drained loamy soils, slightly acidic (pH 5.5–6.5)",
        "regions": [
            "Jammu & Kashmir (Shopian, Kupwara)",
            "Himachal Pradesh (Shimla, Kinnaur, Kullu)",
            "Uttarakhand",
        ],
        "temperature": "18–24°C (needs 1000+ chilling hours)",
        "rainfall": "95–115 mm",
        "tips": [
            "Chilling requirement (below 7°C) is essential — limits to high altitudes",
            "Ultra-high density planting on M9 rootstock gaining popularity",
            "CA (Controlled Atmosphere) storage extends marketability by months",
            "Pollinizer varieties needed — Royal Delicious with Golden Delicious",
        ],
        "market": "India is a net importer; domestic production commands premium pricing",
    },
    "orange": {
        "name": "Orange (Nagpur Santra/Mandarin)",
        "emoji": "🍊",
        "season": "Mrig Bahar (June), Ambe Bahar (Feb) — two harvest seasons",
        "water": "Moderate — stress before flowering induces better blooming",
        "soil": "Well-drained loamy soils, slightly acidic to neutral",
        "regions": [
            "Maharashtra (Nagpur, Vidarbha)",
            "Madhya Pradesh",
            "Rajasthan",
            "Northeast India",
        ],
        "temperature": "22–26°C",
        "rainfall": "90–110 mm",
        "tips": [
            "Nagpur Santra (Mandarin) is the most popular Indian orange",
            "Citrus greening disease (HLB) is the biggest threat — use disease-free budwood",
            "Micro-irrigation + fertigation gives superior fruit size and color",
            "Withhold irrigation 30 days before expected flowering for stress-induced bloom",
        ],
        "market": "Nagpur produces 30% of India's oranges; processing and juice markets growing",
    },
    "papaya": {
        "name": "Papaya",
        "emoji": "🍈",
        "season": "Year-round (fruits 9–12 months after planting)",
        "water": "Moderate to high — sensitive to waterlogging",
        "soil": "Well-drained fertile soils, pH 6–7; avoids heavy clay",
        "regions": ["Andhra Pradesh", "Gujarat", "Karnataka", "Maharashtra", "West Bengal"],
        "temperature": "30–37°C",
        "rainfall": "130–165 mm",
        "tips": [
            "Red Lady and Taiwan varieties are popular for commercial cultivation",
            "Papaya ringspot virus (PRSV) is major threat — use tolerant varieties",
            "Raised beds essential to avoid root rot in heavy soils",
            "Quick returns — starts fruiting within 9 months of planting",
        ],
        "market": "Dual-use crop: table fruit and papain enzyme extraction",
    },
    "coconut": {
        "name": "Coconut",
        "emoji": "🥥",
        "season": "Year-round bearing (after 5–6 years from planting)",
        "water": "High — consistent moisture needed, but tolerates coastal conditions",
        "soil": "Sandy loam, laterite, alluvial coastal soils",
        "regions": ["Kerala", "Karnataka Coast", "Tamil Nadu", "Andhra Pradesh", "Goa"],
        "temperature": "25–30°C",
        "rainfall": "150–210 mm",
        "tips": [
            "Coconut palms are 'tree of life' — every part has commercial value",
            "Intercrop with cocoa, pepper, or banana for additional income",
            "Drip irrigation + mulching with coconut husk improves yields",
            "Harvest every 45 days for copra; every 30 days for tender coconut",
        ],
        "market": (
            "Kerala and Karnataka dominate; coconut oil, copra, "
            "coir, and tender coconut all have markets"
        ),
    },
    "cotton": {
        "name": "Cotton",
        "emoji": "🏵️",
        "season": "Kharif (June–December)",
        "water": "Moderate — critical at square formation and boll development",
        "soil": "Deep black cotton soil (vertisol), loamy soils",
        "regions": [
            "Gujarat",
            "Maharashtra",
            "Telangana",
            "Madhya Pradesh",
            "Rajasthan",
            "Andhra Pradesh",
        ],
        "temperature": "25–35°C",
        "rainfall": "60–110 mm",
        "tips": [
            "Bt Cotton dominates Indian cultivation (95%+ adoption)",
            "Pink bollworm resistance management — use refuge-in-bag strategy",
            "Avoid late-season irrigation to prevent boll rot",
            "High-density planting (55,000 plants/ha) increasing in Gujarat",
        ],
        "market": "India is the world's largest cotton producer; textile industry backbone",
    },
    "jute": {
        "name": "Jute",
        "emoji": "🌿",
        "season": "Kharif (March–July sowing, August–October harvest)",
        "water": "High — needs warm, humid conditions with standing water",
        "soil": "Alluvial loamy soils in river basins",
        "regions": ["West Bengal", "Bihar", "Assam", "Odisha"],
        "temperature": "24–27°C",
        "rainfall": "150–175 mm",
        "tips": [
            "Retting (soaking stems in water) is key to fiber quality",
            "West Bengal produces 60%+ of India's jute",
            "Government mandates jute packaging for foodgrains and sugar",
            "Diversified jute products (geo-textiles, composites) have growing demand",
        ],
        "market": "Government-backed MSP and mandatory packaging ensure stable demand",
    },
    "coffee": {
        "name": "Coffee",
        "emoji": "☕",
        "season": "Flowering: March, Harvest: Nov–Feb (Arabica), Jan–April (Robusta)",
        "water": "Moderate — shade-grown, irrigation during dry spells",
        "soil": "Well-drained laterite, forest loam; acidic (pH 5.5–6.5)",
        "regions": [
            "Karnataka (Coorg, Chikmagalur, Hassan)",
            "Kerala (Wayanad)",
            "Tamil Nadu (Nilgiris, Yercaud)",
        ],
        "temperature": "23–28°C",
        "rainfall": "100–175 mm",
        "tips": [
            "India grows both Arabica (high altitude) and Robusta (lower altitude)",
            "Shade trees (silver oak, erythrina) are essential for quality",
            "White stem borer is a major pest — trapping and removal required",
            (
                "Specialty/single-origin Indian coffees (Monsooned Malabar) "
                "fetch premium export prices"
            ),
        ],
        "market": "80% of Indian coffee is exported; growing domestic café culture",
    },
}

# Intent patterns for rule-based matching
INTENTS = {
    "greeting": {
        "patterns": ["hello", "hi", "hey", "namaste", "good morning", "good evening", "help"],
        "response": (
            "Hello! 🌾 I'm KisanBot, your agricultural assistant. I can help you with:\n\n"
            "• **Crop recommendations** — Tell me your soil and weather conditions\n"
            "• **Growing guides** — Ask about any of our 22 supported crops\n"
            "• **Regional advice** — Find crops suited to your area\n"
            "• **Best practices** — Soil management, irrigation, pest control tips\n\n"
            "How can I help you today?"
        ),
    },
    "farewell": {
        "patterns": ["bye", "goodbye", "thank", "thanks", "dhanyavaad"],
        "response": (
            "You're welcome! 🙏 Remember, KisanSense is always here to help. "
            "Happy farming! 🌾"
        ),
    },
    "what_is": {
        "patterns": ["what is kisansense", "what does this do", "about", "what can you do"],
        "response": (
            "KisanSense is an ML-powered crop advisory system for Indian farmers. 🌾\n\n"
            "**What it does:**\n"
            "• Analyzes your soil nutrients (N, P, K, pH) and weather "
            "(temperature, humidity, rainfall)\n"
            "• Recommends the top 3 best-suited crops with confidence scores\n"
            "• Monitors model health and data drift in real-time\n\n"
            "**How to use it:**\n"
            "1. Go to **Crop Advisory** page\n"
            "2. Enter your soil test values and weather conditions\n"
            "3. Get instant, AI-powered crop recommendations\n\n"
            "The model is trained on Indian agricultural data covering "
            "22 crops across 12+ agro-climatic zones!"
        ),

    },
    "soil_help": {
        "patterns": ["soil test", "how to test soil", "npk", "where to test", "soil testing"],
        "response": (
            "**How to get your soil tested** 🧪\n\n"
            "1. **Nearest KVK (Krishi Vigyan Kendra)** — Free or low-cost soil testing\n"
            "2. **State Agricultural University labs** — Professional analysis\n"
            "3. **Soil Health Card Scheme** — Government of India provides free testing\n"
            "   - Visit: soilhealth.dac.gov.in\n"
            "4. **Private labs** — Quick results (2–3 days)\n\n"
            "**What you need:**\n"
            "• Collect soil from 6–8 spots in your field at 15 cm depth\n"
            "• Mix them together, take a 500g sample\n"
            "• Air-dry before submitting\n\n"
            "You'll get N (Nitrogen), P (Phosphorus), K (Potassium), and pH values — "
            "enter these directly into KisanSense!"
        ),
    },
}


# Regional suggestions by broad zone
REGIONAL_CROPS = {
    "north": {
        "states": ["punjab", "haryana", "uttar pradesh", "delhi", "up"],
        "zone": "Indo-Gangetic Plain",
        "crops": ["rice", "maize", "mungbean", "lentil", "mango", "banana"],
    },
    "south": {
        "states": ["tamil nadu", "kerala", "karnataka", "andhra pradesh", "telangana", "ap"],
        "zone": "Southern Plateau & Coastal",
        "crops": ["rice", "coconut", "coffee", "banana", "mango", "papaya", "cotton"],
    },
    "west": {
        "states": ["maharashtra", "gujarat", "rajasthan", "goa"],
        "zone": "Western Dry & Deccan Plateau",
        "crops": ["cotton", "grapes", "pomegranate", "mango", "mothbeans", "muskmelon", "orange"],
    },
    "east": {
        "states": ["west bengal", "odisha", "bihar", "jharkhand", "assam"],
        "zone": "Eastern Humid & Gangetic",
        "crops": ["rice", "jute", "maize", "lentil", "banana", "watermelon"],
    },
    "hills": {
        "states": ["himachal pradesh", "jammu", "kashmir", "uttarakhand", "shimla"],
        "zone": "Western Himalayan Temperate",
        "crops": ["apple", "kidneybeans", "maize", "lentil"],
    },
    "central": {
        "states": ["madhya pradesh", "chhattisgarh", "mp"],
        "zone": "Central Plateau & Hills",
        "crops": ["chickpea", "lentil", "cotton", "pigeonpeas", "orange", "maize"],
    },
}


def match_intent(message: str) -> dict | None:
    """Match user message against known intents."""
    msg_lower = message.lower().strip()
    for intent_key, intent in INTENTS.items():
        for pattern in intent["patterns"]:
            if pattern in msg_lower:
                return {"type": intent_key, "response": intent["response"]}
    return None


def find_crop_info(message: str) -> dict | None:
    """Find crop information mentioned in the user's message."""
    msg_lower = message.lower()
    for crop_id, info in CROP_KNOWLEDGE.items():
        # Check crop name, id, and common aliases
        if crop_id in msg_lower or info["name"].lower() in msg_lower:
            return {"crop_id": crop_id, **info}
    # Common Hindi/alias names
    aliases = {
        "chana": "chickpea",
        "dal": "lentil",
        "masoor": "lentil",
        "rajma": "kidneybeans",
        "toor": "pigeonpeas",
        "arhar": "pigeonpeas",
        "moong": "mungbean",
        "urad": "blackgram",
        "matki": "mothbeans",
        "santra": "orange",
        "kapas": "cotton",
        "dhan": "rice",
        "gehu": "maize",
        "makka": "maize",
        "nariyal": "coconut",
        "kela": "banana",
        "aam": "mango",
        "seb": "apple",
        "angoor": "grapes",
        "tarbooz": "watermelon",
        "kharbooza": "muskmelon",
        "anar": "pomegranate",
        "papita": "papaya",
    }
    for alias, crop_id in aliases.items():
        if alias in msg_lower:
            info = CROP_KNOWLEDGE[crop_id]
            return {"crop_id": crop_id, **info}
    return None


def find_region(message: str) -> dict | None:
    """Find regional suggestions based on state/region mentioned."""
    msg_lower = message.lower()
    for region_key, region in REGIONAL_CROPS.items():
        if region_key in msg_lower:
            return region
        for state in region["states"]:
            if state in msg_lower:
                return region
    return None


def format_crop_response(crop_info: dict) -> str:
    """Format a rich crop information response."""
    c = crop_info
    regions_str = ", ".join(c["regions"][:5])
    tips_str = "\n".join(f"  • {tip}" for tip in c["tips"][:3])
    return (
        f"{c['emoji']} **{c['name']}**\n\n"
        f"📅 **Season:** {c['season']}\n"
        f"🌡️ **Temperature:** {c['temperature']}\n"
        f"🌧️ **Rainfall:** {c['rainfall']}\n"
        f"💧 **Water needs:** {c['water']}\n"
        f"🌍 **Best regions:** {regions_str}\n"
        f"🧪 **Soil:** {c['soil']}\n\n"
        f"**Growing Tips:**\n{tips_str}\n\n"
        f"📈 **Market:** {c['market']}"
    )


def format_region_response(region_info: dict) -> str:
    """Format a regional crop suggestion response."""
    crops_str = ", ".join(region_info["crops"][:6])
    return (
        f"🗺️ **{region_info['zone']}**\n\n"
        f"Best crops for this region: **{crops_str}**\n\n"
        "Would you like to know more about any specific crop? "
        "You can also enter your soil readings on the **Crop Advisory** "
        "page for a precise recommendation!"
    )


GROQ_SYSTEM_PROMPT = """You are KisanBot, an intelligent, empathetic agricultural advisory
assistant built into the KisanSense platform.
Your mission is to help Indian farmers, agricultural extension workers, and students make
sound agronomic decisions.

KisanSense features a machine learning model for 22 crops:
Rice, Maize, Chickpea (Chana), Kidneybeans (Rajma), Pigeonpeas (Arhar/Toor),
Mothbeans (Matki), Mungbean (Moong), Blackgram (Urad), Lentil (Masoor),
Pomegranate (Anar), Banana (Kela), Mango (Aam), Grapes (Angoor), Watermelon (Tarbooz),
Muskmelon (Kharbooza), Apple (Seb), Orange (Santra), Papaya (Papita),
Coconut (Nariyal), Cotton (Kapas), Jute, Coffee.

Guidelines:
1. Provide accurate, practical farming advice tailored to Indian soils (Alluvial, Black,
   Red, Laterite, Sandy), seasons (Kharif, Rabi, Zaid), and agro-climatic zones.
2. Structure your answers with clear formatting: bullet points, bold key terms, and emojis.
3. Keep responses concise, direct, and conversational (around 2-4 short sections or bullet points).
4. If the user mentions regional Indian crop names (like chana, toor, dhan, kapas, gehu),
   recognize and use them naturally.
5. If KisanSense model predictions or soil inputs are given, explain why the recommended crop
   suits those conditions and suggest next agricultural steps.
"""


def call_groq_llm(message: str, prediction: dict | None = None) -> dict | None:
    """Call Groq API using qwen/qwen3.8-27b with KisanSense context."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

    user_prompt = message
    if prediction and "recommendations" in prediction:
        recs_text = ", ".join(
            f"{r['crop'].title()} ({r['confidence'] * 100:.1f}%)"
            for r in prediction["recommendations"]
        )
        user_prompt += (
            "\n\n[Context from KisanSense ML Model: The model analyzed "
            f"soil & weather readings and recommended: {recs_text}]"
        )

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": GROQ_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.6,
                "max_tokens": 500,
            },
            timeout=8,
        )
        if resp.status_code == 200:
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            if content:
                crop_info = find_crop_info(message)
                crop_card = (
                    {"id": crop_info["crop_id"], "name": crop_info["name"]} if crop_info else None
                )
                suggestions = [
                    "Best crops for my region",
                    "How to test soil",
                    "Go to Crop Advisory",
                ]
                if crop_info:
                    suggestions = [
                        f"Growing tips for {crop_info['name']}",
                        f"Water requirements for {crop_info['name']}",
                        "Compare with another crop",
                    ]
                return {
                    "reply": content,
                    "suggestions": suggestions,
                    "crop_card": crop_card,
                }
    except Exception:
        # Fallback to local rule engine if Groq is slow/offline
        pass
    return None


def generate_response(message: str, prediction: dict | None = None) -> dict:
    """Generate a chatbot response using Groq LLM with offline fallback.

    Returns:
        dict with keys: reply (str), suggestions (list[str]), crop_card (dict|None)
    """
    # 1. Try Groq LLM first if available
    llm_result = call_groq_llm(message, prediction)
    if llm_result:
        return llm_result

    # 2. Offline fallback engine
    suggestions = ["Tell me about rice", "Best crops for Maharashtra", "How to test soil"]

    # Direct intents
    intent = match_intent(message)
    if intent:
        if intent["type"] == "greeting":
            suggestions = [
                "What crops grow in my area?",
                "Tell me about cotton",
                "How to test soil",
            ]
        return {"reply": intent["response"], "suggestions": suggestions, "crop_card": None}

    # Crop information requests
    crop_info = find_crop_info(message)
    if crop_info:
        crop_id = crop_info["crop_id"]
        reply = format_crop_response(crop_info)
        suggestions = [
            f"Best regions for {crop_info['name']}",
            "Compare with another crop",
            "Go to Crop Advisory",
        ]
        return {
            "reply": reply,
            "suggestions": suggestions,
            "crop_card": {"id": crop_id, "name": crop_info["name"]},
        }

    # Regional queries
    region_info = find_region(message)
    if region_info:
        reply = format_region_response(region_info)
        suggestions = [f"Tell me about {c}" for c in region_info["crops"][:3]]
        return {"reply": reply, "suggestions": suggestions, "crop_card": None}

    # If prediction context is provided, explain it
    if prediction:
        recs = prediction.get("recommendations", [])
        if recs:
            top = recs[0]
            crop_info = CROP_KNOWLEDGE.get(top["crop"])
            reply = (
                f"Based on your soil and weather data, **{top['crop'].title()}** is the best match "
            )
            reply += f"with **{top['confidence'] * 100:.0f}%** confidence!\n\n"
            if crop_info:
                reply += format_crop_response({"crop_id": top["crop"], **crop_info})
            suggestions = [f"Tell me about {r['crop']}" for r in recs[:3]]
            return {
                "reply": reply,
                "suggestions": suggestions,
                "crop_card": {"id": top["crop"], "name": top["crop"].title()},
            }

    # Comparison queries
    msg_lower = message.lower()
    if (
        "compare" in msg_lower
        or "difference" in msg_lower
        or "vs" in msg_lower
        or "versus" in msg_lower
    ):
        return {
            "reply": (
                "I can help you compare crops! 🔄\n\n"
                "Please mention two crops you'd like to compare, for example:\n"
                '• "Compare rice and maize"\n'
                '• "Rice vs cotton"\n\n'
                "Or tell me your soil and weather conditions, and I'll suggest the best options!"
            ),
            "suggestions": [
                "Compare rice and maize",
                "Compare cotton and jute",
                "Tell me about chickpea",
            ],
            "crop_card": None,
        }


    # Default fallback
    return {
        "reply": "I'm not sure I understood that. 🤔 Here are some things I can help with:\n\n"
        '• **Crop information** — Ask about any of the 22 crops (e.g., "Tell me about rice")\n'
        '• **Regional advice** — Mention your state (e.g., "Best crops for Maharashtra")\n'
        "• **Soil testing** — Learn how to test your soil\n"
        "• **Recommendations** — Go to the Crop Advisory page and enter your readings\n\n"
        "Try asking me something specific!",
        "suggestions": ["Tell me about rice", "Best crops for Gujarat", "How to test soil"],
        "crop_card": None,
    }
