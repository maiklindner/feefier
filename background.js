// Listener für die Installation der Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Feed Notifier wurde installiert oder geupdatet.');
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#D93025' });

  // Migration von v1.0 auf v1.1 (Einzel-Feed zu Multi-Feed)
  chrome.storage.sync.get(['feedUrl', 'interval', 'feeds'], (items) => {
    if (!items.feeds && items.feedUrl && items.interval) {
      const migratedFeeds = [{
        id: Date.now().toString(),
        url: items.feedUrl,
        interval: parseInt(items.interval)
      }];
      chrome.storage.sync.set({ feeds: migratedFeeds }, () => {
        chrome.storage.sync.remove(['feedUrl', 'interval']);
        setupAlarms(migratedFeeds);
      });
    } else if (items.feeds) {
      setupAlarms(items.feeds);
    }
  });
});

// Listener für den Start des Browsers
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser gestartet, richte Feeds ein.");
  chrome.storage.sync.get(['feeds'], (items) => {
    if (items.feeds) {
      setupAlarms(items.feeds);
      // Führe sofortige Prüfung aus
      items.feeds.forEach(feed => checkFeed(feed));
    }
  });
});

// Listener für Änderungen im Speicher
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.feeds) {
    console.log("Feeds wurden geändert. Aktualisiere Alarme.");
    setupAlarms(changes.feeds.newValue || []);
    // Neu hinzugefügte Feeds prüfen? Könnte man, aber lassen wir in options.js anstoßen oder warten aufs nächste Interval.
  }
});

function setupAlarms(feeds) {
  chrome.alarms.clearAll(() => {
    feeds.forEach(feed => {
      if (feed && feed.url && feed.interval >= 1) {
        chrome.alarms.create(`feedCheck_${feed.id}`, {
          delayInMinutes: 1,
          periodInMinutes: parseInt(feed.interval)
        });
        console.log(`Alarm eingerichtet: feedCheck_${feed.id} alle ${feed.interval} Minuten.`);
      }
    });
  });
}

// Listener für den Alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('feedCheck_')) {
    const feedId = alarm.name.replace('feedCheck_', '');
    chrome.storage.sync.get(['feeds'], (items) => {
      const feeds = items.feeds || [];
      const feed = feeds.find(f => f.id === feedId);
      if (feed) {
        checkFeed(feed);
      }
    });
  }
});

async function checkFeed(feed) {
  const url = feed.url;
  if (!url) return;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Fehler beim Abrufen des Feeds ${feed.id}:`, response.status);
      return;
    }
    const feedText = await response.text();

    // Regex zur Suche nach <item> oder <entry> (RSS oder Atom)
    // Wir nehmen die ersten 3.
    const itemRegex = /<item>[\s\S]*?<\/item>|<entry>[\s\S]*?<\/entry>/gi;
    let match;
    const topItems = [];
    while ((match = itemRegex.exec(feedText)) !== null && topItems.length < 3) {
      topItems.push(match[0]);
    }

    const cleanFeedText = topItems.join('\n\n---ITEM_DELIMITER---\n\n');
    if (!cleanFeedText) {
      console.log(`Keine neuen Items/Entries gefunden für ${feed.id}`);
      return;
    }

    const storageKey = `lastFeedContent_${feed.id}`;
    const storage = await chrome.storage.local.get([storageKey]);

    // Vergleiche den alten mit dem neuen bereinigten Inhalt
    if (storage[storageKey] !== cleanFeedText) {
      console.log(`Feed-Inhalt ${feed.id} hat sich geändert!`);

      await chrome.storage.local.set({ [storageKey]: cleanFeedText });

      // Notification Senden (mit der Feed URL als Kontext)
      const notifTitle = chrome.i18n.getMessage('notificationTitle');
      const notifBody = chrome.i18n.getMessage('notificationBody');

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: notifTitle,
        message: `${notifBody}\n${new URL(url).hostname}`,
        priority: 2
      });

      chrome.action.setIcon({
        path: {
          "16": "icons/icon16-active.png",
          "48": "icons/icon48-active.png",
          "128": "icons/icon128-active.png"
        }
      });
      chrome.action.setBadgeText({ text: '!' });

    } else {
      console.log(`Feed-Inhalt ${feed.id} ist identisch zum letzten Mal.`);
    }
  } catch (error) {
    console.error(`--- FEHLER BEIM VERARBEITEN DES FEEDS ${feed.id} ---`);
    console.error('Fehler-Objekt:', error);
    console.error('Versuchte URL:', url);
  }
}