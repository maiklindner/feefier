// Listener für die Installation der Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Feed Notifier wurde installiert.');
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#D93025' });

  chrome.storage.sync.get(['feedUrl', 'interval'], (items) => {
    if (items.interval && items.feedUrl) {
      createAlarm(items.interval);
    }
  });
});

// Listener für den Start des Browsers
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser gestartet, führe Feed-Prüfung aus.");
  checkFeed();
});

// Listener für Änderungen im Speicher
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.interval || changes.feedUrl) {
    chrome.storage.sync.get(['interval'], (items) => {
      createAlarm(items.interval);
    });
  }
});

// Funktion zum Erstellen (oder Aktualisieren) des Alarms
function createAlarm(interval) {
  if (!interval) return;
  console.log(`Alarm wird erstellt/aktualisiert. Intervall: ${interval} Minuten.`);
  chrome.alarms.create('feedCheck', {
    delayInMinutes: 1,
    periodInMinutes: parseInt(interval)
  });
}

// Listener für den Alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'feedCheck') {
    checkFeed();
  }
});

// Listener für Klick auf das Extension-Icon
chrome.action.onClicked.addListener((tab) => {
  console.log('Icon geklickt. Icon wird zurückgesetzt und Feed-Prüfung gestartet.');

  chrome.action.setIcon({
    path: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  });
  chrome.action.setBadgeText({ text: '' });

  checkFeed();
});


async function checkFeed() {
  const result = await chrome.storage.sync.get(['feedUrl']);
  const url = result.feedUrl;

  if (!url) {
    console.log('Keine Feed-URL konfiguriert.');
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      console.error('Fehler beim Abrufen des Feeds:', response.status);
      return;
    }
    const feedText = await response.text();

    // 1. Entferne die erste Zeile (den dynamischen JIRA-Kommentar)
    const cleanFeedText = feedText.substring(feedText.indexOf('\n') + 1);

    // 2. Hole den zuletzt gespeicherten bereinigten Inhalt
    const storage = await chrome.storage.local.get(['lastFeedContent']);

    // 3. Vergleiche den alten mit dem neuen bereinigten Inhalt
    if (storage.lastFeedContent !== cleanFeedText) {
      console.log('Feed-Inhalt hat sich geändert!');

      // 4. Speichere den neuen bereinigten Inhalt
      await chrome.storage.local.set({ lastFeedContent: cleanFeedText });

      // Hole Titel und Text aus der i18n API
      const notifTitle = chrome.i18n.getMessage('notificationTitle');
      const notifBody = chrome.i18n.getMessage('notificationBody');

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: notifTitle,
        message: notifBody,
        priority: 2
      });

      // Setze das "Aktiv"-Icon und den Badge
      chrome.action.setIcon({
        path: {
          "16": "icons/icon16-active.png",
          "48": "icons/icon48-active.png",
          "128": "icons/icon128-active.png"
        }
      });
      chrome.action.setBadgeText({ text: '!' });

    } else {
      console.log('Feed-Inhalt ist identisch zum letzten Mal.');
    }
  } catch (error) {
    console.error('Fehler beim Verarbeiten des Feeds:', error);
  }
}