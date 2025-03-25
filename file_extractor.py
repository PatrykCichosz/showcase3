import pandas as pd

# Read the CSV file (change 'your_file.txt' to the correct path)
df = pd.read_csv('routes.txt')

# Save the filtered data to a new CSV file
df.to_csv('routes.csv', index=False)

print("Filtered data saved to 'filtered_bus_stops.csv'")
