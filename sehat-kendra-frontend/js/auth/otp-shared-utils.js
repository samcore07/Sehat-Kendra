// ============ AADHAAR INPUT ============
function getAadhaarInput() {
  return document.getElementById("abhaId");
}


// ============ OTP INPUTS ============
function getOtpValue() {
  const otpBoxes = document.querySelectorAll(".otp-boxes input");

  if (otpBoxes.length === 6) {
    return Array.from(otpBoxes)
      .map(box => box.value.trim())
      .join("");
  }

  const singleOtp =
    document.getElementById("otp") ||
    document.getElementById("aadhaarOtp") ||
    document.getElementById("otpInput");

  return singleOtp ? singleOtp.value.trim() : "";
}

// ============ OTP BOX AUTO MOVE ============
document.addEventListener(
  "input",
  function (event) {

    if (
      !event.target.matches(
        ".otp-boxes input"
      )
    ) {
      return;
    }

    const box = event.target;

    box.value =
      box.value
        .replace(/\D/g, "")
        .slice(0, 1);

    if (box.value) {

      const next =
        box.nextElementSibling;

      if (
        next &&
        next.matches("input")
      ) {
        next.focus();
      }
    }
  }
);


// ============ OTP BACKSPACE ============
document.addEventListener(
  "keydown",
  function (event) {

    if (
      !event.target.matches(
        ".otp-boxes input"
      )
    ) {
      return;
    }

    if (
      event.key === "Backspace" &&
      !event.target.value
    ) {

      const previous =
        event.target.previousElementSibling;

      if (
        previous &&
        previous.matches("input")
      ) {
        previous.focus();
      }
    }
  }
);
