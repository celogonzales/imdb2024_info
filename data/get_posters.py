import csv
import requests
import datetime
import urllib.parse

API_KEY = "325c4146339992f98abdc72c66ebbaae"
INPUT_CSV = "imdb_2024.csv"        # Replace with your file name
OUTPUT_CSV = "imdb_posters.csv"

def fetch_poster(title, year):
    base_url = "https://api.themoviedb.org/3/search/movie"

    # First attempt: strict search with year + exact title match
    params = {
        "api_key": API_KEY,
        "query": title,
        "year": year,
    }
    response = requests.get(base_url, params=params, verify=False)
    if response.ok:
        data = response.json()
        for result in data["results"]:
            result_title = result.get("title", "").strip().lower()
            release_date = result.get("release_date", "")
            result_year = release_date[:4] if release_date else ""
            if result_title == title.strip().lower() and result_year == year:
                if result.get("poster_path"):
                    return f"https://image.tmdb.org/t/p/w500{result['poster_path']}"

    # Fallback: loose search with just the title
    params_fallback = {
        "api_key": API_KEY,
        "query": title
    }
    response = requests.get(base_url, params=params_fallback, verify=False)
    if response.ok:
        data = response.json()
        if data["results"]:
            fallback_title = data["results"][0].get("title", "Unknown")
            print(f"⚠️  Fallback used for '{title}' → matched '{fallback_title}'")
            poster_path = data["results"][0].get("poster_path")
            if poster_path:
                return f"https://image.tmdb.org/t/p/w500{poster_path}"

    # Nothing found
    print(f"✗ No match found for '{title}' ({year})")
    return ""



with open(INPUT_CSV, newline='', encoding='utf-8') as infile, open(OUTPUT_CSV, "w", newline='', encoding='utf-8') as outfile:
    reader = csv.DictReader(infile)
    fieldnames = reader.fieldnames + ["Poster_URL"]
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()

    for row in reader:
        title = row["Movie_Name"]
        release_date = row["Release_Date"]
        try:
            parsed_date = datetime.datetime.strptime(release_date, "%m/%d/%y")
            year = str(parsed_date.year)
        except ValueError:
            year = ""

        row["Poster_URL"] = fetch_poster(title, year)
        print(f"✓ {title} ({year})")
        writer.writerow(row)

print("✅ Done! Poster URLs written to:", OUTPUT_CSV)
