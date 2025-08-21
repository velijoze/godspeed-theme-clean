#!/usr/bin/env python3
import json

# Read the settings schema
with open('config/settings_schema.json', 'r') as f:
    settings = json.load(f)

# Find and remove the API Integration section
api_section = None
for i, section in enumerate(settings):
    if isinstance(section, dict) and section.get('name') == 'API Integration':
        api_section = settings.pop(i)
        break

if api_section:
    # Insert it at position 2 (after theme_info and Color)
    settings.insert(2, api_section)
    
    # Write back to file
    with open('config/settings_schema.json', 'w') as f:
        json.dump(settings, f, indent=2)
    
    print("✅ Moved API Integration section to position 2")
else:
    print("❌ API Integration section not found")