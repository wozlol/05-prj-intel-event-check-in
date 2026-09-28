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

loadState();
renderAll();
form.addEventListener('submit', handleCheckIn);
