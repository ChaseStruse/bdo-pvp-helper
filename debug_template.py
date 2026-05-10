import cv2
import os
import numpy as np

CLASS_ICONS_DIR = "backend/aos/class_icons"
SPEC_ICONS_DIR = "backend/aos/class_spec_icons"
IMAGE_PATH = "example_images/image.png"

def debug_matching():
    # This matches the extractor logic
    img = cv2.imread(IMAGE_PATH)
    height, width = img.shape[:2]
    
    # Let's just pick some hardcoded player positions from image.png (approximate)
    players = [
        {"name": "Valla", "x": 115, "y": 80},
        {"name": "Snoodle", "x": 115, "y": 120},
        {"name": "JoeKing", "x": 115, "y": 160},
        {"name": "Kuzs", "x": 845, "y": 80},
        {"name": "Bleuren", "x": 845, "y": 120},
        {"name": "Reez", "x": 845, "y": 160}
    ]

    
    for p in players:
        x_min = int(max(0, p["x"] - 130))
        x_max = int(p["x"])
        y_min = int(max(0, p["y"] - 5))
        y_max = int(p["y"] + 25)
        
        crop = img[y_min:y_max, x_min:x_max]
        cv2.imwrite(f"debug_{p['name']}_crop.png", crop)
        print(f"Saved {p['name']} crop")



if __name__ == "__main__":
    debug_matching()
