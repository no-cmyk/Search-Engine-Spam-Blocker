let showBlocked = 0
let showButtons = 0
let enabled = 1
document.addEventListener('click', handleClicks)

function handleClicks(click) {
	const initiator = click.srcElement.id
	let settingsToSave
	switch (initiator) {
		case 'enabled':
			settingsToSave = {showBlocked: showBlocked, showButtons: showButtons, enabled: (enabled ^= true)}
			return browser.storage.local.set({sesbSettings: settingsToSave})
		case 'show-results':
			settingsToSave = {showBlocked: (showBlocked ^= true), showButtons: showButtons, enabled: enabled}
			return browser.storage.local.set({sesbSettings: settingsToSave})
		case 'add-block-buttons':
			settingsToSave = {showBlocked: showBlocked, showButtons: (showButtons ^= true), enabled: enabled}
			return browser.storage.local.set({sesbSettings: settingsToSave})
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
		showBlocked = settings.showBlocked
		showButtons = settings.showButtons
	}
	document.getElementById('enabled').checked = enabled
	document.getElementById('show-results').checked = showBlocked
	document.getElementById('add-block-buttons').checked = showButtons
}

async function loadSettings() {
	browser.storage.local.get('sesbSettings').then((r) => r.sesbSettings).then((r) => handleNullSettings(r))
}

loadSettings()
