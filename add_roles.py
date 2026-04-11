import json

file_path = '/Users/lynvalmorrison/Desktop/rate copy/src/processed_roles.json'

with open(file_path, 'r') as f:
    data = json.load(f)

# Add Videographer to Film And Tv
if "Film And Tv" in data:
    videographer = {
        "name": "Videographer",
        "models": [
            {"type": "Wedding / Event Film", "unit": "flat fee", "base": 1500},
            {"type": "Corporate Day Rate", "unit": "per day", "base": 800},
            {"type": "Social Media Content", "unit": "per video", "base": 250},
            {"type": "Promo / Commercial", "unit": "flat fee", "base": 3000}
        ],
        "materials": [
            {"name": "4K Camera Body", "cost": 800},
            {"name": "Lens Set (Prime/Zoom)", "cost": 300},
            {"name": "Lighting Kit (portable)", "cost": 200},
            {"name": "Audio Package (Lavalier/Shotgun)", "cost": 150},
            {"name": "Gimbal / Stabilizer", "cost": 100},
            {"name": "Editing Software Subscription", "cost": 10}
        ]
    }
    data["Film And Tv"]["roles"].append(videographer)

# Add Painter / Artist to Visual And Graphic Arts
if "Visual And Graphic Arts" in data:
    painter = {
        "name": "Painter / Artist",
        "models": [
            {"type": "Commissioned Canvas", "unit": "per piece", "base": 150},
            {"type": "Mural Production", "unit": "per sq ft", "base": 50},
            {"type": "Live Event Painting", "unit": "per event", "base": 500},
            {"type": "Solo Exhibition Piece", "unit": "per project", "base": 1000}
        ],
        "materials": [
            {"name": "Professional Paints (set)", "cost": 150},
            {"name": "Canvas / Substrate", "cost": 40},
            {"name": "Brushes / Palettes / Knives", "cost": 60},
            {"name": "Varnish / Finishing Supplies", "cost": 25},
            {"name": "Easel / Studio Gear", "cost": 200}
        ]
    }
    data["Visual And Graphic Arts"]["roles"].append(painter)

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print("Roles added successfully.")
