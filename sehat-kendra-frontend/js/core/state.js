// ============ BACKEND CONNECTION ============
const BACKEND_URL = "http://127.0.0.1:8000";

let aadhaarTransactionId = null;
// ============ STATE ============
const state = {
  loggedIn: false,
  patientId: null,
  patientName: "Guest Citizen",
  abhaId: null,
  conditions: [],
  medicines: [],
  allergies: [],
  registration: {},
  booking: {
    pathway: "general",
    doctor: "Dr. Priya Sharma",
    doctorRole: "General Medicine",
    mode: "In-Person Hospital OPD",
    date: "",
    slot: "10:00 AM",
    confirmed: false,
    attachedPrescriptionId: ""
  },
  prescriptions: []
};
