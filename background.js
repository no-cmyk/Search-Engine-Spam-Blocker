let defaultBlocklist
let suffixList
let needsUpdate = false
let yourBlocklist = {}
browser.runtime.onMessage.addListener(handleMessages)

async function handleMessages(message) {
	switch (message.action) {
		case 'check':
			return Promise.resolve(checkUrl(message.url))
		case 'update':
			return Promise.resolve(updateYourBlocklist(message.url))
		case 'update-multiple':
			updateYourBlocklistMultiple(message.url)
			break
		case 'load-your-blocklist':
			return Promise.resolve(Object.getOwnPropertyNames(yourBlocklist).sort())
		case 'update-spam-lists':
			needsUpdate = true
			updateLists()
			break
		case 'remove':
			removeFromYourBlocklist(message.url)
			break
		case 'clear-blocklist':
			clearBlocklist()
			break
		default:
			break
	}
}

/*--- Domain check ---*/

async function checkUrl(url) {
	const settings = await browser.storage.local.get('sesbSettings').then((r) => r.sesbSettings).then((r) => handleNullSettings(r))
	if (settings.enabled === 0) {
		return undefined
	}
	const urlArray = url.split('.')
	let noSubUrl
	if (!/^\d+\.\d+\.\d+\.\d+$/.test(url)) {
		for (let i = 0; i < urlArray.length; i++) {
			const toCheck = urlArray.slice(i, urlArray.length).join('.')
			if (suffixList[toCheck]) {
				noSubUrl = urlArray.slice(i-1, urlArray.length).join('.')
				break
			}
		}
	} else {
		noSubUrl = urlArray.slice(0, 3).join('.')
	}
	const toRemove = (defaultBlocklist[noSubUrl] !== undefined || defaultBlocklist[url] !== undefined)
	const returnObj = {toRemove: toRemove, domain: noSubUrl, showBlocked: settings.showBlocked, showButtons: settings.showButtons}
	return returnObj
}

/*--- Remove from your blocklist ---*/

function removeFromYourBlocklist(url) {
	delete defaultBlocklist[url]
	delete yourBlocklist[url]
	browser.storage.local.set({sesbYourBlocklist: JSON.stringify(yourBlocklist)})
}

function clearBlocklist() {
	for (const property in yourBlocklist) {
		delete defaultBlocklist[property]
	}
	yourBlocklist = {}
	browser.storage.local.set({sesbYourBlocklist: undefined})
}

/*--- Update your blocklist ---*/

async function updateYourBlocklist(url) {
	const settings = await browser.storage.local.get('sesbSettings').then((r) => r.sesbSettings).then((r) => handleNullSettings(r))
	const urlObj = {}
	urlObj[url] = true
	defaultBlocklist = Object.assign(defaultBlocklist, urlObj)
	browser.storage.local.set({sesbYourBlocklist: JSON.stringify(Object.assign(yourBlocklist, urlObj))})
	const returnObj = {showBlocked: settings.showBlocked}
	return returnObj
}

function updateYourBlocklistMultiple(domains) {
	const updateWorker = new Worker(browser.runtime.getURL('worker.js'))
	updateWorker.onmessage = function() {
		updateMultipleWithWorker(domains)
	}
	updateWorker.postMessage(['hello'])
}

function updateMultipleWithWorker(domains) {
	const urlObj = {}
	for (let i = 0; i < domains.length; i++) {
		urlObj[domains[i]] = true
	}
	defaultBlocklist = Object.assign(defaultBlocklist, urlObj)
	browser.storage.local.set({sesbYourBlocklist: JSON.stringify(Object.assign(yourBlocklist, urlObj))})
}

/*--- Automatic update ---*/

function handleNullSettings(settings) {
	if (settings !== undefined) {
		return settings
	} else {
		const settingsObj = {showBlocked: 0, showButtons: 0, enabled: 1}
		return settingsObj
	}
}

async function loadYourBlocklist() {
	const yourBlocklistJson = await browser.storage.local.get('sesbYourBlocklist').then((r) => r.sesbYourBlocklist)
	if (yourBlocklistJson) {
		yourBlocklist = JSON.parse(yourBlocklistJson)
		defaultBlocklist = Object.assign(defaultBlocklist, yourBlocklist)
	}
}

function retainSuffixList(text) {
	suffixList = {}
	for (let i = 0; i < text.length; i++) {
		if (text[i] === '// ===END ICANN DOMAINS===') {
			break
		} else if (text[i] !== '' && (text[i])[0] !== '/') {
			suffixList[text[i]] = true
		}
	}
	browser.storage.local.set({sesbSuffixList: JSON.stringify(suffixList)})
	console.log('Suffix list OK')
}

function retainDefaultBlocklist(text) {
	defaultBlocklist = {}
	for (let i = 0; i < text.length; i++) {
		defaultBlocklist[text[i]] = true
	}
	loadYourBlocklist()
	browser.storage.local.set({sesbBlocklist: JSON.stringify(defaultBlocklist)})
	console.log('Blocklist OK')
}

function fetchDefaultBlocklist() {
	fetch('https://raw.githubusercontent.com/no-cmyk/Search-Engine-Spam-Blocklist/master/blocklist.txt')
		.then((response) => response.text())
		.then((text) => retainDefaultBlocklist(text.split('\n')))
}

function fetchSuffixList() {
	fetch('https://raw.githubusercontent.com/publicsuffix/list/master/public_suffix_list.dat')
		.then((response) => response.text())
		.then((text) => retainSuffixList(text.split('\n')))
}

async function checkIfNeedsUpdate() {
	const lastUpdate = await browser.storage.local.get('sesbLastUpdate').then((r) => r.sesbLastUpdate)
	suffixList = await browser.storage.local.get('sesbSuffixList').then((r) => r.sesbSuffixList)
	defaultBlocklist = await browser.storage.local.get('sesbBlocklist').then((r) => r.sesbBlocklist)
	if (lastUpdate === undefined || suffixList === undefined || defaultBlocklist === undefined || (Date.now() - lastUpdate > 604800)) {
		needsUpdate = true
	}
}

async function updateLists() {
	const updateWorker = new Worker(browser.runtime.getURL('worker.js'))
	updateWorker.onmessage = updateOnlineLists
	const settings = await checkIfNeedsUpdate()
	updateWorker.postMessage(['hello'])
}

function updateOnlineLists() {
	if (needsUpdate) {
		console.log('Updating lists...')
		fetchSuffixList()
		fetchDefaultBlocklist()
		browser.storage.local.set({sesbLastUpdate: Date.now()})
		needsUpdate = false
	} else {
		console.log('Loading cached lists')
		suffixList = JSON.parse(suffixList)
		defaultBlocklist = JSON.parse(defaultBlocklist)
		loadYourBlocklist()
	}
}

updateLists()
