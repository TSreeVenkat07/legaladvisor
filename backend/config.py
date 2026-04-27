import os
from dotenv import load_dotenv

load_dotenv("../.env")

# GLOBAL CONFIG (MANDATORY)
origin = os.getenv("ORIGIN", "http://localhost:5173")
