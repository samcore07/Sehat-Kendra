// ============================================================
// AYUSH WELLNESS — tab content, systems strip, daily routine tracker
// ============================================================
// Previously the "Explore AYUSH" screen had a hero + tab row but no
// JavaScript behind it: `openAyush()` and `selectWellnessTab()` did
// not exist anywhere, so the tabs could not be clicked and the panel
// was always empty. This file adds that missing behaviour.

// ---- Content for each of the 5 wellness tabs ----
const AYUSH_WELLNESS_DATA = [
  {
    eyebrow: "Dinacharya",
    title: "☀ Daily Wellness Routine",
    sub: "Anchoring the body's clock to nature's rhythm",
    desc: "Dinacharya is the Ayurvedic practice of aligning daily habits with natural cycles of light, digestion, and rest. A steady routine is considered as important as any single remedy.",
    items: [
      { title: "Wake before sunrise", text: "Rising with Vata time (roughly 4:30–6:00 AM) supports mental clarity and a calmer nervous system through the day." },
      { title: "Tongue scraping & oral care", text: "Gently scrape the tongue and rinse the mouth to clear overnight toxins (ama) before eating or drinking anything." },
      { title: "Warm water on waking", text: "A glass of warm (or room-temperature) water helps kick-start digestion and gentle elimination." },
      { title: "Abhyanga (self-massage)", text: "A few minutes of warm oil massage before bathing calms the nervous system and supports circulation." },
      { title: "Eat at consistent times", text: "Taking meals at the same times daily, with the largest meal at midday, supports steady digestive fire (Agni)." },
      { title: "Wind down before sleep", text: "Dim lights and avoid screens for 30–45 minutes before bed to prepare the body for rest." }
    ],
    note: "Introduce one or two Dinacharya practices at a time rather than all at once — consistency matters more than doing everything from day one.",
    trackable: true
  },
  {
    eyebrow: "Nidra",
    title: "☾ Sleep &amp; Restful Rejuvenation",
    sub: "Sleep as one of Ayurveda's three pillars of health",
    desc: "Nidra (restorative sleep) is considered essential alongside diet and lifestyle. Poor or irregular sleep is seen as a root cause of many imbalances.",
    items: [
      { title: "Consistent sleep window", text: "Sleeping and waking at the same time daily — ideally by 10 PM — supports the body's natural Pitta-driven repair cycle at night." },
      { title: "Light, early dinner", text: "A lighter evening meal, finished 2–3 hours before bed, prevents disturbed or heavy sleep." },
      { title: "Warm milk or herbal tea", text: "A small warm drink with a pinch of nutmeg or ashwagandha is a traditional aid for calming the mind before bed." },
      { title: "Foot massage (Padabhyanga)", text: "A short warm-oil foot massage before bed is traditionally used to ground restless energy and ease into sleep." }
    ],
    note: "Persistent insomnia, very disturbed sleep, or excessive daytime sleepiness should be discussed with a doctor or Vaidya rather than managed alone.",
    trackable: false
  },
  {
    eyebrow: "Yoga & Asana",
    title: "🧘 Yoga &amp; Therapeutic Asanas",
    sub: "Gentle, joint-friendly movement for everyday mobility",
    desc: "These postures are commonly recommended as gentle starting points for joint mobility and spinal health. They are not a replacement for physiotherapy advice for an existing injury.",
    items: [
      { title: "Tadasana (Mountain Pose)", text: "A grounding standing posture that improves posture awareness and balance. Good as a warm-up before any routine." },
      { title: "Marjariasana (Cat-Cow)", text: "Gentle spinal flexion and extension that eases stiffness in the lower back and neck, done slowly with the breath." },
      { title: "Vrikshasana (Tree Pose)", text: "A balance posture that builds leg strength and concentration; use a wall for support if needed." },
      { title: "Setu Bandhasana (Bridge Pose)", text: "Strengthens the lower back and glutes gently — helpful for common desk-related stiffness." },
      { title: "Shavasana (Final Rest)", text: "A few minutes of complete stillness at the end of any session to let the nervous system settle." }
    ],
    note: "Avoid new postures during acute pain, pregnancy, or after recent surgery without first checking with your doctor or a qualified yoga therapist.",
    trackable: false
  },
  {
    eyebrow: "Pranayama",
    title: "🌬 Breathing Practices",
    sub: "Simple breath control for stress downregulation",
    desc: "Pranayama uses controlled breathing to influence the nervous system. A few minutes daily is often enough to notice a difference in stress levels.",
    items: [
      { title: "Nadi Shodhana (Alternate Nostril)", text: "Slow alternate-nostril breathing for 5 minutes is widely used to calm the mind before study, work, or sleep." },
      { title: "Bhramari (Bee Breath)", text: "A humming exhale that is traditionally used to ease anxiety and mental tension in a few rounds." },
      { title: "Ujjayi (Ocean Breath)", text: "A slow, audible breath used during gentle yoga practice to keep attention steady and the pace unhurried." },
      { title: "Deep diaphragmatic breathing", text: "Simple belly breathing — inhale 4 counts, exhale 6 counts — for a quick reset during a stressful moment." }
    ],
    note: "Practice pranayama on an empty stomach in a well-ventilated space. Those with respiratory or heart conditions should get guidance before advanced techniques (e.g. breath retention).",
    trackable: false
  },
  {
    eyebrow: "Ahara",
    title: "🍽 Mindful Nutrition",
    sub: "Eating in step with your body's digestive capacity",
    desc: "Ahara (diet) in Ayurveda focuses as much on how and when you eat as on what you eat, favouring fresh, warm, seasonal food eaten without distraction.",
    items: [
      { title: "Eat your largest meal at midday", text: "Digestive fire is considered strongest around noon, making it the best time for the day's heaviest meal." },
      { title: "Favour warm, freshly cooked food", text: "Freshly prepared, warm meals are considered easier to digest than cold, raw, or reheated leftovers." },
      { title: "Eat without distraction", text: "Eating slowly, seated, and without a screen is traditionally linked to better digestion and satiety awareness." },
      { title: "Sip warm water with meals", text: "Small sips of warm water during a meal are preferred over large amounts of cold water, which can dull digestion." },
      { title: "Leave a gap before sleep", text: "Finishing dinner at least 2–3 hours before bed supports overnight digestion and sleep quality." }
    ],
    note: "Ayurvedic dietary guidance is general lifestyle advice, not treatment for a diagnosed condition — consult your doctor or a Vaidya about diet for a specific illness (e.g. diabetes).",
    trackable: false
  }
];

