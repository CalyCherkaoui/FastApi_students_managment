from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
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

class DataInSheet(BaseModel):
    input_source_sheet_url: str
    input_source_data_range: str
    input_destination_sheet_url: str
    input_destination_sheet_url: str
    input_schedule_cron_expression: str
    input_job_start_date: str


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

# add cors origin whitelist
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Create the /api/students Endpoint
@app.get("/api/students", response_model=List[Student])
async def get_students(auth: str = Depends(oauth2_scheme)):
    return students

@app.post("/api/students", response_model=Student)
async def add_student(student: Student, auth: str = Depends(oauth2_scheme)):
    # Append the new student to the students list
    new_student = {"name": student.name, "marks": student.marks}
    students.append(new_student)
    return new_student

@app.post("/api/DataInSheets", response_model=DataInSheet)
async def add_DataInSheet(DataInSheet: DataInSheet, auth: str = Depends(oauth2_scheme)):
    # Append the new DataInSheet to the DataInSheets list
    new_DataInSheet = {
        "input_source_sheet_url": DataInSheet.input_source_sheet_url,
        "input_source_data_range": DataInSheet.input_source_data_range,
        "input_destination_sheet_url": DataInSheet.input_destination_sheet_url,
        "input_schedule_cron_expression": DataInSheet.input_schedule_cron_expression,
        "input_job_start_date": DataInSheet.input_job_start_date
    }
    return new_DataInSheet

# # Run the FastAPI application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="",  # Listen on all interfaces
        port=8000,
        reload=True, # Reload the server on code changes only in development
    )

# # in bash terminal use: $ uvicorn main:app --reload --port 8000

# curl -X POST "http://localhost:3000/api/students" \
# -H "Authorization: Bearer your_valid_jwt_token_here" \
# -H "Content-Type: application/json" \
# -d '{
#   "name": "NewStudent",
#   "marks": 88.5
# }'


# curl -H "Authorization: Bearer your_valid_jwt_token_here" \
# "http://localhost:3000/api/students"

