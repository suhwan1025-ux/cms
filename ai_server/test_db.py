import psycopg2

try:
    conn = psycopg2.connect(
        host="172.22.32.200",
        port=5432,
        database="contract_management",
        user="postgres",
        password="meritz123!"
    )
    print("✅ DB 연결 성공!")
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM proposals")
    count = cursor.fetchone()[0]
    print(f"✅ 품의서 수: {count}건")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ DB 연결 실패: {e}")

