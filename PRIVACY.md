### ## Deutsch

**Datenschutzrichtlinie für die Erweiterung "Feed Notifier"**

**Letzte Aktualisierung:** 12. September 2025

Diese Datenschutzrichtlinie beschreibt, wie die Browser-Erweiterung "Feed Notifier" (im Folgenden "die Erweiterung" genannt), entwickelt von [Dein Name], mit Daten umgeht.

Der Schutz Ihrer Privatsphäre ist uns sehr wichtig. Die Erweiterung wurde nach dem Prinzip der Datensparsamkeit entwickelt. Das bedeutet, es werden nur die Daten verarbeitet, die für die Kernfunktionalität der Erweiterung absolut notwendig sind.

**1. Welche Daten werden erfasst?**

Die Erweiterung erfasst und speichert die folgenden Informationen:

* **Vom Nutzer eingegebene Daten**:
    * **Feed-URL**: Die Web-Adresse des Feeds, den Sie überwachen möchten.
    * **Abfrageintervall**: Die von Ihnen festgelegte Häufigkeit in Minuten, in der der Feed überprüft werden soll.
* **Automatisch zwischengespeicherte Daten**:
    * **Inhalt des letzten Feeds**: Eine Kopie des Inhalts des Feeds bei der letzten Überprüfung. Dieser wird ausschließlich dazu verwendet, um festzustellen, ob sich seitdem etwas geändert hat.

Die Erweiterung erfasst oder verarbeitet **keine** persönlichen Daten wie Ihren Namen, Ihre E-Mail-Adresse, Ihren Standort oder Ihre Browser-Aktivitäten.

**2. Wie und wo werden die Daten gespeichert?**

Alle oben genannten Daten werden ausschließlich auf Ihrem eigenen Computer und in Ihrem Browser gespeichert.

* Ihre **Einstellungen** (Feed-URL und Intervall) werden mit der `chrome.storage.sync` API gespeichert. Das bedeutet, die Daten werden sicher in Ihrem Browser gespeichert und über Ihr Microsoft-Konto synchronisiert, sodass Ihre Einstellungen auf allen Ihren Geräten verfügbar sind. **Der Entwickler hat keinen Zugriff auf diese Daten.**
* Der **zwischengespeicherte Feed-Inhalt** wird mit der `chrome.storage.local` API gespeichert. Diese Daten verbleiben ausschließlich lokal auf Ihrem Gerät und werden nicht synchronisiert. **Der Entwickler hat keinen Zugriff auf diese Daten.**

**3. Datenübertragung**

Die einzige Datenübertragung, die von der Erweiterung ausgeht, ist die Anfrage an die von Ihnen selbst festgelegte **Feed-URL**, um deren Inhalt abzurufen.

Es werden **keine Daten an den Entwickler oder an Dritte gesendet**. Es gibt keine Analyse-Tools oder Tracker von Drittanbietern.

**4. Notwendige Berechtigungen und deren Zweck**

Bei der Installation bittet die Erweiterung um folgende Berechtigungen:

* **`storage`**: Wird benötigt, um Ihre Einstellungen (Feed-URL, Intervall) zu speichern.
* **`notifications`**: Wird benötigt, um Sie über neue Feed-Einträge per Benachrichtigung zu informieren.
* **`alarms`**: Wird benötigt, um die periodische Überprüfung des Feeds im Hintergrund zuverlässig auszuführen.
* **`host_permissions`**: Wird benötigt, damit die Erweiterung auf die von Ihnen festgelegte Feed-URL zugreifen kann, egal auf welcher Domain diese sich befindet. Die Erweiterung liest oder interagiert nicht mit anderen Websites, die Sie besuchen.

**5. Änderungen an dieser Richtlinie**

Diese Datenschutzrichtlinie kann zukünftig aktualisiert werden, um Änderungen in der Funktionalität der Erweiterung widerzuspiegeln. Wesentliche Änderungen werden im Beschreibungstext des Add-on Stores kommuniziert.

**6. Kontakt**

Wenn Sie Fragen zu dieser Datenschutzrichtlinie haben, kontaktieren Sie bitte den Entwickler:

Maik Lindner
apps@lindner.one

***

### ## English

**Privacy Policy for the "Feed Notifier" Extension**

**Last Updated:** September 12, 2025

This Privacy Policy describes how the "Feed Notifier" browser extension (hereafter "the extension"), developed by [Your Name], handles data.

Protecting your privacy is very important to us. The extension was developed following the principle of data minimization. This means that only the data absolutely necessary for the core functionality of the extension is processed.

**1. What Data Is Collected?**

The extension collects and stores the following information:

* **User-Provided Data**:
    * **Feed URL**: The web address of the feed you want to monitor.
    * **Check Interval**: The frequency in minutes, set by you, at which the feed should be checked.
* **Automatically Cached Data**:
    * **Last Feed Content**: A copy of the feed's content from the last check. This is used exclusively to determine if anything has changed since then.

The extension does **not** collect or process any personal data such as your name, email address, location, or browsing activity.

**2. How and Where Is Data Stored?**

All the data mentioned above is stored exclusively on your own computer and within your browser.

* Your **settings** (Feed URL and interval) are stored using the `chrome.storage.sync` API. This means the data is stored securely in your browser and synchronized via your Microsoft Account, making your settings available across all your devices. **The developer has no access to this data.**
* The **cached feed content** is stored using the `chrome.storage.local` API. This data remains exclusively on your local device and is not synchronized. **The developer has no access to this data.**

**3. Data Transmission**

The only data transmission initiated by the extension is the request to the **Feed URL** you have configured in order to retrieve its content.

**No data is sent to the developer or any third parties**. There are no third-party analytics tools or trackers.

**4. Required Permissions and Their Purpose**

During installation, the extension requests the following permissions:

* **`storage`**: Required to save your settings (Feed URL, interval).
* **`notifications`**: Required to inform you about new feed entries via notifications.
* **`alarms`**: Required to reliably run the periodic check of the feed in the background.
* **`host_permissions`**: Required to allow the extension to access the Feed URL you have set, regardless of its domain. The extension does not read or interact with any other websites you visit.

**5. Changes to This Policy**

This Privacy Policy may be updated in the future to reflect changes in the extension's functionality. Significant changes will be communicated in the add-on store's description text.

**6. Contact**

If you have any questions about this Privacy Policy, please contact the developer:

Maik Lindner
apps@lindner.one