function goToConsent() {

  state.booking.mode =
    document.getElementById("consultMode").value;

  const dateInput =
    document.getElementById("consultDate").value;

  // Keep PostgreSQL date format: YYYY-MM-DD
  if (dateInput) {

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      // Already correct
      state.booking.date = dateInput;

    } else {
      // Try to extract a date from text like:
      // Tomorrow (10 Sep 2026)
      const match = dateInput.match(
        /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/
      );

      if (match) {

        const day = match[1].padStart(2, "0");
        const monthName = match[2];
        const year = match[3];

        const months = {
          January: "01",
          February: "02",
          March: "03",
          April: "04",
          May: "05",
          June: "06",
          July: "07",
          August: "08",
          September: "09",
          October: "10",
          November: "11",
          December: "12"
        };

        if (months[monthName]) {
          state.booking.date =
            `${year}-${months[monthName]}-${day}`;
        } else {
          alert("Invalid appointment date.");
          return;
        }

      } else {
        alert("Invalid appointment date.");
        return;
      }
    }

  } else {
    alert("Please select an appointment date.");
    return;
  }

  showScreen("screen-book-consent");
  renderBookingSummary();
}
// ============ BOOKING SUMMARY (CONSENT SCREEN) ============
function renderBookingSummary() {

  const box = document.getElementById("consentSummary");

  if (box) {

    const b = state.booking;

    let formattedDate = "Not selected";

    if (b.date) {
      const parsed = new Date(b.date + "T00:00:00");

      if (!isNaN(parsed)) {
        formattedDate = parsed.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
      }
    }

    box.innerHTML = `
      <p><strong>Doctor:</strong> ${b.doctor}</p>
      <p><strong>Specialisation:</strong> ${b.doctorRole}</p>
      <p><strong>Consultation Mode:</strong> ${b.mode}</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time Slot:</strong> ${b.slot}</p>
    `;
  }

  const select = document.getElementById("rxAttachSelect");

  if (select) {

    select.innerHTML =
      '<option value="">None (optional)</option>';

    (state.prescriptions || []).forEach(rx => {

      const option = document.createElement("option");

      option.value = rx.id;

      option.textContent =
        rx.title || rx.name || `Prescription #${rx.id}`;

      select.appendChild(option);
    });
  }
}


// ============ BACKEND APPOINTMENT BOOKING ============
async function confirmBooking() {

  const consent = document.getElementById("bookingConsent");

  if (!consent || !consent.checked) {
    alert("Please consent to share your health record with the doctor.");
    return;
  }

  // Use logged-in patient, otherwise demo patient
  const patientId = state.patientId || 1;

  const select = document.getElementById("rxAttachSelect");

  const prescriptionId =
    select && select.value && /^\d+$/.test(select.value)
      ? select.value
      : null;

  const payload = {
    patient_id: String(patientId),

    doctor: state.booking.doctor || "Dr. Priya Sharma",

    doctor_role:
      state.booking.doctorRole || "General Medicine",

    mode:
      state.booking.mode || "In-Person Hospital OPD",

    appointment_date:
      state.booking.date,

    appointment_time:
      state.booking.slot || "10:00 AM",

    prescription_id: prescriptionId,

    consent: true
  };

  console.log("Booking appointment:", payload);

  try {

    const response = await fetch(
      `${BACKEND_URL}/appointments`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Appointment booking failed."
      );
    }

    console.log(
      "Appointment successfully saved:",
      data
    );

    state.booking.confirmed = true;

    state.booking.backendAppointment =
      data.appointment || data;

    alert("Appointment booked successfully! ✅");

    showScreen("screen-book-confirm");

  } catch (error) {

    console.error(
      "Appointment booking error:",
      error
    );

    alert(
      "Unable to book appointment.\n\n" +
      error.message
    );
  }
}
