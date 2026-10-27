import urllib.request
import json
import re
import os

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def determine_season_and_year(name, start_time):
    # Check patterns like 2025-2026, 2024-2025, 2023-2024, 2022-2023, 2021-2022 etc.
    # or 2026, 2025, 2024, 2023
    m_season = re.search(r'\b(20[0-2]\d)\s*[-–/]\s*(20[0-2]\d)\b', name)
    if m_season:
        y1, y2 = int(m_season.group(1)), int(m_season.group(2))
        return f"{y1}-{y2}", str(max(y1, y2))
    
    # Pattern like 23-24, 24-25, 25-26
    m_short_season = re.search(r'\b(2[0-3])\s*[-–/]\s*(2[0-9])\b', name)
    if m_short_season:
        y1, y2 = 2000 + int(m_short_season.group(1)), 2000 + int(m_short_season.group(2))
        return f"{y1}-{y2}", str(max(y1, y2))
        
    m_single = re.search(r'\b(20[0-2]\d)\b', name)
    if m_single:
        y = m_single.group(1)
        return y, y

    # fallback to startTimeSeconds year
    if start_time:
        import datetime
        dt = datetime.datetime.fromtimestamp(start_time, tz=datetime.timezone.utc)
        y = str(dt.year)
        return y, y
        
    return "Other", "Other"

def categorize_region(name):
    lower = name.lower()
    if any(k in lower for k in ["dhaka", "bangladesh"]):
        return "Asia Dhaka"
    if any(k in lower for k in ["nwerc", "swerc", "cerc", "seerc", "euc", "european", "nerc", "neerc", "samara", "subregional", "russia", "belarus"]):
        if any(k in lower for k in ["nwerc", "swerc", "cerc", "seerc", "euc", "european", "nerc", "neerc"]):
            return "Europe Region"
    if any(k in lower for k in ["brazil", "mexico", "colombia", "argentina", "latin", "caribbean", "south america", "venezuela", "chile", "peru"]):
        return "Latin America"
    if any(k in lower for k in ["north america", "nac", "mid-atlantic", "northeastern", "mid-central", "pacific northwest", "rocky", "greater ny", "southeast", "midwest", "socal"]):
        return "North America"
    if any(k in lower for k in ["acpc", "arab", "egypt", "africa", "tunisia", "morocco", "jordan", "syria", "lebanon", "angola"]):
        return "Africa & Arab (ACPC)"
    if any(k in lower for k in ["asia", "taichung", "seoul", "yokohama", "hanoi", "jakarta", "taiwan", "japan", "korea", "vietnam", "singapore", "manila", "nanjing", "shanghai", "beijing", "jinan", "hefei", "guilin", "hangzhou", "kunming", "chennai", "amritapuri", "kanpur", "kharagpur", "gwalior"]):
        return "Asia Region"
    
    return "Global / Other Region"

def categorize_type(name):
    lower = name.lower()
    if "preliminary" in lower or "qualifier" in lower or "qualification" in lower:
        return "Preliminary / Qualifier"
    if "subregional" in lower or "sub-regional" in lower:
        return "Subregional"
    if "championship" in lower or "finals" in lower or "final" in lower or "nac" in lower or "euc" in lower:
        return "Championship / Super-Regional"
    if "invitational" in lower or "friendly" in lower:
        return "Invitational"
    return "Regional Contest"

def fetch_and_build():
    url = "https://codeforces.com/api/contest.list?gym=true"
    print("Fetching Gym contest list from Codeforces...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
        data = json.loads(raw)
        
    contests = data.get("result", [])
    print(f"Total raw Gym contests: {len(contests)}")
    
    icpc_list = []
    
    for c in contests:
        name = clean_text(c.get("name", ""))
        lower = name.lower()
        
        # ICPC criteria:
        # Must mention ICPC or ACM or Regional contest / specific regional name
        is_icpc = False
        if any(k in lower for k in ["icpc", "acm-icpc", "acmicpc"]):
            is_icpc = True
        elif "regional" in lower and any(k in lower for k in ["contest", "programming", "collegiate", "championship"]):
            is_icpc = True
        elif any(k in lower for k in ["cerc", "nwerc", "swerc", "seerc", "nerc", "neerc", "euc", "acpc", "nac "]):
            is_icpc = True
            
        if not is_icpc:
            continue
            
        # Exclude high school / non-collegiate unless ICPC tagged
        if "school" in lower and "icpc" not in lower:
            continue
            
        cid = c.get("id")
        start_time = c.get("startTimeSeconds", 0)
        duration = c.get("durationSeconds", 18000)
        difficulty = c.get("difficulty", 0)
        season, year = determine_season_and_year(name, start_time)
        region = categorize_region(name)
        ctype = categorize_type(name)
        
        icpc_list.append({
            "id": cid,
            "name": name,
            "season": season,
            "year": year,
            "region": region,
            "type": ctype,
            "difficulty": difficulty,
            "duration": duration,
            "startTime": start_time,
            "gymUrl": f"https://codeforces.com/gym/{cid}",
            "standingsUrl": f"https://codeforces.com/gym/{cid}/standings"
        })
        
    # Sort by ID descending (usually newer contests have higher ID)
    icpc_list.sort(key=lambda x: x["id"], reverse=True)
    
    print(f"Filtered {len(icpc_list)} ICPC contests.")
    
    # Save to data directory
    os.makedirs("data", exist_ok=True)
    output_path = os.path.join("data", "contests.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(icpc_list, f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(icpc_list)} contests to {output_path}")

if __name__ == "__main__":
    fetch_and_build()
