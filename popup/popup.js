let showBlocked = 0
let showButtons = 0
let enabled = 1
let enableDefaultBlocklist = 1
document.addEventListener('click', handleClicks)

function handleClicks(click) {
	let settingsToSave
	switch (click.srcElement.id) {
		case 'enabled':
			settingsToSave = {showBlocked: showBlocked, showButtons: showButtons, enabled: (enabled ^= true), enableDefaultBlocklist: enableDefaultBlocklist}
			showOrHideSettings()
			return browser.storage.local.set({sesbSettings: settingsToSave})
		case 'show-blocked':
			settingsToSave = {showBlocked: (showBlocked ^= true), showButtons: showButtons, enabled: enabled, enableDefaultBlocklist: enableDefaultBlocklist}
			return browser.storage.local.set({sesbSettings: settingsToSave})
		case 'show-block-buttons':
			settingsToSave = {showBlocked: showBlocked, showButtons: (showButtons ^= true), enabled: enabled, enableDefaultBlocklist: enableDefaultBlocklist}
			return browser.storage.local.set({sesbSettings: settingsToSave})
		case 'enable-default-blocklist':
			settingsToSave = {showBlocked: showBlocked, showButtons: showButtons, enabled: enabled, enableDefaultBlocklist: (enableDefaultBlocklist ^= true)}
			return browser.storage.local.set({sesbSettings: settingsToSave})
		case 'update-spam-lists':
			browser.runtime.sendMessage({action: 'update-spam-lists'})
			break
		case 'manage-your-blocklist':
			browser.tabs.create({url: browser.runtime.getURL('options/options.html')})
			window.close()
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
		enableDefaultBlocklist = settings.enableDefaultBlocklist
	}
	document.getElementById('enabled').checked = enabled
	document.getElementById('show-blocked').checked = showBlocked
	document.getElementById('show-block-buttons').checked = showButtons
	document.getElementById('enable-default-blocklist').checked = enableDefaultBlocklist
	showOrHideSettings()
}

function showOrHideSettings() {
	if (enabled === 0) {
		document.querySelectorAll('.to-hide').forEach(function(e) {e.classList.add('hidden')})
		document.getElementById('manage-your-blocklist').classList.add('hidden')
	} else {
		document.querySelectorAll('.to-hide').forEach(function(e) {e.classList.remove('hidden')})
		document.getElementById('manage-your-blocklist').classList.remove('hidden')
	}
}

async function loadSettings() {
	browser.storage.local.get('sesbSettings').then((r) => r.sesbSettings).then((r) => handleNullSettings(r))
}

loadSettings()
