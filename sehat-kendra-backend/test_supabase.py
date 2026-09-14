from app.supabase_client import supabase

try:
    response = supabase.table("patients").select("*").limit(5).execute()

    print("SUPABASE CONNECTED SUCCESSFULLY")
    print("Patients:", response.data)

except Exception as e:
    print("SUPABASE ERROR")
    print(e)