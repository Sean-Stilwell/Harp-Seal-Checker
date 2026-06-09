import os
import csv
import pandas as pd
import folium
from flask import Flask, render_template

app = Flask(__name__)

def find_col(df, options):
    for opt in options:
        for col in df.columns:
            if col.strip().lower() == opt.lower():
                return col
    return None

def get_mock_data():
    return [
        { "id": "Seal A", "lat": 47.56, "lon": -52.71, "gender": "F", "age": "26 years", "age_num": 26, "area": "3L (NAFO) - Avalon Peninsula", "nafo_zone": "3LB", "meal": "Cod, Atlant", "otolith": 4.78, "prey_contents": {"Cod, Atlant": 1}, "total_prey_items": 1 },
        { "id": "Seal B", "lat": 49.80, "lon": -54.50, "gender": "F", "age": "2 years", "age_num": 2, "area": "3K (NAFO) - Northeast Coast", "nafo_zone": "3KI", "meal": "Capelin", "otolith": 2.22, "prey_contents": {"Capelin": 11, "Cod, Arctic": 4, "Herring": 1}, "total_prey_items": 16 },
        { "id": "Seal C", "lat": 50.40, "lon": -55.20, "gender": "F", "age": "15 years", "age_num": 15, "area": "3K (NAFO) - Northeast Coast", "nafo_zone": "3KH", "meal": "Snailfish", "otolith": 1.39, "prey_contents": {"Snailfish": 38, "Capelin": 7, "Herring": 1}, "total_prey_items": 46 },
        { "id": "Seal D", "lat": 50.40, "lon": -55.20, "gender": "F", "age": "1 year", "age_num": 1, "area": "3K (NAFO) - Northeast Coast", "nafo_zone": "3KH", "meal": "Capelin", "otolith": 4.82, "prey_contents": {"Capelin": 7, "Cod, Atlant": 11}, "total_prey_items": 18 },
        { "id": "Seal E", "lat": 49.80, "lon": -54.50, "gender": "M", "age": "27 years", "age_num": 27, "area": "3K (NAFO) - Northeast Coast", "nafo_zone": "3KI", "meal": "Shrimp, Unidentified", "otolith": 1.0, "prey_contents": {"Shrimp, Unidentified": 1}, "total_prey_items": 1 }
    ]

def load_nafo_reference(filepath='static/images/NAFO_Divisions_2021.csv'):
    if not os.path.exists(filepath):
        print(f"[DEBUG] NAFO divisions reference file not found at '{filepath}'. Using default fallbacks.")
        return {}
        
    try:
        # Added encoding='latin-1' to handle non-UTF-8 characters
        df = pd.read_csv(filepath, encoding='latin-1')
        df.columns = [c.strip() for c in df.columns]
        
        # Identify columns
        div_col = find_col(df, ['label', 'nafo_divis', 'nafo_sub/', 'nafo', 'zone', 'code'])
        lat_col = find_col(df, ['lat_dd', 'latitude', 'lat', 'y'])
        lon_col = find_col(df, ['long_dd', 'longitude', 'lon', 'lng', 'x'])
        name_col = find_col(df, ['name', 'area', 'description', 'areaname'])
        
        if not div_col: div_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]
        if not lat_col: lat_col = find_col(df, ['latitude', 'lat']) or df.columns[-5]
        if not lon_col: lon_col = find_col(df, ['longitude', 'lon', 'lng']) or df.columns[-4]
        
        nafo_map = {}
        grouped = df.groupby(div_col)
        for div_val, group in grouped:
            div_clean = str(div_val).strip().upper()
            try:
                lat_val = float(group[lat_col].mean())
                lon_val = float(group[lon_col].mean())
            except:
                continue
                
            name_val = str(group[name_col].iloc[0]).strip() if name_col and not pd.isna(group[name_col].iloc[0]) else f"{div_clean} (NAFO)"
            nafo_map[div_clean] = (lat_val, lon_val, name_val)
            
        return nafo_map
    except Exception as e:
        print(f"[DEBUG] Error loading NAFO reference file: {e}")
        return {}