// ---- AYUSH systems overview (what "AYUSH" actually stands for) ----
const AYUSH_SYSTEMS = [
  { title: "Ayurveda", text: "Classical Indian medicine focused on balance between body, mind, and lifestyle." },
  { title: "Yoga & Naturopathy", text: "Postures, breathwork, and nature-based therapies for mobility and stress relief." },
  { title: "Unani", text: "Greco-Arabic tradition using herbal and dietary regimens for balance of temperament." },
  { title: "Siddha", text: "A South Indian system emphasising herbo-mineral formulations and lifestyle regimen." },
  { title: "Homeopathy", text: "Highly diluted natural substances used under the principle of \"like cures like\"." },
  { title: "Sowa-Rigpa", text: "The Himalayan/Tibetan medical tradition, now recognised under AYUSH." }
];

let ayushSelectedTabIndex = 0;

// Local, session-only progress store for the Dinacharya tracker.
if (typeof state !== "undefined" && !state.ayush) {
  state.ayush = { routineProgress: {} };
}


// ============ OPEN AYUSH SCREEN ============
function openAyush() {

  renderAyushSystemsStrip();
  renderAyushRoutineTracker();

  const panel = document.getElementById("wellnessPanel");

  if (panel && !panel.dataset.loaded) {
    renderWellnessTab(ayushSelectedTabIndex);
  }

  showScreen("screen-ayush");
}


