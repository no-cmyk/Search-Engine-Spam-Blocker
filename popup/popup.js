const yourBlocklistElem = document.getElementById("your-blocklist");
const exportElem = document.getElementById('export');
const addDomainsButtonElem = document.getElementById('add-domains-button');
const addDomainsTextareaElem = document.getElementById('add-domains-textarea');
var showResults = 0;
var addBlockButtons = 1;
document.addEventListener("mouseup", handleClicks);

function handleClicks(click) {
	var initiator = click.srcElement.id;
	switch (initiator) {
		case "show-results":
			var settingsToSave = {showResults: (showResults ^= true), addBlockButtons: addBlockButtons};
			return browser.storage.local.set({sesbSettings: settingsToSave});
		case "add-block-buttons":
			var settingsToSave = {showResults: showResults, addBlockButtons: (addBlockButtons ^= true)};
			return browser.storage.local.set({sesbSettings: settingsToSave});
		case "update-spam-lists":
			browser.runtime.sendMessage({action: "update-spam-lists"});
		case "export":
			exportElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(yourBlocklistElem.innerText));
			exportElem.setAttribute('download', 'sesb_blocklist_' + Date.now() + '.txt');
			break;
		case "add-domains-button":
			addDomains(addDomainsTextareaElem.value);
			break;
		default:
			break;
	}
}

function addDomains(domains) {
	domainsAsList = domains.split('\n').filter(e => e);
	browser.runtime.sendMessage({action: "update-multiple", url: domainsAsList});
	for (var i = 0; i < domainsAsList.length; i++) {
		li = document.createElement("li");
		li.innerText = domainsAsList[i];
		li.addEventListener("mouseup", function(){removeFromYourBlocklist(this);});
		yourBlocklistElem.appendChild(li);
	}
	addDomainsTextareaElem.value = '';
}

function handleNullSettings(settings) {
	if (settings !== undefined) {
		showResults = settings.showResults;
		addBlockButtons = settings.addBlockButtons;
		document.getElementById('show-results').checked = showResults;
		document.getElementById('add-block-buttons').checked = addBlockButtons;
	}
}

async function loadSettings() {
	var settings = await browser.storage.local.get('sesbSettings').then(r => r.sesbSettings).then(r => handleNullSettings(r));
	var yourBlocklist = await browser.runtime.sendMessage({action: "load-your-blocklist"});
	for (var i = 0; i < yourBlocklist.length; i++) {
		li = document.createElement("li");
		li.innerText = yourBlocklist[i];
		li.addEventListener("mouseup", function(){removeFromYourBlocklist(this);});
		yourBlocklistElem.appendChild(li);
	}
}

function removeFromYourBlocklist(li) {
	browser.runtime.sendMessage({action: "remove", url: li.innerText});
	li.remove();
}

loadSettings();