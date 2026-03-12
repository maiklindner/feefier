let currentMessages = {};
let currentUnreadItems = [];

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
        localizeHtmlPage();
        if (callback) callback();
      })
      .catch(err => {
        console.error("Failed to load locales", err);
        if (callback) callback();
      });
  });
}

function localizeHtmlPage() {
  document.getElementById('popupTitle').textContent = getMessage('extName');
  document.getElementById('popupH1').textContent = getMessage('extName');
  document.getElementById('emptyMsg').textContent = getMessage('popupEmpty');
  
  document.getElementById('refreshBtn').title = getMessage('popupRefresh');
  document.getElementById('openAllBtn').title = getMessage('popupOpenAll');
  document.getElementById('markReadBtn').title = getMessage('popupMarkRead');
  document.getElementById('settingsBtn').title = getMessage('optionsTitle');
}

function renderList() {
  const emptyState = document.getElementById('emptyState');
  const listContainer = document.getElementById('listContainer');
  
  if (!currentUnreadItems || currentUnreadItems.length === 0) {
    emptyState.style.display = 'flex';
    listContainer.style.display = 'none';
    
    // Clear badge and active icon when list is empty
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setIcon({
      path: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    });

    return;
  }
  
  emptyState.style.display = 'none';
  listContainer.style.display = 'block';
  listContainer.innerHTML = '';
  
  currentUnreadItems.forEach((item, index) => {
    let sourceText = item.feedName || 'Unknown source';
    try {
      if (!item.feedName && item.feedUrl) {
         sourceText = new URL(item.feedUrl).hostname;
      }
    } catch(e) {}

    const div = document.createElement('div');
    div.className = 'feed-item';
    div.onclick = () => handleItemClick(index, item.link);
    
    const title = document.createElement('div');
    title.className = 'feed-item-title';
    title.textContent = item.title || 'No Title';
    
    const source = document.createElement('div');
    source.className = 'feed-item-domain';
    source.textContent = sourceText;
    
    div.appendChild(title);
    div.appendChild(source);
    listContainer.appendChild(div);
  });
  
  // Update badge to match current array size
  chrome.action.setBadgeText({ text: currentUnreadItems.length.toString() });
  chrome.action.setBadgeBackgroundColor({ color: '#D93025' });
  chrome.action.setIcon({
    path: {
      "16": "icons/icon16-active.png",
      "48": "icons/icon48-active.png",
      "128": "icons/icon128-active.png"
    }
  });
}

function handleItemClick(index, url) {
  if (url) {
    chrome.tabs.create({ url: url, active: false });
  }
  
  // Remove item from array and save
  currentUnreadItems.splice(index, 1);
  chrome.storage.local.set({ unreadItems: currentUnreadItems }, () => {
    renderList();
  });
}

// Attach event listeners
document.addEventListener('DOMContentLoaded', () => {
  initLocalization(() => {
    chrome.storage.local.get({ unreadItems: [] }, (data) => {
      currentUnreadItems = data.unreadItems;
      renderList();
    });
  });
  
  document.getElementById('openAllBtn').addEventListener('click', () => {
    if (!currentUnreadItems || currentUnreadItems.length === 0) return;
    
    currentUnreadItems.forEach(item => {
      if (item.link) {
        chrome.tabs.create({ url: item.link, active: false });
      }
    });
    
    // Clear the list after opening all
    currentUnreadItems = [];
    chrome.storage.local.set({ unreadItems: [] }, () => {
      renderList();
    });
  });

  document.getElementById('refreshBtn').addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    const svg = btn.querySelector('svg');
    svg.style.animation = 'spin 1s linear infinite';
    btn.disabled = true;

    chrome.runtime.sendMessage({ action: 'forceCheckFeeds' }, () => {
      // Background will process and update the unreadItems array.
      // We check storage after a small delay to allow fetch requests to complete.
      setTimeout(() => {
        chrome.storage.local.get({ unreadItems: [] }, (data) => {
          currentUnreadItems = data.unreadItems;
          renderList();
          svg.style.animation = '';
          btn.disabled = false;
        });
      }, 1500); 
    });
  });
  
  document.getElementById('markReadBtn').addEventListener('click', () => {
    currentUnreadItems = [];
    chrome.storage.local.set({ unreadItems: [] }, () => {
      renderList();
    });
  });
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
