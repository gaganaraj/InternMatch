
import os
import hashlib
import secrets
import getpass
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.local")

password = getpass.getpass("Enter your NEW admin password: ")
confirm = getpass.getpass("Confirm your admin password: ")

if password != confirm:
    raise ValueError("Passwords do not match.")

if len(password) < 12:
    raise ValueError("Use at least 12 characters.")

salt = secrets.token_bytes(16)

hashed = hashlib.scrypt(
    password.encode(),
    salt=salt,
    n=2**14,
    r=8,
    p=1,
    dklen=64
)

password_hash = f"scrypt${salt.hex()}${hashed.hex()}"

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)

cur = conn.cursor()

cur.execute("""
    UPDATE users
    SET password_hash = %s
    WHERE email = %s AND role = 'admin'
    RETURNING user_id
""", (password_hash, "admin@internmatch.demo"))

result = cur.fetchone()

if result:
    conn.commit()
    print("Admin password updated successfully!")
else:
    conn.rollback()
    print("Admin account not found.")

cur.close()
conn.close()