// ============ SYSTEMS STRIP ============
function renderAyushSystemsStrip() {

  const strip = document.getElementById("ayushSystemsStrip");

  if (!strip || strip.dataset.loaded) return;

  strip.innerHTML = AYUSH_SYSTEMS.map(system => `
    <div class="wellness-item">
      <h5>${system.title}</h5>
      <p>${system.text}</p>
    </div>
  `).join("");

  strip.dataset.loaded = "true";
}


// ============ TAB SWITCHING ============
function selectWellnessTab(el, index) {

  ayushSelectedTabIndex = index;

  const tabRow = document.getElementById("wellnessTabRow");

  if (tabRow) {
    tabRow.querySelectorAll(".tab").forEach(tab => {
      tab.classList.remove("selected");
    });
  }

  if (el) {
    el.classList.add("selected");
  }

  renderWellnessTab(index);
}


function renderWellnessTab(index) {

  const data = AYUSH_WELLNESS_DATA[index];

  const panel = document.getElementById("wellnessPanel");

  if (!data || !panel) return;

  panel.innerHTML = `
    <span class="eyebrow-pill">${data.eyebrow}</span>
    <h3>${data.title}</h3>
    <p class="wellness-sub">${data.sub}</p>
    <p class="wellness-desc">${data.desc}</p>
    <div class="wellness-grid">
      ${data.items.map(item => `
        <div class="wellness-item">
          <h5>${item.title}</h5>
          <p>${item.text}</p>
        </div>
      `).join("")}
    </div>
    <p class="wellness-note">⚠ ${data.note}</p>
    <button class="btn btn-outline" onclick="consultVaidyaFromAyush()">Ask a Vaidya about ${data.eyebrow} →</button>
  `;

  panel.dataset.loaded = "true";

  const tracker = document.getElementById("ayushRoutineTracker");

  if (tracker) {
    tracker.style.display = data.trackable ? "" : "none";
  }
}


// ============ DAILY ROUTINE TRACKER (Dinacharya) ============
function renderAyushRoutineTracker() {

  const dinacharya = AYUSH_WELLNESS_DATA[0];
  const checklist = document.getElementById("ayushRoutineChecklist");

  if (!checklist || checklist.dataset.loaded) {
    updateAyushRoutineProgress();
    return;
  }

  checklist.className = "check-grid";

  checklist.innerHTML = dinacharya.items.map((item, i) => `
    <label>
      <input
        type="checkbox"
        id="ayushRoutineItem${i}"
        onchange="toggleAyushRoutineItem(${i})"
      >
      ${item.title}
    </label>
  `).join("");

  checklist.dataset.loaded = "true";

  updateAyushRoutineProgress();
}


function toggleAyushRoutineItem(index) {

  const checkbox = document.getElementById("ayushRoutineItem" + index);

  if (!checkbox) return;

  state.ayush.routineProgress[index] = checkbox.checked;

  updateAyushRoutineProgress();
}


function updateAyushRoutineProgress() {

  const total = AYUSH_WELLNESS_DATA[0].items.length;

  const completed = Object.values(state.ayush.routineProgress)
    .filter(Boolean).length;

  const percent = total
    ? Math.round((completed / total) * 100)
    : 0;

  const label = document.getElementById("ayushRoutineLabel");
  const percentLabel = document.getElementById("ayushRoutinePercent");
  const fill = document.getElementById("ayushRoutineFill");

  if (label) label.textContent = `${completed} of ${total} practices completed`;
  if (percentLabel) percentLabel.textContent = `${percent}%`;
  if (fill) fill.style.width = percent + "%";
}


function resetAyushRoutine() {

  state.ayush.routineProgress = {};

  document
    .querySelectorAll("#ayushRoutineChecklist input[type='checkbox']")
    .forEach(box => { box.checked = false; });

  updateAyushRoutineProgress();
}


// ============ BOOK A VAIDYA DIRECTLY FROM AYUSH ============
function consultVaidyaFromAyush() {

  state.booking.pathway = "ayurveda";
  state.booking.doctor = "Vaidya Dr. Rajesh Sharma";
  state.booking.doctorRole = "Kayachikitsa (Internal Medicine & Joint Care)";

  showScreen("screen-book-2-ayurveda");
}
