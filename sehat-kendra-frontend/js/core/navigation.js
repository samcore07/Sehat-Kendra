// ============ SCREEN NAVIGATION ============
function showScreen(id) {

  // Stop any "Listen" narration from the screen being left, so audio
  // never keeps reading out a screen the user has already navigated
  // away from.
  if ("speechSynthesis" in window && speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });

  const target = document.getElementById(id);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ============ LOGIN / APP ENTRY ============
function enterApp(nextScreenId) {

  state.loggedIn = true;

  const pill = document.getElementById("guestPill");

  if (pill) {
    pill.textContent =
      "☀ " + (state.patientName || "Citizen");
  }

  const preAuth =
    document.getElementById("preAuthActions");

  const postAuth =
    document.getElementById("postAuthNav");

  if (preAuth) {
    preAuth.classList.add("hidden");
  }

  if (postAuth) {
    postAuth.classList.remove("hidden");
  }

  showScreen(nextScreenId);
}


// ============ LOGOUT ============
function logout() {

  state.loggedIn = false;

  const preAuth =
    document.getElementById("preAuthActions");

  const postAuth =
    document.getElementById("postAuthNav");

  if (preAuth) {
    preAuth.classList.remove("hidden");
  }

  if (postAuth) {
    postAuth.classList.add("hidden");
  }

  showScreen("screen-landing");
}


// ============ HOME ============
function goHome() {

  if (state.loggedIn) {
    showScreen("screen-dashboard");
  }
}
