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

// 保存されているToDoを読み込む
chrome.storage.local.get(['todos'], (result) => {
  const todos = result.todos || [];
  todos.forEach(todo => addTodoToDOM(todo));
});

// Enterキーで新しいToDoを追加
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && todoInput.value.trim() !== '') {
    const todoText = todoInput.value.trim();
    addTodoToDOM(todoText);
    saveTodo(todoText);
    todoInput.value = '';
  }
});

function addTodoToDOM(text) {
  const li = document.createElement('li');
  li.textContent = text;
  // クリックで削除
  li.addEventListener('click', () => {
    li.remove();
    removeTodo(text);
  });
  todoList.appendChild(li);
}

function saveTodo(text) {
  chrome.storage.local.get(['todos'], (result) => {
    const todos = result.todos || [];
    todos.push(text);
    chrome.storage.local.set({ todos });
  });
}

function removeTodo(text) {
  chrome.storage.local.get(['todos'], (result) => {
    let todos = result.todos || [];
    todos = todos.filter(t => t !== text);
    chrome.storage.local.set({ todos });
  });
}

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

// 初期読み込み
chrome.storage.local.get(['shortcuts'], (result) => {
  const shortcuts = result.shortcuts || [
    // 初期表示例（未保存時）
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'GitHub', url: 'https://github.com' }
  ];
  shortcuts.forEach(s => addShortcutToDOM(s.name, s.url));
});

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
modalSaveBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  let url = urlInput.value.trim();

  if (!name || !url) return;

  // http:// や https:// がなければ補完
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  addShortcutToDOM(name, url);
  saveShortcut(name, url);
  closeModal();
});

// DOM描画
function addShortcutToDOM(name, url) {
  const item = document.createElement('a');
  item.className = 'shortcut-item';
  item.href = url;
  item.target = '_self'; // 同一タブで開く

  // GoogleのFavicon取得サービスを利用
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64`;

  item.innerHTML = `
    <div class="shortcut-icon-wrapper">
      <img src="${faviconUrl}" alt="${name}" onerror="this.src='https://dummyimage.com/32/ffffff/000000.png&text=${name.charAt(0)}'">
    </div>
    <span class="shortcut-title">${name}</span>
    <button class="shortcut-delete-btn">✕</button>
  `;

  // 削除ボタンイベント
  const deleteBtn = item.querySelector('.shortcut-delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.preventDefault(); // リンク遷移を防止
    e.stopPropagation();
    item.remove();
    removeShortcut(url);
  });

  const addBtn = document.getElementById('add-shortcut-btn');
  shortcutsList.insertBefore(item, addBtn);
}

// chrome.storage に保存
function saveShortcut(name, url) {
  chrome.storage.local.get(['shortcuts'], (result) => {
    const shortcuts = result.shortcuts || [];
    shortcuts.push({ name, url });
    chrome.storage.local.set({ shortcuts });
  });
}

// chrome.storage から削除
function removeShortcut(url) {
  chrome.storage.local.get(['shortcuts'], (result) => {
    let shortcuts = result.shortcuts || [];
    shortcuts = shortcuts.filter(s => s.url !== url);
    chrome.storage.local.set({ shortcuts });
  });
}