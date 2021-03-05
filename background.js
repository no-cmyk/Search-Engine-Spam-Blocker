var localBlocklist;
var localTLDlist;
var needsUpdate = false;
browser.runtime.onMessage.addListener(isToRemove);

function isToRemove(url, sender, response) {
	return Promise.resolve(checkUrl(url));
}

function checkUrl(url) {
	if (!/^\d+\.\d+\.\d+\.\d+$/.test(url)) {
		urlArray = url.split('.');
		for (i = urlArray.length-1; i >= 0; i--) {
			if (!localTLDlist[urlArray[i]]) {
				noSubUrl = urlArray.slice(i, urlArray.length).join('.');
				break;
			}
		}
	} else {
		noSubUrl = url;
	}
	return (localBlocklist[noSubUrl] || (url !== noSubUrl && localBlocklist[url]));
}

async function updateLists() {
	console.log("Calling worker...");
	var updateWorker = new Worker(browser.runtime.getURL('list_worker.js'));
	updateWorker.onerror = function(e) {console.error(e)};
	updateWorker.onmessage = workerOnMessage;
	var lastUpdate = await browser.storage.local.get('sesbLastUpdate').then(r => r.sesbLastUpdate);
	localTLDlist = await browser.storage.local.get('sesbTLDlist').then(r => r.sesbTLDlist);
	localBlocklist = await browser.storage.local.get('sesbBlocklist').then(r => r.sesbBlocklist);
	if (!lastUpdate || !localTLDlist || !localBlocklist || (Date.now() - lastUpdate > 604800)) {
		console.log("Updating lists...");
		needsUpdate = true;
	} else {
		console.log("Loading cached lists...");
	}
	updateWorker.postMessage(["ciao"]);
}

function retainSuffixList(text) {
	localTLDlist = {};
	for (var i = 0; i < text.length; i++) {
		localTLDlist[text[i]] = true;
	}
	browser.storage.local.set({sesbTLDlist: JSON.stringify(localTLDlist)});
	console.log("TLD list OK");
}

function retainBlocklist(text) {
	localBlocklist = {};
	for (var i = 0; i < text.length; i++) {
		localBlocklist[text[i]] = true;
	}
	browser.storage.local.set({sesbBlocklist: JSON.stringify(localBlocklist)});
	console.log("Blocklist OK");
}

function setBlocklist() {
	fetch('https://raw.githubusercontent.com/no-cmyk/Search-Engine-Spam-Blocklist/master/blocklist.txt')
		.then(response => response.text())
		.then(text => retainBlocklist(text.split("\n")))
		.catch(error => console.error('Error (blocklist): ', error));
}

function setSuffixList() {
	fetch('https://data.iana.org/TLD/tlds-alpha-by-domain.txt')
		.then(response => response.text())
		.then(text => retainSuffixList(text.toLowerCase().split("\n").slice(1)))
		.catch(error => console.error('Error (TLD list): ', error));
}

function workerOnMessage(message) {
	if (needsUpdate) {
		console.log("Worker updating...");
		setSuffixList();
		setBlocklist();
		browser.storage.local.set({sesbLastUpdate: Date.now()});
		needsUpdate = false;
	} else {
		console.log("Worker loading...");
		localTLDlist = JSON.parse(localTLDlist);
		localBlocklist = JSON.parse(localBlocklist);
		console.log("Lists loaded");
	}
}

updateLists();