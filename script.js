// =======================
// 🔹 VARIABEL UTAMA
// =======================
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let running = false;
let paused = false;

const todayDate = new Date().toLocaleDateString("id-ID");
let currentDate = todayDate;
let savedData = JSON.parse(localStorage.getItem("dailyData")) || {};
let groups = savedData[currentDate] || [];
let currentGroup = groups.length > 0 ? groups[groups.length - 1] : null;

// =======================
// 🔹 ELEMENT DOM
// =======================
const timeDisplay = document.getElementById("timeDisplay");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const groupNameInput = document.getElementById("groupNameInput");
const newGroupBtn = document.getElementById("newGroupBtn");
const currentGroupLabel = document.getElementById("currentGroup");
const groupContainer = document.getElementById("groupContainer");
const dateSelector = document.getElementById("dateSelector");
const todayLabel = document.getElementById("todayLabel");
const dateToggle = document.getElementById("dateToggle");

// =======================
// 🔹 FUNGSI BANTU
// =======================
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function updateTime() {
  if (!running) return;
  const now = Date.now();
  elapsedTime = now - startTime;
  timeDisplay.textContent = formatTime(elapsedTime);
}

function saveDataForDate(date) {
  let allData = JSON.parse(localStorage.getItem("dailyData")) || {};
  allData[date] = groups;
  localStorage.setItem("dailyData", JSON.stringify(allData));
  refreshDateDropdown();
}

function refreshDateDropdown() {
  dateSelector.innerHTML = "";
  let allData = JSON.parse(localStorage.getItem("dailyData")) || {};
  Object.keys(allData)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach(date => {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = date;
      if (date === currentDate) option.selected = true;
      dateSelector.appendChild(option);
    });
}

function renderGroups() {
  groupContainer.innerHTML = "";
  groups.forEach((group, index) => {
    const div = document.createElement("div");
    div.className = "group";

    const header = document.createElement("div");
    header.className = "group-header";

    const title = document.createElement("h3");
    title.textContent = `📁 ${group.name}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Hapus Grup";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = () => {
      if (confirm(`Yakin ingin menghapus grup "${group.name}"?`)) {
        groups.splice(index, 1);
        saveDataForDate(currentDate);
        renderGroups();
      }
    };

    header.appendChild(title);
    header.appendChild(deleteBtn);

    const list = document.createElement("ul");
    group.records.forEach(record => {
      const li = document.createElement("li");
      li.innerHTML = record;
      list.appendChild(li);
    });

    div.appendChild(header);
    div.appendChild(list);
    groupContainer.appendChild(div);
  });
}

function playBeep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  audio.play();
}

// =======================
// 🔹 EVENT HANDLER
// =======================

// Start
startBtn.addEventListener("click", () => {
  if (!currentGroup) return alert("Buat grup terlebih dahulu sebelum memulai!");
  if (running && !paused) return;

  if (paused) {
    // lanjut dari pause
    startTime = Date.now() - elapsedTime;
    paused = false;
  } else {
    // mulai baru
    elapsedTime = 0;
    startTime = Date.now();
  }

  running = true;
  timerInterval = setInterval(updateTime, 100);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
  playBeep();
});

// Pause
pauseBtn.addEventListener("click", () => {
  if (!running) return;
  paused = true;
  running = false;
  clearInterval(timerInterval);
  pauseBtn.disabled = true;
  startBtn.disabled = false;
  stopBtn.disabled = false;
  playBeep();
});

// Stop
stopBtn.addEventListener("click", () => {
  if (!currentGroup) return alert("Buat grup terlebih dahulu sebelum merekam!");
  if (!elapsedTime) return alert("Belum ada waktu yang berjalan!");

  running = false;
  paused = false;
  clearInterval(timerInterval);
  stopBtn.disabled = true;
  startBtn.disabled = false;
  pauseBtn.disabled = true;

  const now = new Date();
  const tanggal = now.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const waktuMulai = new Date(startTime).toLocaleTimeString();
  const waktuBerhenti = now.toLocaleTimeString();
  const total = formatTime(elapsedTime);

  const record = `
📅 ${tanggal}<br>
🕒 Mulai: ${waktuMulai}<br>
⏸️ Berhenti: ${waktuBerhenti}<br>
⏱️ Durasi: ${total}
`;

  currentGroup.records.push(record);
  saveDataForDate(todayDate);
  renderGroups();

  elapsedTime = 0;
  timeDisplay.textContent = "00:00:00";
  playBeep();
});

// Grup baru
newGroupBtn.addEventListener("click", () => {
  const name = groupNameInput.value.trim();
  if (name === "") return alert("Masukkan nama grup terlebih dahulu!");

  let allData = JSON.parse(localStorage.getItem("dailyData")) || {};
  if (!allData[todayDate]) allData[todayDate] = [];

  const newGroup = { name, records: [] };
  allData[todayDate].push(newGroup);
  localStorage.setItem("dailyData", JSON.stringify(allData));

  currentGroup = newGroup;
  groups = allData[todayDate];
  renderGroups();
  currentGroupLabel.textContent = name;
  groupNameInput.value = "";
  refreshDateDropdown();
});

// Export
document.getElementById("exportBtn").addEventListener("click", () => {
  let allData = JSON.parse(localStorage.getItem("dailyData")) || {};
  if (Object.keys(allData).length === 0) return alert("Belum ada data untuk diekspor!");

  let dataExcel = [["Tanggal", "Grup", "Mulai", "Berhenti", "Durasi"]];
  for (let date in allData) {
    allData[date].forEach(group => {
      group.records.forEach(record => {
        let mulai = record.match(/Mulai:\s*([\d:.]+)/)?.[1] || "-";
        let berhenti = record.match(/Berhenti:\s*([\d:.]+)/)?.[1] || "-";
        let durasi = record.match(/Durasi:\s*([\d:.]+)/)?.[1] || "-";
        dataExcel.push([date, group.name, mulai, berhenti, durasi]);
      });
    });
  }
  let ws = XLSX.utils.aoa_to_sheet(dataExcel);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Stopwatch");
  XLSX.writeFile(wb, "Data_Stopwatch.xlsx");
});

// =======================
// 🔹 INISIALISASI
// =======================
refreshDateDropdown();
renderGroups();
if (groups.length > 0) {
  currentGroup = groups[groups.length - 1];
  currentGroupLabel.textContent = currentGroup.name;
}
todayLabel.textContent = `📅 : ${todayDate}`;

// Tema
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  let currentTheme = localStorage.getItem("theme") || "dark";
  if (currentTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️";
  } else {
    themeToggle.textContent = "🌙";
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.textContent = isLight ? "☀️" : "🌙";
  });
}

// Toggle tanggal
dateToggle.addEventListener("click", () => {
  dateSelector.classList.toggle("hidden");
});