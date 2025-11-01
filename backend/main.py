# Product_List/backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from functions.products import router as products_router
from functions.add_delete import router as add_delete_router
from functions.edit_search import router as edit_search_router

app = FastAPI(title="Products API")
origins=[
    "http://localhost:3000",
    "http://localhost:8000"
    ]
# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later to localhost:3000 in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],    
)

@app.get("/")
def home():
    return {"message": "FastAPI Products API running successfully 🚀"}

app.include_router(products_router,prefix='/products', tags=["Products"])
app.include_router(add_delete_router, prefix="/products", tags=["Add/Delete Products"])
app.include_router(edit_search_router, prefix="/products", tags=["Edit/Search Products"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)