'use strict'
let settings
document.addEventListener('click', handleClicks)

function handleClicks(click) {
	switch (click.srcElement.id) {
		case sesbConstants.html.enabled:
			settings.enabled ^= true
			showOrHideSettings()
			updateSettings()
			break
		case sesbConstants.html.showBlocked:
			settings.showBlocked ^= true
			updateSettings()
			break
		case sesbConstants.html.showBlockButtons:
			settings.showButtons ^= true
			updateSettings()
			break
		case sesbConstants.html.enableDefaultBlocklist:
			settings.enableDefaultBlocklist ^= true
			updateSettings()
			break
		case sesbConstants.html.manageYourBlocklist:
			chrome.tabs.create({url: chrome.runtime.getURL('options/options.html')})
			window.close()
		default:
			break
	}
}

function updateSettings() {
	chrome.storage.local.set({sesbSettings: settings}, function(){chrome.runtime.sendMessage({action: sesbConstants.actions.reloadSettings})})
}

function handleNullSettings(savedSettings) {
	settings = savedSettings === undefined ? sesbConstants.defaultSettings : savedSettings
	document.getElementById(sesbConstants.html.enabled).checked = settings.enabled
	document.getElementById(sesbConstants.html.showBlocked).checked = settings.showBlocked
	document.getElementById(sesbConstants.html.showBlockButtons).checked = settings.showButtons
	document.getElementById(sesbConstants.html.enableDefaultBlocklist).checked = settings.enableDefaultBlocklist
	showOrHideSettings()
}

function showOrHideSettings() {
	if (settings.enabled === 0) {
		for (const e of document.querySelectorAll('.' + sesbConstants.html.toHide)) {
			e.classList.add('hidden')
		}
		document.getElementById(sesbConstants.html.manageYourBlocklist).classList.add('hidden')
	} else {
		for (const e of document.querySelectorAll('.' + sesbConstants.html.toHide)) {
			e.classList.remove('hidden')
		}
		document.getElementById(sesbConstants.html.manageYourBlocklist).classList.remove('hidden')
	}
}

function loadSettings() {
	chrome.storage.local.get(sesbConstants.storedResources.settings, function(r){handleNullSettings(r.sesbSettings)})
}

loadSettings()
