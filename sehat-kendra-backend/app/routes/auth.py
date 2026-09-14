import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.supabase_client import supabase


router = APIRouter(
    prefix="/auth/aadhaar",
    tags=["Aadhaar Authentication"]
)


# -----------------------------
# REQUEST OTP
# -----------------------------

class AadhaarOTPRequest(BaseModel):
    aadhaar: str
    consent: bool


@router.post("/request-otp")
def request_otp(data: AadhaarOTPRequest):

    # Validate Aadhaar
    if not data.aadhaar.isdigit() or len(data.aadhaar) != 12:
        raise HTTPException(
            status_code=400,
            detail="Aadhaar must contain exactly 12 digits"
        )

    # Consent is mandatory
    if not data.consent:
        raise HTTPException(
            status_code=400,
            detail="Consent is required for Aadhaar authentication"
        )

    # Hash Aadhaar - never store raw Aadhaar
    aadhaar_hash = hashlib.sha256(
        data.aadhaar.encode()
    ).hexdigest()

    # Generate transaction ID
    transaction_id = secrets.token_urlsafe(18)

    # DEMO OTP
    demo_otp = "123456"

    try:
        # Check whether this Aadhaar already exists
        existing = (
            supabase
            .table("aadhaar_auth")
            .select("id")
            .eq("aadhaar_hash", aadhaar_hash)
            .execute()
        )

        if existing.data:

            # Existing Aadhaar:
            # update it with a fresh transaction
            response = (
                supabase
                .table("aadhaar_auth")
                .update({
                    "transaction_id": transaction_id,
                    "consent_given": True,
                    "otp_verified": False
                })
                .eq("aadhaar_hash", aadhaar_hash)
                .execute()
            )

        else:

            # New Aadhaar
            response = (
                supabase
                .table("aadhaar_auth")
                .insert({
                    "aadhaar_hash": aadhaar_hash,
                    "transaction_id": transaction_id,
                    "consent_given": True,
                    "otp_verified": False
                })
                .execute()
            )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Could not create authentication transaction"
            )

        return {
            "message": "OTP request created successfully",
            "transaction_id": transaction_id,
            "demo_otp": demo_otp
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Authentication transaction failed: {str(e)}"
        )


# -----------------------------
# VERIFY OTP
# -----------------------------

class AadhaarOTPVerify(BaseModel):
    aadhaar: str
    transaction_id: str
    otp: str


@router.post("/verify-otp")
def verify_otp(data: AadhaarOTPVerify):

    # Validate Aadhaar
    if not data.aadhaar.isdigit() or len(data.aadhaar) != 12:
        raise HTTPException(
            status_code=400,
            detail="Aadhaar must contain exactly 12 digits"
        )

    # Validate OTP
    if data.otp != "123456":
        raise HTTPException(
            status_code=401,
            detail="Invalid OTP"
        )

    aadhaar_hash = hashlib.sha256(
        data.aadhaar.encode()
    ).hexdigest()

    try:
        # Find transaction
        response = (
            supabase
            .table("aadhaar_auth")
            .select("*")
            .eq("aadhaar_hash", aadhaar_hash)
            .eq("transaction_id", data.transaction_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Authentication transaction not found"
            )

        # Mark OTP as verified
        update_response = (
            supabase
            .table("aadhaar_auth")
            .update({
                "otp_verified": True
            })
            .eq("aadhaar_hash", aadhaar_hash)
            .eq("transaction_id", data.transaction_id)
            .execute()
        )

        if not update_response.data:
            raise HTTPException(
                status_code=500,
                detail="Could not update authentication status"
            )

        return {
            "message": "Aadhaar authentication successful",
            "transaction_id": data.transaction_id,
            "authenticated": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OTP verification failed: {str(e)}"
        )