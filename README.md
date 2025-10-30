# MediMate - AI Chatbot for Pre-Consultation Clinical History Collection

## 🎯 Overview

MediMate is a complete full-stack AI-powered healthcare application that automates pre-consultation data collection. Built with **FastAPI + React + MongoDB**.

## ✨ Features

### For Patients
- 🔐 Secure Authentication - Role-based signup/login
- 👨‍⚕️ Doctor Selection - Browse and book appointments with doctors
- 💬 AI Chatbot - Interactive medical history collection with GPT-4o
- 🎤 Voice Input/Output - OpenAI Whisper & TTS
- 📸 Image Upload & Analysis - AI vision analysis of symptoms
- 📋 Appointment Management

### For Doctors
- 📊 Dashboard - Overview of appointments and patients
- 📄 AI-Generated Summaries - Comprehensive patient summaries
- 🔍 Patient Search
- 💾 Export Summaries - Download as JSON
- 👥 Patient Management

## 🚀 Quick Start

**Demo Credentials:**

Patient: `patient@demo.com` / `12345`
Doctor: `doctor@demo.com` / `admin123`

## 💡 How It Works

1. **Patient** books appointment with doctor
2. **AI Chatbot** conducts pre-consultation interview
3. **Patient** shares symptoms via text, voice, or images
4. **AI** generates structured medical summary
5. **Doctor** reviews summary before appointment

## 🏗️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + shadcn/ui
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o, Whisper, TTS, Vision
- **Auth**: JWT + bcrypt

## 📁 Project Structure

```
MediMate/
├── backend/
│   ├── server.py          # FastAPI app
│   ├── .env              # Environment variables
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── context/      # Auth context
│   │   └── components/   # UI components
│   └── package.json
└── README.md
```

## 🗄️ Database Collections

- **users** - Patient and doctor accounts
- **appointments** - Scheduled consultations
- **chat_messages** - AI conversation history
- **summaries** - AI-generated patient summaries

## 🔧 API Endpoints

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login

### Patient
- `GET /api/patient/doctors` - List doctors
- `POST /api/patient/book` - Book appointment

### Chat
- `POST /api/chat/message` - Send message
- `POST /api/chat/voice` - Voice input
- `POST /api/chat/upload` - Upload image
- `POST /api/chat/end` - Generate summary

### Doctor
- `GET /api/doctor/appointments` - List appointments
- `GET /api/doctor/summary/:id` - View summary

## 🎨 Features Showcase

✅ Modern medical-themed UI
✅ Voice-enabled chat interface
✅ Image analysis with GPT-4o Vision
✅ Real-time AI responses
✅ Comprehensive patient summaries
✅ Role-based dashboards
✅ Responsive design

---

Built with ❤️ for better healthcare experiences.
