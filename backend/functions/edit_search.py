# Product_List/backend/functions/edit_search.py
from fastapi import APIRouter, Request, HTTPException,Query
from db.db import get_db_connection
from models.models import Product

router = APIRouter()

conn=get_db_connection()

@router.put("/edit/{id}",tags=["edit"])
def edit_product(id: int,product: Product = None,request: Request = None):
    cursor=conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id=%s", (id,))
    existing_product=cursor.fetchone()
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    cursor.execute("UPDATE products SET name=%s, description=%s, price=%s WHERE id=%s", (product.name, product.description, product.price, id))
    conn.commit()
    
    return {"message": "Product updated successfully"}

@router.get("/search")
def search_products(q: str = Query(None, description="Search by id, name, or description")):
    if not q:
        raise HTTPException(status_code=400, detail="Search query 'q' is required")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if q.isdigit():
        cursor.execute("""
            SELECT * FROM products
            WHERE id = %s OR name LIKE %s OR description LIKE %s
        """, (int(q), f"%{q}%", f"%{q}%"))
    else:
        cursor.execute("""
            SELECT * FROM products
            WHERE name LIKE %s OR description LIKE %s
        """, (f"%{q}%", f"%{q}%"))

    products = cursor.fetchall()
    cursor.close()
    conn.close()

    if not products:
        # Return 404 to indicate no results found
        raise HTTPException(status_code=404, detail=f"No products found for query '{q}'")

    return products