from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker, declarative_base
from SingletonPattern import AppConfig

config = AppConfig()

engine = create_engine(config.database_url, echo = True)

sessionLocal = sessionmaker( autocommit=False,autoflush=False, bind=engine)



def get_db():
    db = sessionLocal()
    try: 
        yield db
    finally:
        db.close()

base = declarative_base()

try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

        print("Database connection successful!")
        

except Exception as e:
    print("Database connection failed!")
    print(e)