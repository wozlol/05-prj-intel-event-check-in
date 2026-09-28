const MAX_ATTENDEES = 50;
const STORAGE_KEY = 'intelCheckInState';

const TEAM_LABELS = {
  water: 'Team Water Wise',
  zero: 'Team Net Zero',
  power: 'Team Renewables',
};

const form = document.getElementById('checkInForm');
const nameInput = document.getElementById('attendeeName');
const teamSelect = document.getElementById('teamSelect');
const greetingEl = document.getElementById('greeting');
const attendeeCountEl = document.getElementById('attendeeCount');
const progressBarEl = document.getElementById('progressBar');
const celebrationEl = document.getElementById('celebrationBanner');
const attendeeListEl = document.getElementById('attendeeList');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const clearListBtn = document.getElementById('clearListBtn');
const adminMenuToggle = document.getElementById('adminMenuToggle');
const adminMenu = document.getElementById('adminMenu');
const passwordModalOverlay = document.getElementById('passwordModalOverlay');
const adminPasswordInput = document.getElementById('adminPassword');
const passwordOkBtn = document.getElementById('passwordOkBtn');
const passwordCancelBtn = document.getElementById('passwordCancelBtn');

const teamCountEls = {
  water: document.getElementById('waterCount'),
  zero: document.getElementById('zeroCount'),
  power: document.getElementById('powerCount'),
};

let state = {
  total: 0,
  teams: { water: 0, zero: 0, power: 0 },
  attendees: [],
  celebrated: false,
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state = {
      total: parsed.total || 0,
      teams: { water: 0, zero: 0, power: 0, ...parsed.teams },
      attendees: Array.isArray(parsed.attendees) ? parsed.attendees : [],
      celebrated: Boolean(parsed.celebrated),
    };
  } catch (error) {
    state = { total: 0, teams: { water: 0, zero: 0, power: 0 }, attendees: [], celebrated: false };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateAttendanceUI() {
  attendeeCountEl.textContent = state.total;
  const percent = Math.min(100, Math.round((state.total / MAX_ATTENDEES) * 100));
  progressBarEl.style.width = `${percent}%`;
}

function updateTeamUI() {
  Object.keys(teamCountEls).forEach((team) => {
    teamCountEls[team].textContent = state.teams[team];
  });
}

function renderAttendeeList() {
  attendeeListEl.innerHTML = '';

  state.attendees.forEach((attendee) => {
    const item = document.createElement('li');
    item.className = `attendee-item ${attendee.team}`;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'attendee-name';
    nameSpan.textContent = attendee.name;

    const teamSpan = document.createElement('span');
    teamSpan.className = 'attendee-team';
    teamSpan.textContent = TEAM_LABELS[attendee.team];

    item.append(nameSpan, teamSpan);
    attendeeListEl.appendChild(item);
  });
}

function showGreeting(name, team) {
  greetingEl.textContent = `Welcome, ${name}! Thanks for checking in with ${TEAM_LABELS[team]}.`;
  greetingEl.classList.add('success-message');
  greetingEl.style.display = 'block';
}

function getWinningTeam() {
  return Object.keys(state.teams).reduce((leader, team) =>
    state.teams[team] > state.teams[leader] ? team : leader
  );
}

function showCelebration() {
  const winner = getWinningTeam();
  celebrationEl.textContent = `🎉 We hit our attendance goal! ${TEAM_LABELS[winner]} has the most check-ins so far.`;
  celebrationEl.hidden = false;
}

function renderAll() {
  updateAttendanceUI();
  updateTeamUI();
  renderAttendeeList();

  if (state.celebrated) {
    showCelebration();
  }
}

function handleCheckIn(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const team = teamSelect.value;

  if (!name || !team) return;

  state.total += 1;
  state.teams[team] += 1;
  state.attendees.push({ name, team });

  updateAttendanceUI();
  updateTeamUI();
  renderAttendeeList();
  showGreeting(name, team);

  if (state.total >= MAX_ATTENDEES && !state.celebrated) {
    state.celebrated = true;
    showCelebration();
  }

  saveState();
  form.reset();
  nameInput.focus();
}

function escapeCsvField(value) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadAttendeeCsv() {
  const rows = [
    ['Name', 'Team'],
    ...state.attendees.map((attendee) => [attendee.name, TEAM_LABELS[attendee.team]]),
  ];
  const csvContent = rows.map((row) => row.map(escapeCsvField).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'attendee-list.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function clearAttendeeList() {
  const confirmed = window.confirm(
    'Clear the attendee list? This resets the attendee list, attendance count, and team totals, and cannot be undone.'
  );
  if (!confirmed) return;

  state = {
    total: 0,
    teams: { water: 0, zero: 0, power: 0 },
    attendees: [],
    celebrated: false,
  };

  saveState();
  renderAll();
  celebrationEl.hidden = true;
  greetingEl.style.display = 'none';
}

function openPasswordModal() {
  adminPasswordInput.value = '';
  passwordModalOverlay.hidden = false;
  adminPasswordInput.focus();
}

function closePasswordModal() {
  passwordModalOverlay.hidden = true;
}

function openAdminMenu() {
  adminMenu.hidden = false;
  adminMenuToggle.setAttribute('aria-expanded', 'true');
}

function closeAdminMenu() {
  adminMenu.hidden = true;
  adminMenuToggle.setAttribute('aria-expanded', 'false');
}

adminMenuToggle.addEventListener('click', () => {
  if (!adminMenu.hidden) {
    closeAdminMenu();
    return;
  }
  openPasswordModal();
});

passwordOkBtn.addEventListener('click', (event) => {
  // Stop this click from also reaching the outside-click handler below,
  // which would otherwise close the menu the instant it opens.
  event.stopPropagation();
  closePasswordModal();
  openAdminMenu();
});

passwordCancelBtn.addEventListener('click', closePasswordModal);

adminPasswordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    passwordOkBtn.click();
  }
});

document.addEventListener('click', (event) => {
  const clickedInsideMenu = adminMenu.contains(event.target);
  const clickedToggle = adminMenuToggle.contains(event.target);
  if (!adminMenu.hidden && !clickedInsideMenu && !clickedToggle) {
    closeAdminMenu();
  }
});

loadState();
renderAll();
form.addEventListener('submit', handleCheckIn);
downloadCsvBtn.addEventListener('click', () => {
  downloadAttendeeCsv();
  closeAdminMenu();
});
clearListBtn.addEventListener('click', () => {
  clearAttendeeList();
  closeAdminMenu();
});
