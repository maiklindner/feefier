let currentMessages = {};

function getMessage(key) {
  return currentMessages[key] ? currentMessages[key].message : key;
}

function initLocalization(callback) {
  chrome.storage.sync.get({ language: 'auto' }, (data) => {
    let lang = data.language;
    if (lang === 'auto') {
      lang = chrome.i18n.getUILanguage().replace('-', '_');
      const supported = ['en', 'de', 'es', 'fr', 'ja', 'pt_BR', 'zh_CN'];
      if (!supported.includes(lang)) {
        lang = lang.split('_')[0];
        if (!supported.includes(lang)) lang = 'en';
      }
    }
    
    fetch(`/_locales/${lang}/messages.json`)
      .then(res => res.ok ? res.json() : fetch(`/_locales/en/messages.json`).then(r => r.json()))
      .then(messages => {
        currentMessages = messages;
        document.getElementById('langSelect').value = data.language;
        localizeHtmlPage();
        if (callback) callback();
      })
      .catch(err => {
        console.error("Failed to load locales", err);
        if (callback) callback();
      });
  });
}

// Localize page
function localizeHtmlPage() {
  document.getElementById('pageTitle').textContent = getMessage('optionsTitle');
  document.getElementById('optionsH1').textContent = getMessage('optionsTitle');
  document.getElementById('saveButton').textContent = getMessage('saveButton');
  document.getElementById('addFeedButton').textContent = getMessage('optionsAddFeed');
  
  document.querySelectorAll('.feed-row').forEach(row => {
    const labels = row.querySelectorAll('label');
    if (labels.length >= 2) {
      labels[0].textContent = getMessage('optionsFeedUrlLabel');
      labels[1].textContent = getMessage('optionsIntervalLabel');
    }
    const removeBtn = row.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.textContent = getMessage('optionsRemoveFeed');
    }
  });
}

// DOM DOM elements
const feedsContainer = document.getElementById('feedsContainer');
const addFeedButton = document.getElementById('addFeedButton');
const saveButton = document.getElementById('saveButton');
const statusDiv = document.getElementById('status');

// Create feed row in DOM
function createFeedRow(feed = { id: '', url: '', interval: 15 }) {
  const row = document.createElement('div');
  row.className = 'feed-row';
  row.dataset.id = feed.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);

  const urlLabel = document.createElement('label');
  urlLabel.textContent = getMessage('optionsFeedUrlLabel');
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.placeholder = 'https://domain.com/rss.xml';
  urlInput.value = feed.url;
  urlInput.className = 'feed-url';

  const intervalLabel = document.createElement('label');
  intervalLabel.textContent = getMessage('optionsIntervalLabel');
  const intervalInput = document.createElement('input');
  intervalInput.type = 'number';
  intervalInput.min = '1';
  intervalInput.value = feed.interval;
  intervalInput.className = 'feed-interval';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = getMessage('optionsRemoveFeed');
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

// Save options
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
      statusDiv.textContent = getMessage('statusSaved');
      statusDiv.style.color = 'var(--success-color, green)';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 1500);
    });
  } else {
    statusDiv.textContent = getMessage('statusError');
    statusDiv.style.color = 'var(--error-color, red)';
  }
}

// Restore options
function restoreOptions() {
  chrome.storage.sync.get(['feeds'], (items) => {
    // Default empty row
    const feeds = items.feeds || [{ id: Date.now().toString(), url: '', interval: 15 }];

    // Fallback for empty list
    if (feeds.length === 0) {
      feeds.push({ id: Date.now().toString(), url: '', interval: 15 });
    }

    feedsContainer.innerHTML = '';
    feeds.forEach(feed => createFeedRow(feed));
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initLocalization(() => {
    restoreOptions();
  });

  document.getElementById('langSelect').addEventListener('change', (e) => {
    chrome.storage.sync.set({ language: e.target.value }, () => {
      initLocalization();
    });
  });
});
saveButton.addEventListener('click', saveOptions);
addFeedButton.addEventListener('click', () => createFeedRow());