// ================= MOBILE OTP DEMO =================

let mobileDemoOtp = null;

function requestMobileOtp() {

  const input = document.getElementById("mobileLoginNumber");

  if (!input) {
    alert("Mobile number field not found.");
    return;
  }

  const mobile = input.value.replace(/\D/g, "");

  if (!/^\d{10}$/.test(mobile)) {
    alert("Please enter a valid 10-digit demo mobile number.");
    return;
  }

  // Generate demo OTP
  mobileDemoOtp =
    Math.floor(100000 + Math.random() * 900000).toString();

  // Move to OTP screen
  showScreen("screen-mobile-otp");

  // Show OTP for demo
  alert(
    "Demo Mobile OTP:\n\n" +
    mobileDemoOtp
  );

  const otpInput =
    document.getElementById("mobileOtpInput");

  if (otpInput) {
    setTimeout(() => {
      otpInput.focus();
    }, 100);
  }
}


function verifyMobileOtp() {

  const otpInput =
    document.getElementById("mobileOtpInput");

  if (!otpInput) {
    alert("OTP field not found.");
    return;
  }

  const enteredOtp =
    otpInput.value.trim();

  if (!/^\d{6}$/.test(enteredOtp)) {
    alert("Please enter the complete 6-digit OTP.");
    return;
  }

  if (enteredOtp !== mobileDemoOtp) {
    alert("Invalid OTP. Please enter the demo OTP shown earlier.");
    return;
  }

  // Demo login successful
  state.loggedIn = true;
  state.patientId = 1;
  state.patientName = "Demo Citizen";
  state.abhaId = "DEMO-MOBILE-VERIFIED";

  alert("Mobile verification successful! ✅");

  enterApp("screen-dashboard");
}// ======================================================
