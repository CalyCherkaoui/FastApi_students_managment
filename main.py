from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer
import jwt
from dotenv import load_dotenv
import os
from typing import List
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from fastapi import Form
import uvicorn
from authentication import verify_password, create_access_token

# Define the Student Model
class Student(BaseModel):
    name: str
    marks: float

class LoginRequest(BaseModel):
  username: str
  password: str

# Create the Mock Student List
students = [
    {"name": "Student1", "marks": 85.5},
    {"name": "Student2", "marks": 90.0},
    {"name": "Student3", "marks": 78.5},
    {"name": "Student4", "marks": 88.0},
    {"name": "Student5", "marks": 92.5},
    {"name": "Student6", "marks": 81.0},
    {"name": "Student7", "marks": 79.5},
    {"name": "Student8", "marks": 85.0},
    {"name": "Student9", "marks": 87.5},
    {"name": "Student10", "marks": 91.0},
]

# Load Environment Variables from .env file
load_dotenv(dotenv_path='/home/calypso/caast/FastApi_students_managment/.env')

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
BACKEND_USERNAME = os.getenv("CAAST_USER1_USERNAME")
BACKEND_PASSWORD_HASH = os.getenv("CAAST_USER1_PASSWORD_HASH")

# Create FastAPI instance
app = FastAPI()

# Create APIRouter instance
router = APIRouter()

# Implementing JWT Authentication
## Define OAuth2 Scheme using OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")



@router.post("/login")
async def login(request: LoginRequest):
    """
    Handle login and return a JWT token if the credentials are correct.
    """
    if request.username == BACKEND_USERNAME and verify_password(request.password, BACKEND_PASSWORD_HASH):
        access_token = create_access_token(data={"sub": request.username})
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

app.include_router(router, prefix="/auth", tags=["Authentication"])


# Root endpoint with logging (protected by JWT Bearer token)
@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the caast API"}




# # Create Token Generation Function
# from datetime import datetime, timedelta

# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt

# #  Implement Authentication Dependency
# def authenticate_user(token: str = Depends(oauth2_scheme)):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username: str = payload.get("sub")
#         if username != USER_NAME:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid authentication credentials",
#             )
#     except jwt.PyJWTError:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Could not validate credentials",
#         )



# # Create the Token Endpoint
# @app.post("/token")
# async def login(form_data: dict = Depends()):
#     username = form_data.get("username")
#     password = form_data.get("password")
#     if username != USER_NAME or password != PASSWORD:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect username or password",
#         )
#     access_token = create_access_token(data={"sub": username})
#     return {"access_token": access_token, "token_type": "bearer"}

# Create the /api/students Endpoint
@app.get("/api/students", response_model=List[Student])
async def get_students(auth: str = Depends(oauth2_scheme)):
    return students


# # Run the FastAPI application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="",  # Listen on all interfaces
        port=8000,
        reload=True, # Reload the server on code changes only in development
    )

# # in bash terminal use: $ uvicorn main:app --reload --port 8000

