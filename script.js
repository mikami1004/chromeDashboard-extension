// --- 1. 時計と挨拶機能 ---
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = `${hours}:${minutes}`;

  // 時間帯に応じた挨拶
  const hour = now.getHours();
  let greeting = 'こんにちは';
  if (hour < 12) greeting = 'おはようございます';
  else if (hour >= 18) greeting = 'こんばんは';

  document.getElementById('greeting').textContent = `${greeting}！`;
}

setInterval(updateClock, 1000);
updateClock();

// --- 2. ToDo機能（chrome.storage連携） ---
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

function getStoredList(key, fallback = []) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || fallback);
    });
  });
}

function setStoredList(key, items) {
  chrome.storage.local.set({ [key]: items });
}

async function loadTodos() {
  const todos = await getStoredList('todos');
  todos.forEach((todo) => addTodoToDOM(todo));
}

function addTodoToDOM(text) {
  const li = document.createElement('li');
  li.textContent = text;

  li.addEventListener('click', async () => {
    li.remove();
    const todos = await getStoredList('todos');
    const filteredTodos = todos.filter((todo) => todo !== text);
    setStoredList('todos', filteredTodos);
  });

  todoList.appendChild(li);
}

async function saveTodo(text) {
  const todos = await getStoredList('todos');
  setStoredList('todos', [...todos, text]);
}

// 保存されているToDoを読み込む
loadTodos();

// Enterキーで新しいToDoを追加
todoInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && todoInput.value.trim() !== '') {
    const todoText = todoInput.value.trim();
    addTodoToDOM(todoText);
    await saveTodo(todoText);
    todoInput.value = '';
  }
});

// --- 3. 天気予報機能 ---
function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if (code >= 1 && code <= 3) return '⛅';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 95) return '🌩';
  return '🌡️';
}

async function fetchLocationName(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&accept-language=ja`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'ja' } });
    const data = await response.json();

    if (data && data.address) {
      const address = data.address;
      return address.city || address.town || address.village || address.municipality || address.state || '現在地';
    }
  } catch (err) {
    console.error('地名取得エラー:', err);
  }

  return '現在地';
}

async function fetchWeather(lat, lon, locationName = '現在地') {
  const iconEl = document.getElementById('weather-icon');
  const tempEl = document.getElementById('weather-temp');
  const locEl = document.getElementById('weather-location');

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.current_weather) {
      const temp = Math.round(data.current_weather.temperature);
      const code = data.current_weather.weathercode;

      iconEl.textContent = getWeatherIcon(code);
      tempEl.textContent = `${temp}°C`;
      locEl.textContent = locationName;
      return;
    }

    throw new Error('current_weather not found');
  } catch (err) {
    console.error('天気情報の取得エラー:', err);
    locEl.textContent = '取得失敗';
  }
}

function initWeather() {
  const locEl = document.getElementById('weather-location');
  locEl.textContent = '位置情報取得中...';

  if (!('geolocation' in navigator)) {
    console.warn('位置情報がこのブラウザではサポートされていません。');
    fetchWeather(35.6762, 139.6503, '東京');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const name = await fetchLocationName(lat, lon);
      fetchWeather(lat, lon, name);
    },
    (error) => {
      console.warn('位置情報の取得に失敗:', error.message);
      fetchWeather(35.6762, 139.6503, '東京');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

initWeather();

// --- 4. カスタムショートカット機能 ---
const shortcutsList = document.getElementById('shortcuts-list');
const addShortcutBtn = document.getElementById('add-shortcut-btn');
const shortcutModal = document.getElementById('shortcut-modal');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalSaveBtn = document.getElementById('modal-save-btn');
const nameInput = document.getElementById('shortcut-name-input');
const urlInput = document.getElementById('shortcut-url-input');

const defaultShortcuts = [
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'YouTube', url: 'https://www.youtube.com' },
  { name: 'GitHub', url: 'https://github.com' }
];

function normalizeUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

async function loadShortcuts() {
  const shortcuts = await getStoredList('shortcuts', defaultShortcuts);
  shortcuts.forEach((shortcut) => {
    addShortcutToDOM(shortcut.name, shortcut.url);
  });
}

// 初期読み込み
loadShortcuts();

// モーダル開閉
addShortcutBtn.addEventListener('click', () => {
  shortcutModal.style.display = 'flex';
  nameInput.focus();
});

modalCancelBtn.addEventListener('click', closeModal);

function closeModal() {
  shortcutModal.style.display = 'none';
  nameInput.value = '';
  urlInput.value = '';
}

// ショートカット保存
modalSaveBtn.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  let url = normalizeUrl(urlInput.value.trim());

  if (!name || !urlInput.value.trim()) return;

  addShortcutToDOM(name, url);
  const shortcuts = await getStoredList('shortcuts');
  setStoredList('shortcuts', [...shortcuts, { name, url }]);
  closeModal();
});

// DOM描画
function addShortcutToDOM(name, url) {
  const item = document.createElement('a');
  item.className = 'shortcut-item';
  item.href = url;
  item.target = '_self'; // 同一タブで開く

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64`;

  item.innerHTML = `
    <div class="shortcut-icon-wrapper">
      <img src="${faviconUrl}" alt="${name}" onerror="this.src='https://dummyimage.com/32/ffffff/000000.png&text=${name.charAt(0)}'">
    </div>
    <span class="shortcut-title">${name}</span>
    <button class="shortcut-delete-btn">✕</button>
  `;

  const deleteBtn = item.querySelector('.shortcut-delete-btn');
  deleteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    item.remove();
    const shortcuts = await getStoredList('shortcuts');
    const filteredShortcuts = shortcuts.filter((shortcut) => shortcut.url !== url);
    setStoredList('shortcuts', filteredShortcuts);
  });

  const addBtn = document.getElementById('add-shortcut-btn');
  shortcutsList.insertBefore(item, addBtn);
}
