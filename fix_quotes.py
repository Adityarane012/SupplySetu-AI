import os
import glob

files = glob.glob('frontend/src/**/*.tsx', recursive=True)
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the trailing quote for template literals we injected
    content = content.replace('/api/orders");', '/api/orders`);')
    content = content.replace('/api/orders", {', '/api/orders`, {')
    content = content.replace('/api/orders?status=pending");', '/api/orders?status=pending`);')
    content = content.replace('/api/route/", {', '/api/route/`, {')
    content = content.replace('/api/simulator/message", {', '/api/simulator/message`, {')
    content = content.replace('/api/transcribe", {', '/api/transcribe`, {')
    content = content.replace('/api/transcribe/extract", {', '/api/transcribe/extract`, {')
    content = content.replace('/api/analytics/summary"),', '/api/analytics/summary`),')
    content = content.replace('/api/analytics/weekly"),', '/api/analytics/weekly`),')
    content = content.replace('/api/analytics/forecast")', '/api/analytics/forecast`)')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Quotes fixed.")
