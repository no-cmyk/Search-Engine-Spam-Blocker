let showResults = 0
let addBlockButtons = 1
let enabled = 1
document.addEventListener('click', handleClicks)

function handleClicks(click) {
	const initiator = click.srcElement.id
	switch (initiator) {
		case 'enabled':
			const settingsToSaveEN = {showResults: showResults, addBlockButtons: addBlockButtons, enabled: (enabled ^= true)}
			return browser.storage.local.set({sesbSettings: settingsToSaveEN})
		case 'show-results':
			const settingsToSaveSR = {showResults: (showResults ^= true), addBlockButtons: addBlockButtons, enabled: enabled}
			return browser.storage.local.set({sesbSettings: settingsToSaveSR})
		case 'add-block-buttons':
			const settingsToSaveAB = {showResults: showResults, addBlockButtons: (addBlockButtons ^= true), enabled: enabled}
			return browser.storage.local.set({sesbSettings: settingsToSaveAB})
		case 'update-spam-lists':
			browser.runtime.sendMessage({action: 'update-spam-lists'})
			break
		case 'manage-your-blocklist':
			browser.tabs.create({url: browser.runtime.getURL('page/page.html')})
			break
		default:
			break
	}
}

function handleNullSettings(settings) {
	if (settings !== undefined) {
		enabled = settings.enabled
		showResults = settings.showResults
		addBlockButtons = settings.addBlockButtons
	}
	document.getElementById('enabled').checked = enabled
	document.getElementById('show-results').checked = showResults
	document.getElementById('add-block-buttons').checked = addBlockButtons
}

async function loadSettings() {
	browser.storage.local.get('sesbSettings').then((r) => r.sesbSettings).then((r) => handleNullSettings(r))
}

loadSettings()