def parse_seals_csv(filepath='static/images/OPENDATA_HarpDietData2017-2021_EN.csv'):
    # Try to find target CSV or fallback to any CSV in current directory
    if not os.path.exists(filepath):
        csv_files = [f for f in os.listdir('.') if f.endswith('.csv')]
        if csv_files:
            filepath = csv_files[0]
            print(f"[DEBUG] Target CSV not found at '{filepath}'. Loaded fallback seals source: {filepath}")
        else:
            print("[DEBUG] Target CSV not found. Rendering built-in mock dataset.")
            return get_mock_data()
            
    # Load NAFO Divisions reference file and compute centroids
    nafo_map = load_nafo_reference('static/images/NAFO_Divisions_2021.csv')
            
    try:
        df = pd.read_csv(filepath)
    except UnicodeDecodeError as e:
        print(f"Pandas error: {e}") # Should not happen now
    except Exception as e:
        print(f"[DEBUG] Error reading CSV: {e}. Rendering mock dataset.")
        return get_mock_data()
        
    df.columns = [c.strip() for c in df.columns]
    
    # Locate column handles case-insensitively
    id_col = find_col(df, ['sealid', 'seal_id', 'id', 'seal'])
    sex_col = find_col(df, ['sex', 'gender', 's'])
    age_col = find_col(df, ['age', 'a'])
    nafo_col = find_col(df, ['nafo', 'nafo_zone', 'nafo_division', 'location', 'area'])
    prey_col = find_col(df, ['prey', 'prey_name', 'food', 'preycode'])
    num_col = find_col(df, ['numberofl', 'quantity', 'count', 'num_prey', 'number'])
    
    if not id_col:
        print("[DEBUG] 'SealID' column absent. Rendering mock dataset.")
        return get_mock_data()
        
    df[id_col] = df[id_col].astype(str).str.strip()
    grouped = df.groupby(id_col)
    seals_list = []
    
    for seal_id, group in grouped:
        sex = 'U'
        if sex_col:
            raw_sex = group[sex_col].iloc[0]
            if not pd.isna(raw_sex) and str(raw_sex).strip():
                sex = str(raw_sex).strip().upper()[0]
                if sex not in ['M', 'F']:
                    sex = 'U'
                    
        age_display = 'Unknown'
        age_num = None
        if age_col:
            raw_age = group[age_col].iloc[0]
            if not pd.isna(raw_age) and str(raw_age).strip() and str(raw_age).upper() not in ['NA', 'NAN']:
                try:
                    age_num = int(float(raw_age))
                    age_display = f"{age_num} years"
                except:
                    pass
                    
        nafo = 'Unknown'
        if nafo_col:
            raw_nafo = group[nafo_col].iloc[0]
            if not pd.isna(raw_nafo) and str(raw_nafo).strip():
                nafo = str(raw_nafo).strip()
                
        lat, lon, area_name = 48.56, -52.71, f"{nafo} (NAFO)" # default (fail)
        
        nafo_upper = nafo.upper()
        nafo_clean = nafo_upper.replace('-', '').replace(' ', '')
        if nafo_map:
            # 1. Dash-free exact match check (3LB matches key 3L-B)
            matched = False
            for key, val in nafo_map.items():
                key_clean = key.replace('-', '').replace(' ', '')
                if nafo_clean == key_clean:
                    lat, lon, area_name = val
                    matched = True
                    break
                    
            # 2. Dash-free prefix match (if code is 3LB and map has 3L)
            if not matched:
                for key, val in nafo_map.items():
                    key_clean = key.replace('-', '').replace(' ', '')
                    if nafo_clean.startswith(key_clean) or key_clean.startswith(nafo_clean):
                        lat, lon, area_name = val
                        matched = True
                        break
                        
            # 3. Dash-free substring match
            if not matched:
                for key, val in nafo_map.items():
                    key_clean = key.replace('-', '').replace(' ', '')
                    if key_clean in nafo_clean or nafo_clean in key_clean:
                        lat, lon, area_name = val
                        break
            
        prey_items = {}
        total_items = 0
        
        for _, row in group.iterrows():
            if prey_col:
                prey_val = row[prey_col]
                if pd.isna(prey_val) or str(prey_val).strip() == '' or str(prey_val).lower() == 'empty' or 'empty' in str(prey_val).lower() or '9998' in str(prey_val):
                    continue
                    
                prey_name = str(prey_val).strip()
                if prey_name.startswith(('1', '2', '3', '4', '5', '6', '7', '8', '9', '0')):
                    parts = prey_name.split(maxsplit=1)
                    if len(parts) > 1:
                        prey_name = parts[1]
                        
                count = 1
                if num_col and not pd.isna(row[num_col]):
                    try:
                        count = int(float(row[num_col]))
                    except:
                        pass
                        
                prey_items[prey_name] = prey_items.get(prey_name, 0) + count
                total_items += count
                
        if not prey_items:
            prey_items['Empty'] = 1
            meal = "Empty"
        else:
            meal = max(prey_items, key=prey_items.get)
            
        # Parse Otolith size mean
        otolith_val = None
        part_cols = [c for c in group.columns if 'partmeasur' in c.lower()]
        if len(part_cols) > 1:
            ot_col = part_cols[-1]
            otolith_series = pd.to_numeric(group[ot_col], errors='coerce').dropna()
            if not otolith_series.empty:
                otolith_val = round(float(otolith_series.mean()), 2)
        elif len(group.columns) > 18:
            ot_col = group.columns[18]
            otolith_series = pd.to_numeric(group[ot_col], errors='coerce').dropna()
            if not otolith_series.empty:
                otolith_val = round(float(otolith_series.mean()), 2)
                
        if otolith_val is None or pd.isna(otolith_val):
            otolith_val = 1.0
            
        seals_list.append({
            "id": f"SEAL-{seal_id}",
            "raw_id": seal_id,
            "lat": lat,
            "lon": lon,
            "gender": sex,
            "age": age_display,
            "age_num": age_num,
            "area": area_name,
            "nafo_zone": nafo,
            "meal": meal,
            "otolith": otolith_val,
            "prey_contents": prey_items,
            "total_prey_items": total_items
        })
        
    return seals_list

