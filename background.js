var localBlocklist;
var localTLDlist;
var needsUpdate = false;
var yourBlocklist = {};
var showResults;
var addBlockButtons;
browser.runtime.onMessage.addListener(handleMessages);

async function handleMessages(data, sender, response) {
	switch (data.action) {
		case "check":
			return Promise.resolve(checkUrl(data.url));
		case "update":
			updateYourBlocklist(data.url);
			break;
		case "update-multiple":
			updateYourBlocklistMultiple(data.url);
			break;
		case "load-settings":
			return Promise.resolve(returnSettings());
		case "load-your-blocklist":
			return Promise.resolve(Object.getOwnPropertyNames(yourBlocklist).sort());
		case "update-spam-lists":
			needsUpdate = true;
			updateLists();
			break;
		case "show-results":
			updateShowResults();
			break;
		case "add-block-buttons":
			updateAddBlockButtons();
			break;
		case "remove":
			removeFromYourBlocklist(data.url);
			break;
		default:
			break;
	}
}

function checkUrl(url) {
	urlArray = url.split('.');
	if (!/^\d+\.\d+\.\d+\.\d+$/.test(url)) {
		for (var i = 0; i < urlArray.length; i++) {
			var toCheck = urlArray.slice(i, urlArray.length).join('.');
			if (localTLDlist[toCheck]) {
				noSubUrl = urlArray.slice(i-1, urlArray.length).join('.');
				break;
			}
		}
	} else {
		noSubUrl = urlArray.slice(0,3).join('.');
	}
	var toRemove = (localBlocklist[noSubUrl] || localBlocklist[url]);
	var returnObj = {toRemove: toRemove, domain: noSubUrl};
	return returnObj;
}

function removeFromYourBlocklist(url) {
	delete localBlocklist[url];
	delete yourBlocklist[url];
	browser.storage.local.set({sesbYourBlocklist: JSON.stringify(yourBlocklist)});
}

function returnSettings() {
	var settings = {showResults: showResults, addBlockButtons: addBlockButtons};
	return settings;
}

async function loadSettings() {
	showResults = await browser.storage.local.get('sesbShowResults').then(r => r.sesbShowResults).catch(e => {return false});
	addBlockButtons = await browser.storage.local.get('sesbAddBlockButtons').then(r => r.sesbAddBlockButtons).catch(e => {return false});
}

function updateAddBlockButtons() {
	addBlockButtons = !addBlockButtons;
	browser.storage.local.set({sesbAddBlockButtons: addBlockButtons});
}

function updateShowResults() {
	showResults = !showResults;
	browser.storage.local.set({sesbShowResults: showResults});
}

async function loadYourBlocklist() {
	var yourBlocklistJson = await browser.storage.local.get('sesbYourBlocklist').then(r => r.sesbYourBlocklist);
	if (yourBlocklistJson) {
		yourBlocklist = JSON.parse(yourBlocklistJson);
		localBlocklist = Object.assign(localBlocklist, yourBlocklist);
	}
}

function updateYourBlocklist(url) {
	urlObj = {};
	urlObj[url] = true;
	localBlocklist = Object.assign(localBlocklist, urlObj);
	browser.storage.local.set({sesbYourBlocklist: JSON.stringify(Object.assign(yourBlocklist, urlObj))});
}

function yourBlocklistBulkUpdate(domains) {
	urlObj = {};
	for (var i = 0; i < domains.length; i++) {
		urlObj[domains[i]] = true;
	}
	localBlocklist = Object.assign(localBlocklist, urlObj);
	browser.storage.local.set({sesbYourBlocklist: JSON.stringify(Object.assign(yourBlocklist, urlObj))});
}

function updateYourBlocklistMultiple(domains) {
	var updateWorker = new Worker(browser.runtime.getURL('list_worker.js'));
	updateWorker.onmessage = function() {yourBlocklistBulkUpdate(domains)};
	updateWorker.postMessage(["ciao"]);
}

async function loadUpdateSettings() {
	var lastUpdate = await browser.storage.local.get('sesbLastUpdate').then(r => r.sesbLastUpdate);
	localTLDlist = await browser.storage.local.get('sesbTLDlist').then(r => r.sesbTLDlist);
	localBlocklist = await browser.storage.local.get('sesbBlocklist').then(r => r.sesbBlocklist);
	if (!lastUpdate || !localTLDlist || !localBlocklist || (Date.now() - lastUpdate > 604800)) {
		needsUpdate = true;
	}
}

async function updateLists() {
	var updateWorker = new Worker(browser.runtime.getURL('list_worker.js'));
	updateWorker.onmessage = workerOnMessage;
	var settings = await loadUpdateSettings();
	updateWorker.postMessage(["ciao"]);
}

function retainSuffixList(text) {
	localTLDlist = {};
	for (var i = 0; i < text.length; i++) {
		if (text[i] !== "" && (text[i])[0] !== "/") {
			localTLDlist[text[i]] = true;
		}
	}
	browser.storage.local.set({sesbTLDlist: JSON.stringify(localTLDlist)});
	console.log("TLD list OK");
}

function retainBlocklist(text) {
	localBlocklist = {};
	for (var i = 0; i < text.length; i++) {
		localBlocklist[text[i]] = true;
	}
	loadYourBlocklist();
	browser.storage.local.set({sesbBlocklist: JSON.stringify(localBlocklist)});
	console.log("Blocklist OK");
}

function setBlocklist() {
	fetch('https://raw.githubusercontent.com/no-cmyk/Search-Engine-Spam-Blocklist/master/blocklist.txt')
		.then(response => response.text())
		.then(text => retainBlocklist(text.split("\n")));
}

function setSuffixList() {
	fetch('https://raw.githubusercontent.com/publicsuffix/list/master/public_suffix_list.dat')
		.then(response => response.text())
		.then(text => retainSuffixList(text.split("\n")));
}

function updateOnlineLists() {
	if (needsUpdate) {
		console.log("Updating lists...");
		setSuffixList();
		setBlocklist();
		updateFlag();
	} else {
		console.log("Loading cached lists...");
		localTLDlist = JSON.parse(localTLDlist);
		localBlocklist = JSON.parse(localBlocklist);
		loadYourBlocklist();
	}
}

function updateFlag() {
	browser.storage.local.set({sesbLastUpdate: Date.now()});
	needsUpdate = false;
}

function workerOnMessage(message) {
	updateOnlineLists();
}

loadSettings();
updateLists();