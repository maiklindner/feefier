// Extension installation listener
chrome.runtime.onInstalled.addListener(() => {
  console.log('Feed Notifier installed or updated.');
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#D93025' });

  // Migrate v1.0 to v1.1

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

// Browser startup listener
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, setting up feeds.");
  chrome.storage.sync.get(['feeds'], (items) => {
    if (items.feeds) {
      setupAlarms(items.feeds);
      // Perform immediate check
      items.feeds.forEach(feed => checkFeed(feed));
    }
  });
});

// Storage change listener
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.feeds) {
    console.log("Feeds changed. Updating alarms.");
    setupAlarms(changes.feeds.newValue || []);
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
        console.log(`Alarm set: feedCheck_${feed.id} every ${feed.interval} minutes.`);
      }
    });
  });
}

// Alarm listener
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
      console.error(`Error fetching feed ${feed.id}:`, response.status);
      return;
    }
    const feedText = await response.text();

    // Extract up to 3 item/entry tags
    const itemRegex = /<item>[\s\S]*?<\/item>|<entry>[\s\S]*?<\/entry>/gi;
    let match;
    const topItems = [];
    while ((match = itemRegex.exec(feedText)) !== null && topItems.length < 3) {
      topItems.push(match[0]);
    }

    const cleanFeedText = topItems.join('\n\n---ITEM_DELIMITER---\n\n');
    if (!cleanFeedText) {
      console.log(`No new items/entries found for ${feed.id}`);
      return;
    }

    const storageKey = `lastFeedContent_${feed.id}`;
    const storage = await chrome.storage.local.get([storageKey]);

    // Check if cleaned content changed
    if (storage[storageKey] !== cleanFeedText) {
      console.log(`Feed content ${feed.id} changed!`);

      await chrome.storage.local.set({ [storageKey]: cleanFeedText });

      // Send notification
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
      console.log(`Feed content ${feed.id} identical to last time.`);
    }
  } catch (error) {
    console.error(`--- ERROR PROCESSING FEED ${feed.id} ---`);
    console.error('Error object:', error);
    console.error('Attempted URL:', url);
  }
}

// User Action Notification
chrome.action.onClicked.addListener(() => {
  console.log("Action button clicked, checking all feeds immediately...");
  chrome.storage.sync.get(['feeds'], (items) => {
    if (items.feeds) {
      items.feeds.forEach(feed => checkFeed(feed));
      
      // Give a tiny visual feedback that it started checking
      chrome.action.setBadgeText({ text: ' ' });
      chrome.action.setBadgeBackgroundColor({ color: '#f39c12' }); // orange
      setTimeout(() => {
        // Clear it back if no updates were found (checkFeed will overwrite if updates found)
        chrome.action.setBadgeText({ text: '' });
      }, 1000);
    }
  });
});