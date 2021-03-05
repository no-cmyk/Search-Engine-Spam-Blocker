const yourBlocklistElem = document.getElementById("your-blocklist");
const showResultsElem = document.getElementById('show-results');
const addBlockButtonsElem = document.getElementById('add-block-buttons');
const exportElem = document.getElementById('export');
const addDomainsButtonElem = document.getElementById('add-domains-button');
const addDomainsTextareaElem = document.getElementById('add-domains-textarea');
document.addEventListener("mouseup", handleClicks);

function handleClicks(click) {
	var initiator = click.originalTarget.id;
	switch (initiator) {
		case "show-results":
			browser.runtime.sendMessage({action: "show-results"});
			break;
		case "add-block-buttons":
			browser.runtime.sendMessage({action: "add-block-buttons"});
			break;
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
	domainsAsList = domains.split('\n');
	browser.runtime.sendMessage({action: "update-multiple", url: domainsAsList});
	for (var i = 0; i < domainsAsList.length; i++) {
		li = document.createElement("li");
		li.innerText = domainsAsList[i];
		li.addEventListener("mouseup", function(){removeFromYourBlocklist(this);});
		yourBlocklistElem.appendChild(li);
	}
	addDomainsTextareaElem.value = '';
}

async function loadSettings() {
	var settings = await browser.runtime.sendMessage({action: "load-settings"});
	showResultsElem.checked = settings.showResults;
	addBlockButtonsElem.checked = settings.addBlockButtons;
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