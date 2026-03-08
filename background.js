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
      // Treat undefined 'enabled' as true for backwards compatibility
      const isEnabled = feed.enabled !== false; 
      if (isEnabled && feed && feed.url && feed.interval >= 1) {
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

// Manual refresh from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'forceCheckFeeds') {
    console.log("Manual refresh triggered from popup.");
    chrome.storage.sync.get(['feeds'], (items) => {
      if (items.feeds) {
        // Run checks concurrently only for enabled feeds
        const activeFeeds = items.feeds.filter(f => f.enabled !== false);
        Promise.all(activeFeeds.map(feed => checkFeed(feed))).then(() => {
          sendResponse({ status: 'done' });
        });
      } else {
        sendResponse({ status: 'done' });
      }
    });
    return true; // Keep message channel open for async response
  }
});

async function checkFeed(feed) {
  if (feed.enabled === false) return; // Skip if explicitly disabled
  const url = feed.url;
  if (!url) return;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Error fetching feed ${feed.id}:`, response.status);
      return;
    }
    const feedText = await response.text();

    // Extract item/entry tags
    const itemRegex = /<(item|entry)>([\s\S]*?)<\/\1>/gi;
    let match;
    const newItems = [];
    
    // We'll evaluate up to the first 5 items to see if they're new
    let count = 0;
    while ((match = itemRegex.exec(feedText)) !== null && count < 5) {
      const itemContent = match[2];
      
      // Extract link (handling both <link>...url...</link> and <link href="url"/>)
      let linkMatch = itemContent.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
      if (!linkMatch) {
         linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i);
      }
      const link = linkMatch ? linkMatch[1].trim() : '';

      // Extract title
      let title = 'No Title';
      let titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1];
        // Clean CDATA if present (handling newlines inside CDATA)
        const cdataMatch = title.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
        if (cdataMatch && cdataMatch[1]) {
          title = cdataMatch[1];
        }
        title = title.trim();
      }

      if (link) {
        newItems.push({
          title: title,
          link: link,
          feedUrl: url
        });
      }
      count++;
    }

    if (newItems.length === 0) {
      console.log(`No items/entries found for ${feed.id}`);
      return;
    }

    // Now, we need to compare these against what we already know to find TRULY new ones.
    // Instead of comparing a giant string block, we'll store a "history" of seen links per feed.
    const historyKey = `seenLinks_${feed.id}`;
    const storageResult = await chrome.storage.local.get([historyKey, 'unreadItems']);
    const seenLinks = storageResult[historyKey] || [];
    let unreadItems = storageResult.unreadItems || [];
    
    // Filter down to items whose link isn't in seenLinks
    const trulyNewItems = newItems.filter(item => !seenLinks.includes(item.link));

    if (trulyNewItems.length > 0) {
      console.log(`Found ${trulyNewItems.length} new items for ${feed.id}!`);

      // Add to seen links so we don't alert on them again
      const updatedSeenLinks = [...new Set([...seenLinks, ...trulyNewItems.map(i => i.link)])].slice(-50); // Keep last 50
      
      // Add to unread items to show in popup (put newest at the start)
      unreadItems = [...trulyNewItems, ...unreadItems];

      await chrome.storage.local.set({ 
        [historyKey]: updatedSeenLinks,
        unreadItems: unreadItems
      });

      // Send notification if requested (Optional, keeping existing logic)
      const notifTitle = chrome.i18n.getMessage('notificationTitle');
      const notifBody = chrome.i18n.getMessage('notificationBody');

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: notifTitle,
        message: `${notifBody}\n${new URL(url).hostname}`,
        priority: 2
      });

      // Update Badge and Icon
      updateBadge(unreadItems.length);

    } else {
      console.log(`No genuinely new items for ${feed.id}.`);
    }
  } catch (error) {
    console.error(`--- ERROR PROCESSING FEED ${feed.id} ---`);
    console.error('Error object:', error);
    console.error('Attempted URL:', url);
  }
}

// Helper to update the badge and icon state
function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#D93025' });
    chrome.action.setIcon({
      path: {
        "16": "icons/icon16-active.png",
        "48": "icons/icon48-active.png",
        "128": "icons/icon128-active.png"
      }
    });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setIcon({
      path: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    });
  }
}

// Initial badge check on load
chrome.storage.local.get({ unreadItems: [] }, (data) => {
  updateBadge(data.unreadItems.length);
});