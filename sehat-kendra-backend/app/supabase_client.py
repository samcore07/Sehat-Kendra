import os

from dotenv import load_dotenv

from supabase import create_client, Client


# Load .env
load_dotenv()


# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_KEY = os.getenv("SUPABASE_KEY")


# Validate configuration
if not SUPABASE_URL:

    raise ValueError(
        "SUPABASE_URL is not set in .env"
    )


if not SUPABASE_KEY:

    raise ValueError(
        "SUPABASE_KEY is not set in .env"
    )


# Create Supabase client
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)