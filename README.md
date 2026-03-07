# Feed Notifier

![Icon](icons/icon128.png)

[![Microsoft Edge Add-ons](https://img.shields.io/badge/Microsoft%20Edge-Add--on-blue?logo=microsoft-edge)](https://microsoftedge.microsoft.com/addons/detail/feefier-feed-notifier/kiicjfnkejldenbnfiligmkgldlnglgm)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange)]()
[![Privacy](https://img.shields.io/badge/Privacy-Friendly-green)](PRIVACY.md)

**FeeFier** is a simple and privacy-focused feed monitor for your browser that notifies you about new entries in your most important RSS or Atom feeds.

---

## 📥 Installation

[**Download from Microsoft Edge Add-ons Store**](https://microsoftedge.microsoft.com/addons/detail/feefier-feed-notifier/kiicjfnkejldenbnfiligmkgldlnglgm)

---

## 🌍 Translations

<details>
<summary><strong>🇩🇪 Deutsch (German)</strong></summary>

### Feed Notifier

Ein einfacher und datenschutzfreundlicher Feed-Monitor für deinen Browser, der dich über neue Einträge in deinen wichtigsten RSS- oder Atom-Feeds benachrichtigt.

</details>

---

## 🚀 Key Features

* **Monitors any Feed:** Works with any valid RSS or Atom feed URL.
* **Customizable Interval:** Set how often the feed should be checked.
* **Instant Notifications:** Get a desktop notification as soon as an update is found.
* **Badge Indicator:** A badge on the toolbar icon shows you at a glance if there's something new.
* **Dark Mode Support:** Both the options page and the toolbar icon automatically adapt to your browser's light or dark theme.
* **Privacy First:** No data is ever sent to the developer or third parties. All your settings are stored locally or synced securely via your browser account.
* **Multilingual:** User interface is available in multiple languages.

### 📦 Installation

#### From the Microsoft Edge Add-ons Store

1.  Visit the [FeeFier page on the Edge Add-ons store](https://microsoftedge.microsoft.com/addons/detail/feefier-feed-notifier/kiicjfnkejldenbnfiligmkgldlnglgm).
2.  Click "Get" to install the extension.

#### From Source (for Development)

1.  Clone or download this repository as a ZIP file and unzip it.
2.  Open your browser and navigate to the extensions page (e.g. `chrome://extensions` or `edge://extensions`).
3.  Enable "Developer mode" using the toggle switch.
4.  Click the "Load unpacked" button.
5.  Select the folder where you unzipped the repository files.

### 🚀 How to Use

1.  After installation, **right-click** the Feed Notifier icon in your toolbar and select **"Options"**.
2.  Enter the full URL of the feed you want to monitor (e.g., `https://www.tagesschau.de/newsticker.rdf`).
3.  Set your desired check interval in minutes (e.g., `15`).
4.  Click **"Save"**.

The extension will now check the feed in the background. If an update is found, a `!` badge will appear on the icon and a system notification will be shown. A **left-click** on the icon clears the badge and triggers a manual check.

## 🛡️ Privacy

Your privacy is a top priority. This extension does not collect, store, or transmit any personal data to the developer or any third parties. All your settings are stored locally or synced securely via your browser account.
[Read full Privacy Policy](PRIVACY.md)

---

### Contact & Support
Maik Lindner  
dev@lindner.one

---

### 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### 🏛️ Architecure

```mermaid 
graph LR
    subgraph "Browser Extension (Sandbox)"
        direction LR
        subgraph Speicher ["Browser Storage (Persistent)"]
            S_Sync["chrome.storage.sync <br/>(URL, Interval)"]
            S_Local["chrome.storage.local <br/>(Feed Content)"]
        end
        
        subgraph Code
            BG["Service Worker <br/>(background.js)"]
            OPT["Options Page <br/>(options.js)"]
        end

        subgraph "Browser APIs"
            Alarms[chrome.alarms]
            Notify[chrome.notifications]
            Action["chrome.action <br/>(Icon / Badge)"]
        end
    end

    subgraph "External World"
        User[User]
        Server[External Feed Server]
    end

    %% --- Workflows ---

    %% 1. Configuration
    User -- "1. Enters URL/Interval" --> OPT
    OPT -- "2. Saves Settings" --> S_Sync

    %% 2. Periodic (Automatic) Start
    Alarms -- "3. Wakes up periodically" --> BG

    %% 3. Manual Start
    User -- "a. Clicks Icon" --> Action
    Action -- "b. Event 'onClicked'" --> BG
    BG -- "c. Clears Badge (setBadgeText)" --> Action

    %% 4. Feed Fetch (triggered by BG after step 3 or b)
    BG -- "4. Reads Settings" --> S_Sync
    BG -- "5. Fetches Feed (fetch)" --> Server
    Server -- "6. Sends Feed Data" --> BG
    BG -- "7. Reads old content" --> S_Local
    BG -- "8. Compares & saves new content" --> S_Local
    BG -- "9. On change: sends notification" --> Notify
    BG -- "10. On change: sets badge '!'" --> Action
        direction LR
        subgraph Speicher ["Browser-Speicher (persistent)"]
            S_Sync["chrome.storage.sync <br/>(URL, Intervall)"]
            S_Local["chrome.storage.local <br/>(Feed-Inhalt)"]
        end
        
        subgraph Code
            BG["Service Worker <br/>(background.js)"]
            OPT["Options-Seite <br/>(options.js)"]
        end

        subgraph Browser-APIs
            Alarms[chrome.alarms]
            Notify[chrome.notifications]
            Action["chrome.action <br/>(Icon / Badge)"]
        end
    end

    subgraph "Externe Welt"
        User[Nutzer]
        Server[Externer Feed-Server]
    end

    %% --- Abläufe ---

    %% 1. Konfiguration
    User -- "1. Gibt URL/Intervall ein" --> OPT
    OPT -- "2. Speichert Einstellungen" --> S_Sync

    %% 2. Periodischer (automatischer) Start
    Alarms -- "3. Weckt periodisch auf" --> BG

    %% 3. Manueller Start
    User -- "a. Klickt Icon" --> Action
    Action -- "b. Event 'onClicked'" --> BG
    BG -- "c. Löscht Badge (setBadgeText)" --> Action

    %% 4. Feed-Abruf (wird von BG nach Schritt 3 oder b gestartet)
    BG -- "4. Liest Einstellungen" --> S_Sync
    BG -- "5. Ruft Feed ab (fetch)" --> Server
    Server -- "6. Sendet Feed-Daten" --> BG
    BG -- "7. Liest alten Inhalt" --> S_Local
    BG -- "8. Vergleicht & speichert neuen Inhalt" --> S_Local
    BG -- "9. Bei Änderung: sendet Benachrichtigung" --> Notify
    BG -- "10. Bei Änderung: setzt Badge '!'" --> Action
```

