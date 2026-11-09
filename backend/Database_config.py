from dotenv import load_dotenv
import os 

load_dotenv()



PASSWORD = os.getenv("DB_PASSWORD")
DATABASE = os.getenv("DB")
HOST =os.getenv("DB_HOST")
PORT = int(os.getenv("DB_PORT"))
USER =os.getenv("DB_USER")