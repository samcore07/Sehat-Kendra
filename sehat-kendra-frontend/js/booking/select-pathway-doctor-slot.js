// ============ BOOKING FLOW ============

function selectPathway(kind, el) {
  state.booking.pathway = kind;

  document.querySelectorAll(".pathway-card").forEach(card => {
    card.classList.remove("selected");

    const btn = card.querySelector(".btn");

    if (btn) {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-outline");
    }
  });

  el.classList.add("selected");

  const btn = el.querySelector(".btn");

  if (btn) {
    btn.classList.remove("btn-outline");
    btn.classList.add("btn-primary");
  }
}


function goToDoctorStep() {

  if (state.booking.pathway === "ayurveda") {

    state.booking.doctor = "Vaidya Dr. Rajesh Sharma";

    state.booking.doctorRole =
      "Kayachikitsa (Internal Medicine & Joint Care)";

    showScreen("screen-book-2-ayurveda");

  } else {

    state.booking.doctor = "Dr. Priya Sharma";

    state.booking.doctorRole =
      "General Medicine";

    showScreen("screen-book-2-general");
  }
}


function selectDoctor(el, name, role) {

  state.booking.doctor = name;
  state.booking.doctorRole = role;

  const grid = el.closest(".doctor-grid");

  grid.querySelectorAll(".doctor-card").forEach(card => {

    card.classList.remove("selected");

    const btn = card.querySelector(".btn");

    if (btn) {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-outline");
      btn.textContent = "Select";
    }
  });

  el.classList.add("selected");

  const btn = el.querySelector(".btn");

  if (btn) {
    btn.classList.remove("btn-outline");
    btn.classList.add("btn-primary");
    btn.textContent = "Selected";
  }
}


function selectSlot(el) {

  state.booking.slot =
    el.textContent.trim();

  const grid =
    el.closest(".slot-grid");

  grid.querySelectorAll(".slot")
    .forEach(slot =>
      slot.classList.remove("selected")
    );

  el.classList.add("selected");
}
function goBackFromStep3() {
  if (state.booking.pathway === "ayurveda") {
    showScreen("screen-book-2-ayurveda");
  } else {
    showScreen("screen-book-2-general");
  }
}
