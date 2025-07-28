import pandas as pd

def parse_revenue(value):
    if not isinstance(value, str) or value.strip() in ["", "—", "N/A"]:
        return 0
    value = value.strip().upper().replace("$", "")  # ← this line is new
    multiplier = 1
    if value.endswith("B"):
        multiplier = 1_000_000_000
        value = value[:-1]
    elif value.endswith("M"):
        multiplier = 1_000_000
        value = value[:-1]
    elif value.endswith("K"):
        multiplier = 1_000
        value = value[:-1]
    try:
        return int(float(value) * multiplier)
    except ValueError:
        return 0

# Load the original file
df = pd.read_csv("imdb_posters.csv")

# Modify the Revenue column in place
df.rename(columns={"Revenue_$": "Revenue"}, inplace=True)
df["Revenue"] = df["Revenue"].apply(parse_revenue)

# Save back to the same file
df.to_csv("imdb_posters.csv", index=False)

print("✅ Revenue column cleaned in data/imdb_posters.csv")