@app.route('/')
def home():
    seals = parse_seals_csv('static/images/OPENDATA_HarpDietData2017-2021_EN.csv')
    
    if seals:
        avg_lat = sum(s['lat'] for s in seals) / len(seals)
        avg_lon = sum(s['lon'] for s in seals) / len(seals)
        m = folium.Map(location=[avg_lat, avg_lon], zoom_start=5, control_scale=True)
    else:
        m = folium.Map(location=[50.5, -56.5], zoom_start=5, control_scale=True)
    
    # Group seals by NAFO zone to represent markers on the map (exactly one marker per unique NAFO zone)
    nafo_groups = {}
    for seal in seals:
        zone = seal['nafo_zone']
        if zone not in nafo_groups:
            nafo_groups[zone] = []
        nafo_groups[zone].append(seal)
        
    for zone, group in nafo_groups.items():
        base_size = 35
        # Total stomach content
        total_prey_in_group = sum(s["total_prey_items"] for s in group)
        scale_modifier = min(max(total_prey_in_group * 0.3, 5), 30)
        size = int(base_size + scale_modifier)
        
        # Coordinates for the NAFO zone centroid
        lat = group[0]['lat']
        lon = group[0]['lon']
        area_name = group[0]['area']
        
        icon_html = f"""
        <div onclick="window.parent.selectSealFromMap('{zone}'); event.stopPropagation();" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            width: {size}px;
        ">
            <div style="
                width: {size}px;
                height: {size}px;
                border: 2px solid #3498db;
                background: white;
                border-radius: 50%;
                overflow: hidden;
                box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                transition: transform 0.2s ease, border-color 0.2s ease;
            " onmouseover="this.style.transform='scale(1.15)'; this.style.borderColor='#2ecc71';" onmouseout="this.style.transform='scale(1)'; this.style.borderColor='#3498db';">
                <img src="/static/images/Seal%20Icon.png" style="width: 100%; height: 100%; object-fit: cover;" alt="seal">
            </div>
            <div style="
                font-size: 10px;
                font-weight: bold;
                background: rgba(255, 255, 255, 0.9);
                padding: 1px 4px;
                border: 1px solid #ccc;
                border-radius: 3px;
                margin-top: 3px;
                white-space: nowrap;
                user-select: none;
            ">{zone}</div>
        </div>
        """
        
        icon = folium.DivIcon(
            html=icon_html,
            icon_size=(size, size + 20),
            icon_anchor=(size / 2, size / 2)
        )
        
        folium.Marker(
            location=[lat, lon],
            icon=icon,
            tooltip=f"{zone} Zone ({len(group)} seals)"
        ).add_to(m)
        
    map_html = m._repr_html_()
    return render_template('index.html', map_html=map_html, seals_data=seals)

if __name__ == '__main__':
    app.run(debug=True)