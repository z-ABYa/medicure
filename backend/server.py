from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.hash import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType, ImageContent
import json
import base64
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'medimate_db')]

# JWT config
JWT_SECRET = os.environ.get('JWT_SECRET', 'secret')
JWT_ALGORITHM = 'HS256'

# OpenAI for voice
OPENAI_API_KEY = os.environ.get('EMERGENT_LLM_KEY')
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Uploads directory
UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    password: str
    role: str  # 'patient' or 'doctor'
    region: str
    specialization: Optional[str] = None
    rating: Optional[float] = 4.5
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    region: str
    specialization: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    appointment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    slot: str
    status: str = "booked"  # booked, completed, cancelled
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AppointmentCreate(BaseModel):
    doctor_id: str
    slot: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    appointment_id: str
    sender: str  # 'ai' or 'patient'
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatMessageCreate(BaseModel):
    appointment_id: str
    message: str

class Summary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    summary_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    appointment_id: str
    patient_id: str
    doctor_id: str
    summary_text: str
    summary_json: Dict[str, Any]
    images: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password, hashed)

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"user_id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Auth Routes
@api_router.post("/auth/signup")
async def signup(data: UserSignup):
    # Check if user exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = data.model_dump()
    user_dict['password'] = hash_password(data.password)
    user_obj = User(**user_dict)
    
    await db.users.insert_one(user_obj.model_dump())
    
    token = create_token(user_obj.user_id, user_obj.role)
    return {
        "token": token,
        "user": {k: v for k, v in user_obj.model_dump().items() if k != 'password'}
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['user_id'], user['role'])
    return {
        "token": token,
        "user": {k: v for k, v in user.items() if k != 'password'}
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != 'password'}

