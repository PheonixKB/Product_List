# backend/app/db/db.py

from mysql.connector import pooling # Import MySQL connection pooling module
import os # Import os module for environment variables
from dotenv import load_dotenv # Import load_dotenv to load environment variables from .env file

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env")) # Load environment variables from a .env file
# MySQL database connection configuration dictionary

dbconfig = {
    "host": os.getenv("DB_HOST", "localhost"), # Database host, defaults to 'localhost'
    "user": os.getenv("DB_USERNAME", "root"),     # Database user, defaults to 'root'
    "password": os.getenv("DB_PASSWORD"), # Database password
    "database": os.getenv("DB_NAME", "products_list"), # Database name, defaults to 'finance_assistant'
    "auth_plugin": "mysql_native_password"  # Required for MySQL 8 default authentication method
}

# Create a MySQL connection pool to manage database connections efficiently
connection_pool = pooling.MySQLConnectionPool(
    pool_name="product_pool",        # Name of the connection pool
    pool_size=10,                    # Maximum number of connections in the pool
    pool_reset_session=True,         # Resets session variables when a connection is returned to the pool
    **dbconfig                       # Unpack the database configuration dictionary
)

# Function to get a database connection from the connection pool
def get_db_connection():
    # Returns a connection object from the pool, ensuring efficient reuse of connections
    return connection_pool.get_connection()
