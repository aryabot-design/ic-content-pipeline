#!/bin/bash
# Refresh data from PostgreSQL and redeploy to Vercel

cd "$(dirname "$0")/.."

echo "Exporting data from PostgreSQL..."
python3 << 'PYEOF'
import psycopg2, json
conn = psycopg2.connect(dbname='classroots_review')
cur = conn.cursor()

cur.execute('SELECT * FROM content_pipeline.curriculum_modules ORDER BY id')
cols = [desc[0] for desc in cur.description]
with open('src/data/dump_curriculum.json', 'w') as f:
    json.dump([dict(zip(cols, r)) for r in cur.fetchall()], f, default=str)
print(f'  {cur.rowcount} curriculum modules exported')

cur.execute('SELECT * FROM content_pipeline.production_assets ORDER BY id')
cols = [desc[0] for desc in cur.description]
with open('src/data/dump_assets.json', 'w') as f:
    json.dump([dict(zip(cols, r)) for r in cur.fetchall()], f, default=str)
print(f'  {cur.rowcount} production assets exported')

cur.close()
conn.close()
PYEOF

echo "Deploying to Vercel..."
npx vercel --prod --yes 2>&1 | tail -3

echo "Done!"
