// Funktion zum Lokalisieren der Seite
function localizeHtmlPage() {
  // Statische Elemente mit Text befüllen
  document.getElementById('pageTitle').textContent = chrome.i18n.getMessage('optionsTitle');
  document.getElementById('optionsH1').textContent = chrome.i18n.getMessage('optionsTitle');
  document.getElementById('saveButton').textContent = chrome.i18n.getMessage('saveButton');
  document.getElementById('addFeedButton').textContent = chrome.i18n.getMessage('optionsAddFeed');
}

// Elemente holen
const feedsContainer = document.getElementById('feedsContainer');
const addFeedButton = document.getElementById('addFeedButton');
const saveButton = document.getElementById('saveButton');
const statusDiv = document.getElementById('status');

// Feed-Zeile im DOM erstellen
function createFeedRow(feed = { id: '', url: '', interval: 15 }) {
  const row = document.createElement('div');
  row.className = 'feed-row';
  row.dataset.id = feed.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);

  const urlLabel = document.createElement('label');
  urlLabel.textContent = chrome.i18n.getMessage('optionsFeedUrlLabel');
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.placeholder = 'https://domain.com/rss.xml';
  urlInput.value = feed.url;
  urlInput.className = 'feed-url';

  const intervalLabel = document.createElement('label');
  intervalLabel.textContent = chrome.i18n.getMessage('optionsIntervalLabel');
  const intervalInput = document.createElement('input');
  intervalInput.type = 'number';
  intervalInput.min = '1';
  intervalInput.value = feed.interval;
  intervalInput.className = 'feed-interval';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = chrome.i18n.getMessage('optionsRemoveFeed');
  removeBtn.onclick = () => {
    row.remove();
  };

  row.appendChild(urlLabel);
  row.appendChild(urlInput);
  row.appendChild(intervalLabel);
  row.appendChild(intervalInput);
  row.appendChild(removeBtn);

  feedsContainer.appendChild(row);
}

// Speichert die Optionen
function saveOptions() {
  const rows = document.querySelectorAll('.feed-row');
  const feeds = [];
  let valid = true;

  rows.forEach(row => {
    const url = row.querySelector('.feed-url').value.trim();
    const interval = parseInt(row.querySelector('.feed-interval').value, 10);
    const id = row.dataset.id;

    if (url && interval >= 1) {
      feeds.push({ id, url, interval });
    } else if (url || interval) {
      // Partially filled row is treated as invalid
      valid = false;
    }
  });

  if (valid) {
    chrome.storage.sync.set({ feeds: feeds }, () => {
      statusDiv.textContent = chrome.i18n.getMessage('statusSaved');
      statusDiv.style.color = 'var(--success-color, green)';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 1500);
    });
  } else {
    statusDiv.textContent = chrome.i18n.getMessage('statusError');
    statusDiv.style.color = 'var(--error-color, red)';
  }
}

// Lädt die gespeicherten Optionen
function restoreOptions() {
  chrome.storage.sync.get(['feeds'], (items) => {
    // Wenn es noch keine Feeds gibt, zeige ein leeres Feld an
    const feeds = items.feeds || [{ id: Date.now().toString(), url: '', interval: 15 }];

    // Fallback falls Liste komplett leer
    if (feeds.length === 0) {
      feeds.push({ id: Date.now().toString(), url: '', interval: 15 });
    }

    feedsContainer.innerHTML = '';
    feeds.forEach(feed => createFeedRow(feed));
  });
}

// Event-Listener hinzufügen
document.addEventListener('DOMContentLoaded', () => {
  localizeHtmlPage();
  restoreOptions();
});
saveButton.addEventListener('click', saveOptions);
addFeedButton.addEventListener('click', () => createFeedRow());