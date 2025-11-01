# Product_List/backend/functions/add_delete.py
from fastapi import APIRouter, Request, HTTPException
from db.db import get_db_connection
from models.models import Product

router = APIRouter()

conn=get_db_connection()

@router.post("/add")
def add_product(product: Product,request: Request):
    cursor=conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id=%s", (product.id,))
    existing_product=cursor.fetchone()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this ID already exists")
    cursor.execute("INSERT INTO products (id,name, description, price) VALUES (%s,%s, %s, %s)", (product.id,product.name, product.description, product.price))
    conn.commit()
    return {"message": "Product added successfully", "product_id": cursor.lastrowid}

@router.delete("/delete/{product_id}")
def delete_product(product_id: int):
    cursor=conn.cursor()
    cursor.execute("DELETE FROM products WHERE id=%s", (product_id,))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=400, detail="Product with this ID:{product_id} doesn't exists.")
    return {"message": "Product deleted successfully"}