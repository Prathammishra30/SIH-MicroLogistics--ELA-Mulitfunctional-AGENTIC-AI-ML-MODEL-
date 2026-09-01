import psycopg2

conn = psycopg2.connect('postgresql://postgres:5432@localhost:5432/ruralflow')
cur = conn.cursor()
cur.execute('SELECT id, name, role FROM "User" WHERE role=\'FARMER\' LIMIT 1;')
row = cur.fetchone()
print("Farmer User:", row)
