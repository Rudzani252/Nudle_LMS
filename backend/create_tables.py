from Nudle_database import engine, base 
import Models

base.metadata.create_all(bind=engine)
print("Tables created successfully!")