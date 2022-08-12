'use strict'
let activeSettings

document.addEventListener('click', handleClicks)

function handleClicks(click) {
	switch (click.srcElement.id) {
		case 'enabled':
			activeSettings.enabled ^= true
			toHide.style.opacity = activeSettings.enabled === 0 ? 0.5 : 1
			updateSettings()
			break
		case 'showBlocked':
			activeSettings.showBlocked ^= true
			updateSettings()
			break
		case 'showBlockButtons':
			activeSettings.showButtons ^= true
			updateSettings()
			break
		case 'manageYourBlocklist':
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
	activeSettings = savedSettings ?? defaultSettings
	enabled.checked = activeSettings.enabled
	showBlocked.checked = activeSettings.showBlocked
	showBlockButtons.checked = activeSettings.showButtons
	toHide.style.opacity = activeSettings.enabled === 0 ? 0.5 : 1
}

browser.storage.local.get('sesbSettings').then((r) => r.sesbSettings).then((r) => handleNullSettings(r))
