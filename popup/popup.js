'use strict'
let activeSettings
document.addEventListener('click', handleClicks)

function handleClicks(click) {
	switch (click.srcElement.id) {
		case html.enabled:
			activeSettings.enabled ^= true
			document.getElementById(html.toHide).style.opacity = activeSettings.enabled === 0 ? 0.5 : 1
			updateSettings()
			break
		case html.showBlocked:
			activeSettings.showBlocked ^= true
			updateSettings()
			break
		case html.showBlockButtons:
			activeSettings.showButtons ^= true
			updateSettings()
			break
		case html.enableDefaultBlocklist:
			activeSettings.enableDefaultBlocklist ^= true
			updateSettings()
			break
		case html.manageYourBlocklist:
			browser.tabs.create({url: browser.runtime.getURL('options/options.html')})
			window.close()
		default:
			break
	}
}

function updateSettings() {
	browser.storage.local.set({sesbSettings: activeSettings}).then(browser.runtime.sendMessage({action: actions.reloadSettings}))
	browser.tabs.query({}, (tabs) => tabs.forEach(tab => browser.tabs.sendMessage(tab.id, activeSettings)))
}

function handleNullSettings(savedSettings) {
	activeSettings = savedSettings === undefined ? defaultSettings : savedSettings
	document.getElementById(html.enabled).checked = activeSettings.enabled
	document.getElementById(html.showBlocked).checked = activeSettings.showBlocked
	document.getElementById(html.showBlockButtons).checked = activeSettings.showButtons
	document.getElementById(html.enableDefaultBlocklist).checked = activeSettings.enableDefaultBlocklist
	document.getElementById(html.toHide).style.opacity = activeSettings.enabled === 0 ? 0.5 : 1
}

browser.storage.local.get(storedResources.activeSettings).then((r) => r.sesbSettings).then((r) => handleNullSettings(r))
