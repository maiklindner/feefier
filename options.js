// Funktion zum Lokalisieren der Seite
function localizeHtmlPage() {
    // Statische Elemente mit Text befüllen
    document.getElementById('pageTitle').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('optionsH1').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('feedUrlLabel').textContent = chrome.i18n.getMessage('optionsFeedUrlLabel');
    document.getElementById('intervalLabel').textContent = chrome.i18n.getMessage('optionsIntervalLabel');
    document.getElementById('saveButton').textContent = chrome.i18n.getMessage('saveButton');
}

// Elemente holen
const feedUrlInput = document.getElementById('feedUrl');
const intervalInput = document.getElementById('interval');
const saveButton = document.getElementById('saveButton');
const statusDiv = document.getElementById('status');

// Speichert die Optionen
function saveOptions() {
  const feedUrl = feedUrlInput.value;
  const interval = parseInt(intervalInput.value, 10);

  if (feedUrl && interval >= 1) {
    chrome.storage.sync.set({ 
      feedUrl: feedUrl,
      interval: interval 
    }, () => {
      statusDiv.textContent = chrome.i18n.getMessage('statusSaved');
      statusDiv.style.color = 'green';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 1500);
    });
  } else {
    statusDiv.textContent = chrome.i18n.getMessage('statusError');
    statusDiv.style.color = 'red';
  }
}

// Lädt die gespeicherten Optionen
function restoreOptions() {
  chrome.storage.sync.get({
    feedUrl: '',
    interval: 15
  }, (items) => {
    feedUrlInput.value = items.feedUrl;
    intervalInput.value = items.interval;
  });
}

// Event-Listener hinzufügen
document.addEventListener('DOMContentLoaded', () => {
    localizeHtmlPage();
    restoreOptions();
});
saveButton.addEventListener('click', saveOptions);