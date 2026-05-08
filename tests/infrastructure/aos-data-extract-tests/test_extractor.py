import json
import os
import subprocess
import sys

# All imports at the top
# Functions limited to 50 lines
# File limited to 500 lines

def run_extractor(python_path, extractor_path, image_path):
    """Runs the extractor script and returns the parsed JSON output."""
    cmd = [python_path, extractor_path, image_path]
    # Run from the directory of extractor.py to ensure it finds everything
    extractor_dir = os.path.dirname(extractor_path)
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=extractor_dir)
    if result.returncode != 0:
        print(f"Error running extractor: {result.stderr}")
        return None
    try:
        # The extractor prints some debug info if not cleaned, 
        # but our latest version is clean.
        # However, we should find the JSON part in the output.
        output = result.stdout
        json_start = output.find('{')
        if json_start != -1:
            return json.loads(output[json_start:])
        return None
    except json.JSONDecodeError:
        print(f"Failed to decode JSON: {result.stdout}")
        return None

def compare_results(extracted, ground_truth, name):
    """Compares extracted data with ground truth."""
    matches = 0
    total = 0
    print(f"\n--- Results for {name} ---")
    for player, stats in ground_truth.items():
        if player not in extracted:
            print(f"MISSING: Player '{player}' not found.")
            total += len(stats)
            continue
        for key, value in stats.items():
            total += 1
            if extracted[player].get(key) == value:
                matches += 1
            else:
                print(f"MISMATCH: {player} -> {key}: Expected {value}, Got {extracted[player].get(key)}")
    
    accuracy = (matches / total) * 100 if total > 0 else 0
    print(f"Accuracy: {accuracy:.2f}% ({matches}/{total} matches)")
    return matches, total

def get_test_cases(project_root):
    """Finds image/json pairs in example-images."""
    example_dir = os.path.join(project_root, "example-images")
    cases = []
    # Match image.png -> image_json.json
    # Match image_2.png -> image_2_json.json
    for file in os.listdir(example_dir):
        if file.endswith(".png"):
            base = file[:-4] # 'image' or 'image_2'
            json_name = f"{base}_json.json"
            json_path = os.path.join(example_dir, json_name)
            if os.path.exists(json_path):
                cases.append({
                    "name": file,
                    "image": os.path.join(example_dir, file),
                    "json": json_path
                })
    return cases

def main():
    python_path = sys.argv[1] if len(sys.argv) > 1 else "python"
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    extractor_path = os.path.join(project_root, "infrastructure", "aos-data-extract", "extractor.py")
    
    test_cases = get_test_cases(project_root)
    total_matches = 0
    total_expected = 0
    
    for case in test_cases:
        with open(case["json"], 'r') as f:
            ground_truth = json.load(f)
        
        print(f"Testing {case['name']}...")
        extracted = run_extractor(python_path, extractor_path, case["image"])
        
        if extracted:
            m, t = compare_results(extracted, ground_truth, case["name"])
            total_matches += m
            total_expected += t
        else:
            print(f"FAILED to extract data for {case['name']}")
    
    if total_expected > 0:
        overall_acc = (total_matches / total_expected) * 100
        print(f"\nOVERALL ACCURACY: {overall_acc:.2f}% ({total_matches}/{total_expected})")

if __name__ == "__main__":
    main()
