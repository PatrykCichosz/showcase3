import pandas as pd

df = pd.read_csv('routes.txt')
df.to_csv('routes.csv', index=False)

print("Filtered data saved to 'filtered_bus_stops.csv'")
