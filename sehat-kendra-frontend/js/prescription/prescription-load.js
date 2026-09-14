// ============================================================
// LOAD PRESCRIPTIONS FROM SUPABASE THROUGH FASTAPI
// ============================================================

async function loadPrescriptionsFromBackend() {

    const container =
        document.getElementById("rxSavedList");

    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⏳</div>
            <p>Loading your prescriptions...</p>
        </div>
    `;

    try {

        const response = await fetch(
            `${PRESCRIPTION_API}/prescriptions/${PRESCRIPTION_PATIENT_ID}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Could not load prescriptions"
            );
        }

        const prescriptions =
            data.prescriptions || [];

        if (prescriptions.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>No saved prescriptions yet.</p>
                    <p class="muted">
                        Upload a prescription or speak your symptoms.
                    </p>
                </div>
            `;

            return;
        }

        // Keep the raw records around so clicking a row can reopen it
        // (with a freshly generated AI summary) without another fetch.
        window.sehatKendraSavedPrescriptions = prescriptions;

        container.innerHTML = prescriptions.map((rx, index) => {

            const medicines =
                Array.isArray(rx.medicines)
                    ? rx.medicines
                    : [];

            return `
                <div class="rx-list-item" onclick="viewSavedPrescription(window.sehatKendraSavedPrescriptions[${index}])">

                    <div>

                        <strong>
                            ${rx.diagnosis || "Digital Prescription"}
                        </strong>

                        <p class="muted">
                            ${rx.symptoms || "No symptoms recorded"}
                        </p>

                        <small>
                            ${medicines.length} medicine(s)
                        </small>

                    </div>

                    <span class="rx-source-tag">
                        ${rx.source || "Digital"}
                    </span>

                </div>
            `;

        }).join("");

    } catch (error) {

        console.error(
            "Prescription loading error:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">⚠️</div>

                <p>
                    Unable to connect to the prescription backend.
                </p>

                <button
                    class="btn btn-outline"
                    onclick="loadPrescriptionsFromBackend()"
                >
                    Retry
                </button>

            </div>
        `;
    }
}
