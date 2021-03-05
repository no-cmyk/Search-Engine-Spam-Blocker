const addDomainsButtonElem = document.getElementById('add-domains-button');
const addDomainsTextareaElem = document.getElementById('add-domains-textarea');
var showResults = 0;
var addBlockButtons = 1;
document.addEventListener('click', handleClicks);

function handleClicks(click) {
	var initiator = click.srcElement.id;
	switch (initiator) {
		case 'show-results':
			var settingsToSave = {showResults: (showResults ^= true), addBlockButtons: addBlockButtons};
			return browser.storage.local.set({sesbSettings: settingsToSave});
		case 'add-block-buttons':
			var settingsToSave = {showResults: showResults, addBlockButtons: (addBlockButtons ^= true)};
			return browser.storage.local.set({sesbSettings: settingsToSave});
		case 'update-spam-lists':
			browser.runtime.sendMessage({action: 'update-spam-lists'});
		case 'manage-your-blocklist':
			browser.tabs.create({url: browser.runtime.getURL('page/page.html')});
		default:
			break;
	}
}

function handleNullSettings(settings) {
	if (settings !== undefined) {
		showResults = settings.showResults;
		addBlockButtons = settings.addBlockButtons;
	}
	document.getElementById('show-results').checked = showResults;
	document.getElementById('add-block-buttons').checked = addBlockButtons;
}

async function loadSettings() {
	browser.storage.local.get('sesbSettings').then(r => r.sesbSettings).then(r => handleNullSettings(r));
}

loadSettings();