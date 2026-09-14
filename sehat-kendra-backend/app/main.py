from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import random
import uuid

from app.supabase_client import supabase
from app.ai_service import (
    generate_prescription_summary,
    translate_text_to_english,
    translate_prescription_fields,
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Sehat Kendra API",
    description="Backend API for Sehat Kendra Digital Health Gateway",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# TEMPORARY OTP STORAGE
# ============================================================

otp_store = {}


# ============================================================
# DATA MODELS
# ============================================================

class AadhaarOTPRequest(BaseModel):
    aadhaar: str = Field(
        ...,
        min_length=12,
        max_length=12
    )

    consent: bool


class AadhaarOTPVerify(BaseModel):
    aadhaar: str = Field(
        ...,
        min_length=12,
        max_length=12
    )

    transaction_id: str

    otp: str = Field(
        ...,
        min_length=4,
        max_length=6
    )


class PatientCreate(BaseModel):
    name: str

    mobile: Optional[str] = None

    dob: Optional[str] = None

    gender: Optional[str] = None

    city: Optional[str] = None

    state: Optional[str] = None

    aadhaar: Optional[str] = None

    abha_id: Optional[str] = None

    emergency_name: Optional[str] = None

    emergency_relation: Optional[str] = None

    emergency_phone: Optional[str] = None


class HealthRecordCreate(BaseModel):
    patient_id: int
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(BaseModel):
    patient_id: str

    doctor: str

    doctor_role: Optional[str] = None

    mode: str

    appointment_date: str

    appointment_time: str

    prescription_id: Optional[str] = None

    consent: bool


class PrescriptionCreate(BaseModel):
    patient_id: str
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    medicines: List[dict] = Field(default_factory=list)
    source: str = "Voice"
    notes: Optional[str] = None
    draft: bool = True


class PrescriptionScanRequest(BaseModel):
    patient_id: str
    filename: Optional[str] = None
    language: str = "en-IN"


class PrescriptionVoiceRequest(BaseModel):
    patient_id: str
    symptoms: str
    language: str = "en-IN"


class PrescriptionSummarizeRequest(BaseModel):
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    medicines: List[dict] = Field(default_factory=list)
    notes: Optional[str] = None
    language: str = "en-IN"


class TranscriptTranslateRequest(BaseModel):
    text: str
# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Sehat Kendra Backend is running!",
        "status": "success",
        "version": "1.0.0"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "Sehat Kendra API"
    }


# ============================================================
# SUPABASE CONNECTION TEST
# ============================================================

