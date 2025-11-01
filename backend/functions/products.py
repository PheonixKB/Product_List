from fastapi import APIRouter, HTTPException
from db.db import get_db_connection

router = APIRouter()

@router.get("/")
def get_products():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()  # This returns it to the pool
