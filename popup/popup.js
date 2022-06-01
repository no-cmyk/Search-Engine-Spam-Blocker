'use strict'
const toHide = document.getElementById(html.toHide)
const enabled = document.getElementById(html.enabled)
const showBlocked = document.getElementById(html.showBlocked)
const showBlockButtons = document.getElementById(html.showBlockButtons)
let activeSettings

document.addEventListener('click', handleClicks)

function handleClicks(click) {
	switch (click.srcElement.id) {
		case html.enabled:
			activeSettings.enabled ^= true
			toHide.style.opacity = activeSettings.enabled === 0 ? 0.5 : 1
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
		case html.manageYourBlocklist:
			browser.tabs.create({url: browser.runtime.getURL('options/options.html')})
			window.close()
		default:
			break
	}
}

function updateSettings() {
	browser.storage.local.set({'settings': activeSettings}).then(browser.runtime.sendMessage({action: actions.reloadSettings}))
	browser.tabs.query({}, (tabs) => tabs.forEach(tab => browser.tabs.sendMessage(tab.id, activeSettings)))
}

function handleNullSettings(savedSettings) {
	activeSettings = savedSettings ?? defaultSettings
	enabled.checked = activeSettings.enabled
	showBlocked.checked = activeSettings.showBlocked
	showBlockButtons.checked = activeSettings.showButtons
	toHide.style.opacity = activeSettings.enabled === 0 ? 0.5 : 1
}

browser.storage.local.get('settings').then((r) => r.settings).then((r) => handleNullSettings(r))