@app.get("/health/supabase")
def supabase_health():

    try:

        # This assumes a test table exists.
        # If it doesn't, Supabase will return an error,
        # which still tells us the HTTPS API is reachable.

        response = (
            supabase
            .table("test")
            .select("*")
            .limit(1)
            .execute()
        )

        return {
            "status": "connected",
            "message": "Supabase API is reachable",
            "data": response.data
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# ============================================================
# AADHAAR OTP - REQUEST
# ============================================================

@app.post("/auth/aadhaar/request-otp")
def request_aadhaar_otp(request: AadhaarOTPRequest):

    # --------------------------------------------------------
    # Validate consent
    # --------------------------------------------------------

    if request.consent is not True:

        raise HTTPException(
            status_code=400,
            detail="Consent is required before Aadhaar verification."
        )


    # --------------------------------------------------------
    # Validate Aadhaar format
    # --------------------------------------------------------

    aadhaar = request.aadhaar.strip()

    if not aadhaar.isdigit():

        raise HTTPException(
            status_code=400,
            detail="Aadhaar number must contain only digits."
        )


    if len(aadhaar) != 12:

        raise HTTPException(
            status_code=400,
            detail="Aadhaar number must contain exactly 12 digits."
        )


    # --------------------------------------------------------
    # Generate transaction ID
    # --------------------------------------------------------

    transaction_id = str(uuid.uuid4())


    # --------------------------------------------------------
    # Generate DEMO OTP
    #
    # IMPORTANT:
    # This is not a real UIDAI OTP.
    # --------------------------------------------------------

    demo_otp = str(
        random.randint(100000, 999999)
    )


    # --------------------------------------------------------
    # Store OTP temporarily
    # --------------------------------------------------------

    otp_store[transaction_id] = {

        "aadhaar": aadhaar,

        "otp": demo_otp,

        "created_at": datetime.utcnow(),

        "expires_at":
            datetime.utcnow() + timedelta(minutes=5),

        "attempts": 0
    }


    # --------------------------------------------------------
    # NEVER return the Aadhaar number
    # --------------------------------------------------------

    masked_aadhaar = (
        "XXXX-XXXX-" + aadhaar[-4:]
    )


    print(
        f"[DEMO OTP] Aadhaar {masked_aadhaar}"
        f" | Transaction {transaction_id}"
        f" | OTP {demo_otp}"
    )


    return {

        "success": True,

        "message":
            "Demo OTP generated successfully.",

        "transaction_id":
            transaction_id,

        "masked_aadhaar":
            masked_aadhaar,

        # Demo only.
        # Remove this when connecting real UIDAI/ABDM.
        "demo_otp":
            demo_otp,

        "expires_in":
            300
    }


# ============================================================
# AADHAAR OTP - VERIFY
# ============================================================

@app.post("/auth/aadhaar/verify-otp")
def verify_aadhaar_otp(request: AadhaarOTPVerify):

    transaction_id = request.transaction_id.strip()

    aadhaar = request.aadhaar.strip()

    otp = request.otp.strip()


    # --------------------------------------------------------
    # Validate Aadhaar
    # --------------------------------------------------------

    if not aadhaar.isdigit() or len(aadhaar) != 12:

        raise HTTPException(
            status_code=400,
            detail="Invalid Aadhaar number."
        )


    # --------------------------------------------------------
    # Check transaction
    # --------------------------------------------------------

    transaction = otp_store.get(
        transaction_id
    )


    if transaction is None:

        raise HTTPException(
            status_code=404,
            detail="Authentication transaction not found. Please request a new OTP."
        )


    # --------------------------------------------------------
    # Check expiry
    # --------------------------------------------------------

    if datetime.utcnow() > transaction["expires_at"]:

        del otp_store[transaction_id]

        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new OTP."
        )


    # --------------------------------------------------------
    # Check Aadhaar matches transaction
    # --------------------------------------------------------

    if transaction["aadhaar"] != aadhaar:

        raise HTTPException(
            status_code=400,
            detail="Aadhaar number does not match the OTP transaction."
        )


    # --------------------------------------------------------
    # Limit OTP attempts
    # --------------------------------------------------------

    transaction["attempts"] += 1

    if transaction["attempts"] > 5:

        del otp_store[transaction_id]

        raise HTTPException(
            status_code=429,
            detail="Too many OTP attempts. Please request a new OTP."
        )


    # --------------------------------------------------------
    # Verify OTP
    # --------------------------------------------------------

    if transaction["otp"] != otp:

        raise HTTPException(
            status_code=401,
            detail="Invalid OTP."
        )


    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    del otp_store[transaction_id]


    # --------------------------------------------------------
    # Demo patient information
    #
    # In production this would come from the authorized
    # ABDM/health-record system after authentication.
    # --------------------------------------------------------

    patient_name = "Sehat Kendra Citizen"

    abha_id = (
        "91-" +
        aadhaar[0:4] +
        "-" +
        aadhaar[4:8] +
        "-" +
        aadhaar[8:12]
    )


    return {

        "success": True,

        "message":
            "Aadhaar verification successful.",

        "authenticated": True,

        "patient_name":
            patient_name,

        "abha_id":
            abha_id,

        "conditions": [],

        "medicines": [],

        "allergies": []
    }


# ============================================================
# PATIENT CREATION
# ============================================================

