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

# const ConfigGetDataFromMongoDB = {
#   formId: 'getDataFromMongoDBForm',
#   title: {
#     title: 'Get data from MongoDB',
#     imageSrc: `${Icons.mongodbIcon}`,
#     imgid: 'img_getDataFromMongoDBForm',
#   },
#   buttonSubmit: {
#     id: 'button_getDataFromMongoDBForm',
#     text: 'Submit',
#     imageSrc: `${Icons.mongodbIcon}`,
#     classname: 'button-getDataFromMongoDBForm'
#   },
#   fieldsList: [
#     {
#       formId: 'Database_form',
#       label: 'Database:',
#       inputType: 'text',
#       inputId: 'Database',
#       inputPlaceholder: 'e.g. prod_DB',
#     },
#     {
#       formId: 'Collection_form',
#       label: 'Collection:',
#       inputType: 'text',
#       inputId: 'Collection',
#       inputPlaceholder: 'e.g. product_users',
#     },
#     {
#       formId: 'mongodb_pipeline_form',
#       label: 'MongoDB pipeline:',
#       inputType: 'text',
#       inputId: 'mongodb_pipeline',
#       inputPlaceholder: 'e.g. [{"$project": {"operations": ["type": "add", "value": 1]}}]}]',
#     },
#     {
#       formId: 'destination_sheet_url_form',
#       label: 'Destination sheet URL:',
#       inputType: 'text',
#       inputId: 'destination_sheet_url',
#       inputPlaceholder: 'e.g. https://docs.google.com/spreadsheets',
#     },
#     {
#       formId: 'destination_data_range_start_form',
#       label: 'Destination data range start:',
#       inputType: 'text',
#       inputId: 'destination_data_range_start',
#       inputPlaceholder: 'e.g. loader_test!C8',
#     },
#     {
#       formId: 'schedule_cron_expression_form',
#       label: 'Schedule cron expression:',
#       inputType: 'text',
#       inputId: 'schedule_cron_expression',
#       inputPlaceholder: 'e.g. 0 0 * * *',
#     },
#     {
#       formId: 'job_start_date_form',
#       label: 'Job start date:',
#       inputType: 'text',
#       inputId: 'job_start_date',
#       inputPlaceholder: 'e.g. 2023-01-01',
#     }
#   ]
# }
class GetDataFromMongoDB(BaseModel):
    Database: str
    Collection: str
    mongodb_pipeline: str
    destination_sheet_url: str
    destination_data_range_start: str
    schedule_cron_expression: str
    job_start_date: str


class DataInSheet(BaseModel):
    source_sheet_url: str
    source_data_range: str
    destination_sheet_url: str
    schedule_cron_expression: str
    job_start_date: str

class ReconciliationData(BaseModel):
    reconciliation_spreadsheet_url: str
    reconciliation_sheet_name: str
    confirmed_matches_range: str
    confirmed_discrepancies_range: str
    confirmed_missing_range: str
    likely_matches_range: str
    likely_discrepancies_range: str
    likely_missing_range: str
    ledger_a_sheet_name: str
    ledger_b_sheet_name: str
    ledger_a_range: str
    ledger_b_range: str
    similarity_threshold_1: str
    similarity_threshold_2: str
    similarity_threshold_3: str

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
        "source_sheet_url": DataInSheet.source_sheet_url,
        "source_data_range": DataInSheet.source_data_range,
        "destination_sheet_url": DataInSheet.destination_sheet_url,
        "schedule_cron_expression": DataInSheet.schedule_cron_expression,
        "job_start_date": DataInSheet.job_start_date
    }
    return new_DataInSheet


@app.post("/api/reconciliationData", response_model=ReconciliationData)
async def add_ReconciliationData(ReconciliationData: ReconciliationData, auth: str = Depends(oauth2_scheme)):
    # Append the new ReconciliationData to the ReconciliationData list
    new_ReconciliationData = {
        "reconciliation_spreadsheet_url": ReconciliationData.reconciliation_spreadsheet_url,
        "reconciliation_sheet_name": ReconciliationData.reconciliation_sheet_name,
        "confirmed_matches_range": ReconciliationData.confirmed_matches_range,
        "confirmed_discrepancies_range": ReconciliationData.confirmed_discrepancies_range,
        "confirmed_missing_range": ReconciliationData.confirmed_missing_range,
        "likely_matches_range": ReconciliationData.likely_matches_range,
        "likely_discrepancies_range": ReconciliationData.likely_discrepancies_range,
        "likely_missing_range": ReconciliationData.likely_missing_range,
        "ledger_a_sheet_name": ReconciliationData.ledger_a_sheet_name,
        "ledger_b_sheet_name": ReconciliationData.ledger_b_sheet_name,
        "ledger_a_range": ReconciliationData.ledger_a_range,
        "ledger_b_range": ReconciliationData.ledger_b_range,
        "similarity_threshold_1": ReconciliationData.similarity_threshold_1,
        "similarity_threshold_2": ReconciliationData.similarity_threshold_2,
        "similarity_threshold_3": ReconciliationData.similarity_threshold_3
    }
    return new_ReconciliationData

@app.post("/api/getDataFromMongoDB", response_model=GetDataFromMongoDB)
async def add_GetDataFromMongoDB(GetDataFromMongoDB: GetDataFromMongoDB, auth: str = Depends(oauth2_scheme)):
    # Append the new GetDataFromMongoDB to the GetDataFromMongoDB list
    new_GetDataFromMongoDB = {
        "Database": GetDataFromMongoDB.Database,
        "Collection": GetDataFromMongoDB.Collection,
        "mongodb_pipeline": GetDataFromMongoDB.mongodb_pipeline,
        "destination_sheet_url": GetDataFromMongoDB.destination_sheet_url,
        "destination_data_range_start": GetDataFromMongoDB.destination_data_range_start,
        "schedule_cron_expression": GetDataFromMongoDB.schedule_cron_expression,
        "job_start_date": GetDataFromMongoDB.job_start_date
    }
    return new_GetDataFromMongoDB

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