# Patient Routes
@api_router.get("/patient/doctors")
async def get_doctors(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can view doctors")
    
    doctors = await db.users.find(
        {"role": "doctor", "region": current_user['region']},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return doctors

@api_router.post("/patient/book")
async def book_appointment(data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
    
    appointment = Appointment(
        patient_id=current_user['user_id'],
        doctor_id=data.doctor_id,
        slot=data.slot
    )
    
    await db.appointments.insert_one(appointment.model_dump())
    return appointment.model_dump()

@api_router.get("/patient/appointments")
async def get_patient_appointments(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can view their appointments")
    
    appointments = await db.appointments.find(
        {"patient_id": current_user['user_id']},
        {"_id": 0}
    ).to_list(100)
    
    return appointments

# Chat Routes
@api_router.post("/chat/message")
async def send_chat_message(data: ChatMessageCreate, current_user: dict = Depends(get_current_user)):
    # Verify appointment belongs to user
    appointment = await db.appointments.find_one({"appointment_id": data.appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if current_user['role'] == 'patient' and appointment['patient_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not your appointment")
    
    # Save patient message
    patient_msg = ChatMessage(
        appointment_id=data.appointment_id,
        sender="patient",
        message=data.message
    )
    await db.chat_messages.insert_one(patient_msg.model_dump())
    
    # Get chat history
    history = await db.chat_messages.find(
        {"appointment_id": data.appointment_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    
    # Create AI response using emergentintegrations
    session_id = f"appointment_{data.appointment_id}"
    system_message = """You are a medical AI assistant conducting a pre-consultation interview.
Ask relevant questions about:
- Symptoms and their duration
- Medical history
- Current medications
- Allergies
- Family medical history
- Lifestyle factors

Ask ONE clear question at a time. Be empathetic and professional.
When you have gathered sufficient information (at least 5-6 key details), end with: 'Thank you for providing this information. I will now generate a summary for your doctor.'"""
    
    chat = LlmChat(
        api_key=OPENAI_API_KEY,
        session_id=session_id,
        system_message=system_message
    ).with_model("openai", "gpt-4o")
    
    user_message = UserMessage(text=data.message)
    ai_response = await chat.send_message(user_message)
    
    # Save AI response
    ai_msg = ChatMessage(
        appointment_id=data.appointment_id,
        sender="ai",
        message=ai_response
    )
    await db.chat_messages.insert_one(ai_msg.model_dump())
    
    return {
        "patient_message": patient_msg.model_dump(),
        "ai_response": ai_msg.model_dump()
    }

@api_router.post("/chat/voice")
async def process_voice(audio: UploadFile = File(...), appointment_id: str = Form(...), current_user: dict = Depends(get_current_user)):
    # Save audio file temporarily
    audio_path = UPLOADS_DIR / f"{uuid.uuid4()}.webm"
    content = await audio.read()
    with open(audio_path, 'wb') as f:
        f.write(content)
    
    # Transcribe using OpenAI Whisper
    with open(audio_path, 'rb') as audio_file:
        transcription = await openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
    
    text = transcription.text
    
    # Process as regular chat message
    data = ChatMessageCreate(appointment_id=appointment_id, message=text)
    response = await send_chat_message(data, current_user)
    
    # Generate TTS for AI response
    tts_response = await openai_client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=response['ai_response']['message']
    )
    
    # Save TTS audio
    tts_path = UPLOADS_DIR / f"{uuid.uuid4()}.mp3"
    tts_path.write_bytes(tts_response.content)
    
    # Clean up input audio
    audio_path.unlink()
    
    return {
        "transcribed_text": text,
        "ai_response": response['ai_response']['message'],
        "audio_url": f"/api/files/{tts_path.name}"
    }

@api_router.post("/chat/upload")
async def upload_image(
    image: UploadFile = File(...),
    appointment_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    # Save image
    image_path = UPLOADS_DIR / f"{uuid.uuid4()}_{image.filename}"
    content = await image.read()
    with open(image_path, 'wb') as f:
        f.write(content)
    
    # Analyze image using GPT-4o vision
    base64_image = base64.b64encode(content).decode('utf-8')
    
    session_id = f"appointment_{appointment_id}_vision"
    chat = LlmChat(
        api_key=OPENAI_API_KEY,
        session_id=session_id,
        system_message="You are a medical AI analyzing symptom images. Describe what you see objectively."
    ).with_model("openai", "gpt-4o")
    
    image_content = ImageContent(image_base64=base64_image)
    user_message = UserMessage(
        text="Please analyze this image and describe any visible symptoms or conditions.",
        file_contents=[image_content]
    )
    
    analysis = await chat.send_message(user_message)
    
    # Save analysis as chat message
    ai_msg = ChatMessage(
        appointment_id=appointment_id,
        sender="ai",
        message=f"Image analysis: {analysis}"
    )
    await db.chat_messages.insert_one(ai_msg.model_dump())
    
    return {
        "image_url": f"/api/files/{image_path.name}",
        "analysis": analysis
    }

@api_router.post("/chat/end")
async def end_chat(appointment_id: str, current_user: dict = Depends(get_current_user)):
    # Get appointment
    appointment = await db.appointments.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Get all messages
    messages = await db.chat_messages.find(
        {"appointment_id": appointment_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    # Generate summary using AI
    conversation = "\n".join([f"{msg['sender']}: {msg['message']}" for msg in messages])
    
    session_id = f"summary_{appointment_id}"
    chat = LlmChat(
        api_key=OPENAI_API_KEY,
        session_id=session_id,
        system_message="""Generate a structured medical summary in JSON format.
Include: name, age, symptoms, duration, medical_history, allergies, medications, family_history, lifestyle, summary_text.
Be thorough and professional."""
    ).with_model("openai", "gpt-4o")
    
    user_message = UserMessage(text=f"Generate a comprehensive medical summary from this conversation:\n{conversation}")
    summary_response = await chat.send_message(user_message)
    
    # Parse JSON from response
    try:
        # Extract JSON from response
        json_start = summary_response.find('{')
        json_end = summary_response.rfind('}') + 1
        summary_json = json.loads(summary_response[json_start:json_end])
    except:
        summary_json = {
            "summary_text": summary_response,
            "symptoms": [],
            "notes": "Could not parse structured data"
        }
    
    # Get uploaded images
    image_messages = [msg for msg in messages if "Image analysis" in msg.get('message', '')]
    images = []
    
    # Create summary
    summary = Summary(
        appointment_id=appointment_id,
        patient_id=appointment['patient_id'],
        doctor_id=appointment['doctor_id'],
        summary_text=summary_json.get('summary_text', summary_response),
        summary_json=summary_json,
        images=images
    )
    
    await db.summaries.insert_one(summary.model_dump())
    
    # Update appointment status
    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": "completed"}}
    )
    
    return summary.model_dump()

# Doctor Routes
@api_router.get("/doctor/appointments")
async def get_doctor_appointments(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can view their appointments")
    
    appointments = await db.appointments.find(
        {"doctor_id": current_user['user_id']},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with patient info and summaries
    for apt in appointments:
        patient = await db.users.find_one({"user_id": apt['patient_id']}, {"_id": 0, "password": 0})
        apt['patient'] = patient
        
        summary = await db.summaries.find_one({"appointment_id": apt['appointment_id']}, {"_id": 0})
        apt['summary'] = summary
    
    return appointments

@api_router.get("/doctor/summary/{summary_id}")
async def get_summary(summary_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can view summaries")
    
    summary = await db.summaries.find_one({"summary_id": summary_id}, {"_id": 0})
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    # Get patient info
    patient = await db.users.find_one({"user_id": summary['patient_id']}, {"_id": 0, "password": 0})
    summary['patient'] = patient
    
    return summary

@api_router.get("/files/{filename}")
async def get_file(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()