@app.post("/patients")
def create_patient(patient: PatientCreate):

    try:

        patient_data = {

            "name":
                patient.name,

            "mobile":
                patient.mobile,

            "dob":
                patient.dob,

            "gender":
                patient.gender,

            "city":
                patient.city,

            "state":
                patient.state,

            "aadhaar":
                patient.aadhaar,

            "abha_id":
                patient.abha_id,

            "emergency_name":
                patient.emergency_name,

            "emergency_relation":
                patient.emergency_relation,

            "emergency_phone":
                patient.emergency_phone,

            "created_at":
                datetime.utcnow().isoformat()
        }


        response = (
            supabase
            .table("patients")
            .insert(patient_data)
            .execute()
        )


        return {

            "success": True,

            "message":
                "Patient created successfully.",

            "patient":
                response.data
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET PATIENT
# ============================================================

@app.get("/patients/{patient_id}")
def get_patient(patient_id: str):

    try:

        response = (
            supabase
            .table("patients")
            .select("*")
            .eq("id", patient_id)
            .limit(1)
            .execute()
        )


        if not response.data:

            raise HTTPException(
                status_code=404,
                detail="Patient not found."
            )


        return {

            "success": True,

            "patient":
                response.data[0]
        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET PATIENT BY ABHA
# ============================================================

@app.get("/patients/abha/{abha_id}")
def get_patient_by_abha(abha_id: str):

    try:

        response = (
            supabase
            .table("patients")
            .select("*")
            .eq("abha_id", abha_id)
            .limit(1)
            .execute()
        )


        if not response.data:

            raise HTTPException(
                status_code=404,
                detail="Patient with this ABHA ID was not found."
            )


        return {

            "success": True,

            "patient":
                response.data[0]
        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# HEALTH RECORD
# ============================================================

@app.post("/health-records")
def create_health_record(
    record: HealthRecordCreate
):
    try:
        record_data = {
            "patient_id": record.patient_id,
            "diagnosis": record.diagnosis,
            "symptoms": record.symptoms,
            "notes": record.notes,
            "created_at": datetime.utcnow().isoformat()
        }

        response = (
            supabase
            .table("health_records")
            .insert(record_data)
            .execute()
        )

        return {
            "success": True,
            "message": "Health record saved successfully.",
            "record": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET HEALTH RECORDS
# ============================================================

@app.get("/health-records/{patient_id}")
def get_health_records(
    patient_id: str
):

    try:

        response = (
            supabase
            .table("health_records")
            .select("*")
            .eq("patient_id", patient_id)
            .order(
                "created_at",
                desc=True
            )
            .execute()
        )


        return {

            "success": True,

            "records":
                response.data
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# APPOINTMENT BOOKING
# ============================================================

@app.post("/appointments")
def create_appointment(
    appointment: AppointmentCreate
):

    if not appointment.consent:

        raise HTTPException(
            status_code=400,
            detail="Consent is required to book the appointment."
        )


    try:

        appointment_data = {

            "patient_id":
                appointment.patient_id,

            "doctor":
                appointment.doctor,

            "doctor_role":
                appointment.doctor_role,

            "mode":
                appointment.mode,

            "appointment_date":
                appointment.appointment_date,

            "appointment_time":
                appointment.appointment_time,

            "prescription_id":
                appointment.prescription_id,

            "consent":
                appointment.consent,

            "status":
                "confirmed",

            "created_at":
                datetime.utcnow().isoformat()
        }


        response = (
            supabase
            .table("appointments")
            .insert(appointment_data)
            .execute()
        )


        return {

            "success": True,

            "message":
                "Appointment booked successfully.",

            "appointment":
                response.data
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET APPOINTMENTS
# ============================================================

@app.get("/appointments/{patient_id}")
def get_appointments(
    patient_id: str
):

    try:

        response = (
            supabase
            .table("appointments")
            .select("*")
            .eq("patient_id", patient_id)
            .order(
                "appointment_date",
                desc=False
            )
            .execute()
        )


        return {

            "success": True,

            "appointments":
                response.data
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# DEMO LOGIN
# ============================================================

@app.post("/auth/demo-login")
def demo_login():

    return {

        "success": True,

        "authenticated": True,

        "patient_name":
            "Smt. Ananya Sen",

        "abha_id":
            "91-4421-8890-1204",

        "conditions": [
            "Hypertension",
            "Diabetes"
        ],

        "medicines": [
            "Tab. Metformin 500mg",
            "Tab. Amlodipine 5mg"
        ],

        "allergies": [
            "Penicillin (mild rash)"
        ]
    }
# ================= ABHA LOGIN =================

class ABHAOTPRequest(BaseModel):
    abha_id: str

class ABHAOTPVerify(BaseModel):
    abha_id: str
    transaction_id: str
    otp: str


abha_otp_store = {}


@app.post("/auth/abha/request-otp")
def request_abha_otp(request: ABHAOTPRequest):

    abha_id = request.abha_id.strip().replace("-", "")

    if not abha_id.isdigit() or len(abha_id) != 14:
        raise HTTPException(
            status_code=400,
            detail="ABHA number must contain 14 digits."
        )

    transaction_id = str(uuid.uuid4())
    demo_otp = "654321"

    abha_otp_store[transaction_id] = {
        "abha_id": abha_id,
        "otp": demo_otp
    }

    return {
        "success": True,
        "message": "ABHA demo OTP generated.",
        "transaction_id": transaction_id,
        "demo_otp": demo_otp
    }


@app.post("/auth/abha/verify-otp")
def verify_abha_otp(request: ABHAOTPVerify):

    transaction = abha_otp_store.get(request.transaction_id)

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="ABHA authentication transaction not found."
        )

    if transaction["abha_id"] != request.abha_id.replace("-", ""):
        raise HTTPException(
            status_code=400,
            detail="ABHA number does not match."
        )

    if transaction["otp"] != request.otp:
        raise HTTPException(
            status_code=401,
            detail="Invalid ABHA OTP."
        )

    del abha_otp_store[request.transaction_id]

    return {
        "success": True,
        "authenticated": True,
        "patient_name": "Sehat Kendra Citizen",
        "abha_id": request.abha_id
    }
# ================= MOBILE LOGIN =================

class MobileOTPRequest(BaseModel):
    mobile: str


class MobileOTPVerify(BaseModel):
    mobile: str
    transaction_id: str
    otp: str


mobile_otp_store = {}


@app.post("/auth/mobile/request-otp")
def request_mobile_otp(request: MobileOTPRequest):

    mobile = request.mobile.strip()

    if not mobile.isdigit() or len(mobile) != 10:
        raise HTTPException(
            status_code=400,
            detail="Mobile number must contain 10 digits."
        )

    transaction_id = str(uuid.uuid4())

    # Demo OTP
    demo_otp = "789012"

    mobile_otp_store[transaction_id] = {
        "mobile": mobile,
        "otp": demo_otp
    }

    return {
        "success": True,
        "message": "Mobile demo OTP generated.",
        "transaction_id": transaction_id,
        "demo_otp": demo_otp
    }


@app.post("/auth/mobile/verify-otp")
def verify_mobile_otp(request: MobileOTPVerify):

    mobile = request.mobile.strip()

    transaction = mobile_otp_store.get(
        request.transaction_id
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Mobile authentication transaction not found."
        )

    if transaction["mobile"] != mobile:
        raise HTTPException(
            status_code=400,
            detail="Mobile number does not match."
        )

    if transaction["otp"] != request.otp:
        raise HTTPException(
            status_code=401,
            detail="Invalid mobile OTP."
        )

    del mobile_otp_store[request.transaction_id]

    return {
        "success": True,
        "authenticated": True,
        "patient_name": "Sehat Kendra Citizen",
        "mobile": mobile
    }
# ============================================================
# DIGITAL PRESCRIPTION CENTER
# ============================================================

@app.post("/prescriptions")
def create_prescription(prescription: PrescriptionCreate):

    try:
        prescription_data = {
            "patient_id": int(prescription.patient_id),
            "diagnosis": prescription.diagnosis,
            "symptoms": prescription.symptoms,
            "medicines": prescription.medicines,
            "source": prescription.source,
            "notes": prescription.notes,
            "draft": prescription.draft,
            "created_at": datetime.utcnow().isoformat()
        }

        response = (
            supabase
            .table("prescriptions")
            .insert(prescription_data)
            .execute()
        )

        return {
            "success": True,
            "message": "Prescription saved successfully.",
            "prescription": (
                response.data[0]
                if response.data
                else None
            )
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/prescriptions/{patient_id}")
def get_prescriptions(patient_id: int):

    try:
        response = (
            supabase
            .table("prescriptions")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "prescriptions": response.data or []
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# PRESCRIPTION SCAN
# ============================================================

@app.post("/prescriptions/scan")
def scan_prescription(
    request: PrescriptionScanRequest
):

    prescription = {
        "patient_id": int(request.patient_id),

        "diagnosis":
            "Viral Fever with Body Ache",

        "symptoms":
            "Fever for 2 days, body ache and mild headache",

        "medicines": [
            {
                "name": "Paracetamol 500mg",
                "dosage": "1 tablet",
                "frequency": "Three times daily after food",
                "duration": "3 days"
            },
            {
                "name": "ORS",
                "dosage": "1 sachet in 1 litre water",
                "frequency": "As needed",
                "duration": "3 days"
            }
        ],

        "source": "Scanned",

        "notes":
            "Rest and adequate fluids. "
            "Consult a doctor if symptoms persist.",

        "draft": False
    }

    ai_result = generate_prescription_summary(
        diagnosis=prescription["diagnosis"],
        symptoms=prescription["symptoms"],
        medicines=prescription["medicines"],
        notes=prescription["notes"],
        language=request.language,
    )

    return {
        "success": True,
        "message": "Prescription scanned successfully.",
        "prescription": prescription,
        "ai_summary": ai_result["summary"],
        "flashcards": ai_result["flashcards"],
        "ai_generated": ai_result.get("ai_generated", False)
    }


# ============================================================
# TRANSLATE A SPOKEN TRANSCRIPT INTO ENGLISH
# ============================================================
# The patient may speak in any supported language. Prescription
# drafting (rule-based diagnosis matching) and the AI summarizer's
# own reasoning both work off English, so the frontend calls this
# right before drafting to convert whatever was transcribed into
# English first.
# ============================================================

@app.post("/prescriptions/translate-transcript")
def translate_transcript(request: TranscriptTranslateRequest):

    result = translate_text_to_english(request.text)

    return {
        "success": True,
        "text": result["text"],
        "translated": result.get("translated", False)
    }


# ============================================================
# VOICE PRESCRIPTION
# ============================================================

@app.post("/prescriptions/voice-draft")
def prescription_voice_draft(
    request: PrescriptionVoiceRequest
):

    symptoms = request.symptoms.strip()

    if not symptoms:
        raise HTTPException(
            status_code=400,
            detail="Symptoms are required."
        )

    text = symptoms.lower()

    diagnosis = "General Symptoms"
    medicines = []

    notes = (
        "This is a digital draft for demonstration. "
        "A doctor must review and approve any medicine."
    )

    if "fever" in text:

        diagnosis = "Fever / Possible Viral Infection"

        medicines = [
            {
                "name": "Paracetamol 500mg",
                "dosage": "As advised by doctor",
                "frequency": "As advised",
                "duration": "As advised"
            }
        ]

        notes = (
            "Rest, maintain hydration and monitor temperature. "
            "Seek medical advice if fever is severe or persistent."
        )

    elif "headache" in text:

        diagnosis = "Headache"

        notes = (
            "Rest and maintain hydration. "
            "Consult a doctor if the headache is severe or recurrent."
        )

    elif "cough" in text or "cold" in text:

        diagnosis = "Cold / Cough Symptoms"

        notes = (
            "Maintain hydration and rest. "
            "Consult a doctor if symptoms worsen."
        )

    elif "stomach" in text or "gastric" in text:

        diagnosis = "Gastric / Stomach Symptoms"

        notes = (
            "Avoid very spicy or oily food. "
            "Consult a doctor if symptoms persist."
        )

    ai_result = generate_prescription_summary(
        diagnosis=diagnosis,
        symptoms=symptoms,
        medicines=medicines,
        notes=notes,
        language=request.language,
    )

    return {
        "success": True,

        "draft": {
            "patient_id": int(request.patient_id),
            "diagnosis": diagnosis,
            "symptoms": symptoms,
            "medicines": medicines,
            "source": "Voice",
            "notes": notes,
            "draft": True
        },

        "ai_summary": ai_result["summary"],
        "flashcards": ai_result["flashcards"],
        "ai_generated": ai_result.get("ai_generated", False)
    }


# ============================================================
# STANDALONE AI SUMMARIZATION (used to re-summarize an already
# saved prescription, e.g. when a patient reopens it from their
# saved list)
# ============================================================

@app.post("/prescriptions/summarize")
def summarize_prescription(request: PrescriptionSummarizeRequest):

    ai_result = generate_prescription_summary(
        diagnosis=request.diagnosis,
        symptoms=request.symptoms,
        medicines=request.medicines,
        notes=request.notes,
        language=request.language,
    )

    # Also translate the prescription's own fields (diagnosis,
    # symptoms, notes, medicines) so the whole page -- not just the
    # AI summary -- can be shown in the selected language.
    translated = translate_prescription_fields(
        diagnosis=request.diagnosis,
        symptoms=request.symptoms,
        medicines=request.medicines,
        notes=request.notes,
        language=request.language,
    )

    return {
        "success": True,
        "ai_summary": ai_result["summary"],
        "flashcards": ai_result["flashcards"],
        "ai_generated": ai_result.get("ai_generated", False),
        "translated": translated
    }