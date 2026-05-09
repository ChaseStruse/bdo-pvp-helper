import cv2
import easyocr
import json
import re
import numpy as np
import os

# All imports at the top
# Functions limited to 50 lines

CLASS_ICONS_DIR = os.path.join(os.path.dirname(__file__), "class_icons")
SPEC_ICONS_DIR = os.path.join(os.path.dirname(__file__), "class_spec_icons")

CLASS_NAME_MAP = {
    "darkknight": "Dark Knight",
    "dark_knight": "Dark Knight",
    "hashashin": "Hashashin",
    "wukong": "Wukong",
    "warrior": "Warrior",
    "sorceress": "Sorceress",
    "maegu": "Maegu",
    "woosa": "Woosa"
}


SPEC_NAME_MAP = {
    "awakening": "Awakening",
    "succession": "Succession",
    "ascension": "Ascension"
}

# File limited to 500 lines

def initialize_reader():
    """Initializes the EasyOCR reader."""
    return easyocr.Reader(['en'])

def load_image(image_path):
    """Loads image from path using OpenCV."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at {image_path}")
    return cv2.imread(image_path)

def detect_from_templates(crop, templates_dir, name_map=None):
    """Matches a crop against all templates in a directory and returns the best match."""
    if not os.path.exists(templates_dir) or crop.size == 0: return "Unknown", 0
    
    best_match = "Unknown"
    max_val = 0.35 # Lower threshold to find matches in lower resolution
    
    crop_h, crop_w = crop.shape[:2]



    
    for filename in os.listdir(templates_dir):
        if not filename.endswith(".png"): continue
        template = cv2.imread(os.path.join(templates_dir, filename))
        if template is None: continue
        
        # Resize template to match crop height
        t_h, t_w = template.shape[:2]
        scale = crop_h / t_h
        new_w = int(t_w * scale)
        if new_w > crop_w or new_w == 0: continue
        
        resized_tpl = cv2.resize(template, (new_w, crop_h), interpolation=cv2.INTER_AREA)
        res = cv2.matchTemplate(crop, resized_tpl, cv2.TM_CCOEFF_NORMED)
        _, val, _, _ = cv2.minMaxLoc(res)
        
        if val > max_val:
            max_val = val
            base_name = filename.replace(".png", "").lower()
            best_match = name_map.get(base_name, base_name.capitalize()) if name_map else base_name.capitalize()
            
    return best_match, max_val



def get_ocr_results(reader, image):
    """Performs OCR on the image with upscaling for better accuracy."""
    # Upscale image 2x to help with small text
    height, width = image.shape[:2]
    upscaled_img = cv2.resize(image, (width * 2, height * 2), interpolation=cv2.INTER_CUBIC)
    
    results = reader.readtext(upscaled_img)
    return upscaled_img, results

def parse_kd(kd_str):
    """Parses K/D string like '3 / 2' into kills and deaths."""
    # Remove whitespace and split by '/'
    parts = re.split(r'[/|]', kd_str.replace(" ", ""))
    if len(parts) == 2:
        try:
            return int(parts[0]), int(parts[1])
        except ValueError:
            pass
    return 0, 0

def clean_numeric(text):
    """Cleans numeric text and converts to int."""
    # Remove non-numeric characters (like commas or misread symbols)
    clean_str = re.sub(r'[^\d]', '', text)
    return int(clean_str) if clean_str else 0

def group_by_rows(results, threshold=15):
    """Groups OCR results into rows based on y-coordinate."""
    results.sort(key=lambda x: x[0][0][1])  # Sort by top-left y
    rows = []
    if not results:
        return rows
    
    current_row = [results[0]]
    for i in range(1, len(results)):
        curr_y = results[i][0][0][1]
        prev_y = current_row[-1][0][0][1]
        if abs(curr_y - prev_y) <= threshold:
            current_row.append(results[i])
        else:
            rows.append(current_row)
            current_row = [results[i]]
    rows.append(current_row)
    
    # Sort each row by x-coordinate
    for row in rows:
        row.sort(key=lambda x: x[0][0][0])
        
    return rows


def split_teams(row, mid_x):
    """Splits a row into left team and right team based on mid_x."""
    left = [item for item in row if item[0][0][0] < mid_x]
    right = [item for item in row if item[0][0][0] >= mid_x]
    return left, right

def extract_player_data(elements, upscaled_img, original_img, is_enemy=False):
    """Extracts player name and stats from a list of OCR elements."""
    # Expected order: Name, K/D, CC, Dealt, Taken, Healed
    text_list = [item[1] for item in elements]
    
    # Stricter K/D pattern: must be digit(s) / digit(s)
    kd_idx = -1
    for i, text in enumerate(text_list):
        if re.match(r'^\s*\d+\s*[/|]\s*\d+\s*$', text):
            kd_idx = i
            break
    
    if kd_idx == -1 or kd_idx == 0:
        return None, None
    
    name_el = elements[kd_idx - 1]
    name = name_el[1]
    if name.lower() in ["my", "en...", "vs", "lose", "win", "ace", "mvp"]:
        return None, None
        
    # Detect Class and Spec from ORIGINAL image area to the left of the name
    # OCR coordinates are in upscaled scale (2x), so divide by 2
    name_bbox = name_el[0]
    x_min = int(max(0, (name_bbox[0][0] / 2) - 180)) # Search 180px to the left in 1x
    x_max = int(name_bbox[0][0] / 2)
    y_min = int(max(0, (name_bbox[0][1] / 2) - 10))
    y_max = int((name_bbox[2][1] / 2) + 10)

    
    crop = original_img[y_min:y_max, x_min:x_max]
    p_class, _ = detect_from_templates(crop, CLASS_ICONS_DIR, CLASS_NAME_MAP)
    p_spec, _ = detect_from_templates(crop, SPEC_ICONS_DIR, SPEC_NAME_MAP)

    
    kills, deaths = parse_kd(text_list[kd_idx])
    
    try:
        data = {
            "Kills": kills,
            "Deaths": deaths,
            "CC": clean_numeric(text_list[kd_idx + 1]) if len(text_list) > kd_idx + 1 else 0,
            "Dealt": clean_numeric(text_list[kd_idx + 2]) if len(text_list) > kd_idx + 2 else 0,
            "Taken": clean_numeric(text_list[kd_idx + 3]) if len(text_list) > kd_idx + 3 else 0,
            "Healed": clean_numeric(text_list[kd_idx + 4]) if len(text_list) > kd_idx + 4 else 0,
            "Enemy": is_enemy,
            "Class": p_class,
            "Spec": p_spec
        }
        return name, data
    except (IndexError, ValueError):
        return None, None



def process_scoreboard(image_path):
    """Main function to process the image and return JSON."""
    reader = initialize_reader()
    image = load_image(image_path)
    
    upscaled_img, results = get_ocr_results(reader, image)
    height, width, _ = image.shape
    mid_x = width  # upscaled coordinates
    
    rows = group_by_rows(results, threshold=30)
    final_data = {}
    
    for row in rows:
        left_elements, right_elements = split_teams(row, mid_x)
        
        # Process left team (Enemy: False)
        for elements in [left_elements]:
            name, data = extract_player_data(elements, upscaled_img, image, is_enemy=False)
            if name and data and len(name) > 2:
                final_data[name] = data
                
        # Process right team (Enemy: True)
        for elements in [right_elements]:
            name, data = extract_player_data(elements, upscaled_img, image, is_enemy=True)
            if name and data and len(name) > 2:
                final_data[name] = data

                
    return final_data





if __name__ == "__main__":
    import sys
    img_path = sys.argv[1] if len(sys.argv) > 1 else "../../example_images/image.png"
    result = process_scoreboard(img_path)
    print(json.dumps(result, indent=4))
