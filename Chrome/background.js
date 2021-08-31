'use strict'
let defaultBlocklist
let suffixList
let privateSuffixList
let needsUpdate = false
let optionsPageBlocklistUpdated = true
let optionsPageWhitelistUpdated = true
let yourBlocklist = {}
let whitelist = {}
const workerUrl = chrome.runtime.getURL('worker.js')
let settings
chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {handleMessages(data, sender, sendResponse)})

function doWithWorker(onMessageFunction) {
	const worker = new Worker(workerUrl)
	worker.onmessage = onMessageFunction
	worker.postMessage('hello')
}

function handleMessages(message, sender, sendResponse) {
	switch (message.action) {
		case sesbConstants.actions.check:
			Promise.resolve(checkUrl(message.url)).then(result => sendResponse(result))
			return true
		case sesbConstants.actions.update:
			Promise.resolve(updateYourBlocklist(message.url)).then(result => sendResponse(result))
			return true
		case sesbConstants.actions.unblock:
			Promise.resolve(unblock(message.url, message.isSub)).then(result => sendResponse(result))
			return true
		case sesbConstants.actions.updateMultiple:
			optionsPageBlocklistUpdated = false
			Promise.resolve(doWithWorker(function(){updateMultiple(message.url)})).then(result => sendResponse(result))
			return true
		case sesbConstants.actions.whitelistMultiple:
			optionsPageWhitelistUpdated = false
			Promise.resolve(doWithWorker(function(){whitelistMultiple(message.url)})).then(result => sendResponse(result))
			return true
		case sesbConstants.actions.loadYourBlocklist:
			Promise.resolve(Object.getOwnPropertyNames(yourBlocklist).sort()).then(result => sendResponse(result))
			return true
		case sesbConstants.actions.loadWhitelist:
			Promise.resolve(Object.getOwnPropertyNames(whitelist).sort()).then(result => sendResponse(result))
			return true
		case sesbConstants.actions.updateSpamLists:
			needsUpdate = true
			updateLists()
			break
		case sesbConstants.actions.remove:
			removeFromYourBlocklist(message.url)
			break
		case sesbConstants.actions.removeFromWhitelist:
			removeFromWhitelist(message.url)
			break
		case sesbConstants.actions.removeFromWhitelistAndUpdate:
			removeFromWhitelist(message.url)
			updateYourBlocklist(message.url)
			break
		case sesbConstants.actions.clearBlocklist:
			clearBlocklist()
			break
		case sesbConstants.actions.reloadSettings:
			loadSettings()
			break
		case sesbConstants.actions.checkOptionsBlocklistUpdated:
			if (optionsPageBlocklistUpdated === true) {
				optionsPageBlocklistUpdated = false
				Promise.resolve(true).then(result => sendResponse(result))
				return true
			}
			Promise.resolve(false).then(result => sendResponse(result))
			return true
		case sesbConstants.actions.checkOptionsWhitelistUpdated:
			if (optionsPageWhitelistUpdated === true) {
				optionsPageWhitelistUpdated = false
				Promise.resolve(true).then(result => sendResponse(result))
				return true
			}
			Promise.resolve(false).then(result => sendResponse(result))
			return true
		default:
			break
	}
}

/*--- Domain check ---*/

function checkUrl(url) {
	if (settings.enabled === 0) {
		return undefined
	}
	const urlArray = url.split('.')
	let noSubUrl
	let privateUrl
	if (!/^\d+\.\d+\.\d+\.\d+$/.test(url)) {
		for (let i = 0; i < urlArray.length; i++) {
			const toCheck = urlArray.slice(i, urlArray.length).join('.')
			if (privateSuffixList[toCheck]) {
				privateUrl = urlArray.slice(i-1, urlArray.length).join('.')
			} else if (suffixList[toCheck]) {
				noSubUrl = urlArray.slice(i-1, urlArray.length).join('.')
				break
			}
		}
	} else {
		noSubUrl = url
	}
	let toRemove
	if (whitelist[noSubUrl] || whitelist[url] || (privateUrl !== undefined && whitelist[privateUrl])) {
		toRemove = false
	} else {
		toRemove = settings.enableDefaultBlocklist === 1 ? 
			(defaultBlocklist[noSubUrl] || defaultBlocklist[url] || yourBlocklist[noSubUrl] || yourBlocklist[url] || (privateUrl !== undefined && (defaultBlocklist[privateUrl] || yourBlocklist[privateUrl])))
			: (yourBlocklist[noSubUrl] || yourBlocklist[url] || (privateUrl !== undefined && yourBlocklist[privateUrl]))
	}
	return {toRemove: toRemove, domain: noSubUrl, privateDomain: privateUrl, showBlocked: settings.showBlocked, showButtons: settings.showButtons}
}

/*--- Your blocklist ---*/

function removeFromYourBlocklist(url) {
	delete yourBlocklist[url]
	chrome.storage.local.set({sesbYourBlocklist: JSON.stringify(yourBlocklist)})
}

function clearBlocklist() {
	yourBlocklist = {}
	chrome.storage.local.set({sesbYourBlocklist: undefined})
}

function updateYourBlocklist(url) {
	let whitelisted = false
	if (whitelist[url]) {
		whitelisted = true
	} else if (defaultBlocklist[url] === undefined) {
		yourBlocklist[url] = true
		chrome.storage.local.set({sesbYourBlocklist: JSON.stringify(yourBlocklist)})
	}
	return {showBlocked: settings.showBlocked, whitelisted: whitelisted}
}

function updateMultiple(domains) {
	const sanitizedDomains = sanitizeDomains(domains, false)
	for (let i = 0; i < sanitizedDomains.length; i++) {
		if (defaultBlocklist[sanitizedDomains[i]] === undefined && whitelist[sanitizedDomains[i]] === undefined) {
			yourBlocklist[sanitizedDomains[i]] = true
		}
	}
	optionsPageBlocklistUpdated = true
	chrome.storage.local.set({sesbYourBlocklist: JSON.stringify(yourBlocklist)})
}

/*--- Whitelist ---*/

function removeFromWhitelist(url) {
	delete whitelist[url]
	chrome.storage.local.set({sesbWhitelist: JSON.stringify(whitelist)})
}

function whitelistDomain(domain) {
	whitelist[domain] = true
	chrome.storage.local.set({sesbWhitelist: JSON.stringify(whitelist)})
}

function whitelistMultiple(domains) {
	const sanitizedDomains = sanitizeDomains(domains, false)
	for (let i = 0; i < sanitizedDomains.length; i++) {
		whitelist[sanitizedDomains[i]] = true
	}
	optionsPageWhitelistUpdated = true
	chrome.storage.local.set({sesbWhitelist: JSON.stringify(whitelist)})
}

/*--- Unblock ---*/

function unblock(url, isSub) {
	doWithWorker(function(){unblockWithWorker(url, isSub)})
	return {showBlocked: settings.showBlocked}
}

function unblockWithWorker(url, isSub) {
	const yourBlocklistProps = Object.getOwnPropertyNames(yourBlocklist)
	const defaultBlocklistProps = Object.getOwnPropertyNames(defaultBlocklist)
	if (isSub === true) {
		for (let i = 0; i < yourBlocklistProps.length; i++) {
			// Attempting to unblock subdomain w/ domain blocked in your blocklist
			if (url.endsWith(yourBlocklistProps[i]) && url !== yourBlocklistProps[i]) {
				whitelistDomain(url)
			// Attempting to unblock subdomain w/ subdomain blocked in your blocklist
			} else if (url === yourBlocklistProps[i]) {
				removeFromYourBlocklist(url)
			}
		}
		for (let i = 0; i < defaultBlocklistProps.length; i++) {
			// Attempting to unblock subdomain w/ domain or subdomain blocked in default blocklist
			if (url.endsWith(defaultBlocklistProps[i])) {
				whitelistDomain(url)
			}
		}
	} else {
		for (let i = 0; i < yourBlocklistProps.length; i++) {
			// Attempting to unblock domain w/ domain or subdomain blocked in your blocklist
			if (yourBlocklistProps[i].endsWith(url)) {
				removeFromYourBlocklist(yourBlocklistProps[i])
			}
		}
		for (let i = 0; i < defaultBlocklistProps.length; i++) {
			// Attempting to unblock domain w/ domain or subdomain blocked in default blocklist
			if (defaultBlocklistProps[i].endsWith(url)) {
				whitelistDomain(defaultBlocklistProps[i])
			}
		}
	}
}

/*--- Automatic update ---*/

function handleNullSettings(savedSettings) {
	settings = savedSettings === undefined ? sesbConstants.defaultSettings : savedSettings
}

function loadSettings() {
	chrome.storage.local.get(sesbConstants.storedResources.settings, function(r){handleNullSettings(r.sesbSettings)})
}

async function loadYourBlocklist() {
	const yourBlocklistJson = await chrome.storage.local.get(sesbConstants.storedResources.settings.yourBlocklist, function(r){return r.sesbYourBlocklist})
	const whitelistJson = await chrome.storage.local.get(sesbConstants.storedResources.settings.whitelist, function(r){return r.sesbWhitelist})
	if (yourBlocklistJson) {
		yourBlocklist = JSON.parse(yourBlocklistJson)
	}
	if (whitelistJson) {
		whitelist = JSON.parse(whitelistJson)
	}
}

function retainSuffixList(text) {
	suffixList = {}
	privateSuffixList = {}
	let validText = []
	let sanitizedText = []
	let validTextPrivate = []
	let sanitizedTextPrivate = []
	let privateDomainsStart
	for (let i = 0; i < text.length; i++) {
		if (text[i].includes('END ICANN DOMAINS')) {
			privateDomainsStart = i
			break
		} else if (text[i].startsWith('*') || text[i].startsWith('!')) {
			validText.push(text[i].substring(2))
		} else if (text[i] !== '' && !text[i].startsWith('/')) {
			validText.push(text[i])
		}
	}
	for (let i = privateDomainsStart; i < text.length; i++) {
		if (text[i].startsWith('*') || text[i].startsWith('!')) {
			validTextPrivate.push(text[i].substring(2))
		} else if (text[i] !== '' && !text[i].startsWith('/')) {
			validTextPrivate.push(text[i])
		}
	}
	sanitizedText = sanitizeDomains(validText, true)
	sanitizedTextPrivate = sanitizeDomains(validTextPrivate, true)
	for (let i = 0; i < sanitizedText.length; i++) {
		suffixList[sanitizedText[i]] = true
	}
	for (let i = 0; i < sanitizedTextPrivate.length; i++) {
		privateSuffixList[sanitizedTextPrivate[i]] = true
	}
	for (let i = 0; i < sesbConstants.unlistedSuffixes.length; i++) {
		suffixList[sesbConstants.unlistedSuffixes[i]] = true
	}
	chrome.storage.local.set({sesbSuffixList: JSON.stringify(suffixList)})
	chrome.storage.local.set({sesbPrivateSuffixList: JSON.stringify(privateSuffixList)})
	console.log('Suffix list OK')
}

function retainDefaultBlocklist(text) {
	defaultBlocklist = {}
	for (let i = 0; i < text.length; i++) {
		defaultBlocklist[text[i]] = true
	}
	chrome.storage.local.set({sesbBlocklist: JSON.stringify(defaultBlocklist)})
	console.log('Blocklist OK')
}

function wait(delay){
	return new Promise((resolve) => setTimeout(resolve, delay))
}

function retryFetch(response, tries, functionToRetry) {
	if (!response.ok) {
		if (tries !== 0) {
			return wait(4000).then(() => functionToRetry(tries - 1))
		} else {
			throw Error(response.statusText)
		}
	}
	return response
}

function fetchDefaultBlocklist(tries) {
	return fetch('https://raw.githubusercontent.com/no-cmyk/Search-Engine-Spam-Blocklist/master/blocklist.txt')
		.then((r) => retryFetch(r, tries, fetchDefaultBlocklist))
		.then((response) => response.text())
		.then((text) => retainDefaultBlocklist(text.split('\n')))
}

function fetchSuffixList(tries) {
	// Cannot pull from publicsuffix.org/list/public_suffix_list.dat because of a CORS header missing
	return fetch('https://raw.githubusercontent.com/publicsuffix/list/master/public_suffix_list.dat')
		.then((r) => retryFetch(r, tries, fetchSuffixList))
		.then((response) => response.text())
		.then((text) => retainSuffixList(text.split('\n')))
}

async function checkIfNeedsUpdate() {
	const lastUpdate = await chrome.storage.local.get(sesbConstants.storedVars.lastUpdate, function(r){return r.sesbLastUpdate})
	suffixList = await chrome.storage.local.get(sesbConstants.storedVars.suffixList, function(r){return r.sesbSuffixList})
	privateSuffixList = await chrome.storage.local.get(sesbConstants.storedVars.privateSuffixList, function(r){return r.sesbPrivateSuffixList})
	defaultBlocklist = await chrome.storage.local.get(sesbConstants.storedVars.sesbBlocklist, function(r){return r.sesbBlocklist})
	if (lastUpdate === undefined || suffixList === undefined || defaultBlocklist === undefined || privateSuffixList === undefined || (Date.now() - lastUpdate > 86400)) {
		needsUpdate = true
	}
}

async function updateLists() {
	const needsUpdateSettings = await checkIfNeedsUpdate()
	doWithWorker(updateOnlineLists)
}

function updateOnlineLists() {
	if (needsUpdate) {
		console.log('Updating lists...')
		fetchSuffixList(5)
		fetchDefaultBlocklist(5)
		chrome.storage.local.set({sesbLastUpdate: Date.now()})
		needsUpdate = false
	} else {
		console.log('Loading cached lists')
		suffixList = JSON.parse(suffixList)
		defaultBlocklist = JSON.parse(defaultBlocklist)
	}
	loadYourBlocklist()
}

/*--- Sanitize URLs ---*/
/*--- Includes code from github.com/bestiejs/punycode.js (provided under MIT license) ---*/
/*--- Copyright Mathias Bynens <https://mathiasbynens.be/> ---*/

function digitToBasic(digit, flag) {
	return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5)
}

function adapt(delta, numPoints, firstTime) {
	let k = 0
	delta = firstTime ? Math.floor(delta / 700) : delta >> 1
	delta += Math.floor(delta / numPoints)
	for (/* no initialization */; delta > 35 * 26 >> 1; k += 36) {
		delta = Math.floor(delta / 35)
	}
	return Math.floor(k + (35 + 1) * delta / (delta + 38))
}

function ucs2decode(string) {
	const output = []
	let counter = 0
	const length = string.length
	while (counter < length) {
		const value = string.charCodeAt(counter++)
		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
			const extra = string.charCodeAt(counter++)
			if ((extra & 0xFC00) == 0xDC00) {
				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000)
			} else {
				output.push(value)
				counter--
			}
		} else {
			output.push(value)
		}
	}
	return output
}

function encode(input) {
	const output = []
	input = ucs2decode(input)
	let inputLength = input.length
	let n = 128
	let delta = 0
	let bias = 72
	for (const currentValue of input) {
		if (currentValue < 0x80) {
			output.push(String.fromCharCode(currentValue))
		}
	}
	let basicLength = output.length
	let handledCPCount = basicLength
	if (basicLength) {
		output.push('-')
	}
	while (handledCPCount < inputLength) {
		let m = 2147483647
		for (const currentValue of input) {
			if (currentValue >= n && currentValue < m) {
				m = currentValue
			}
		}
		const handledCPCountPlusOne = handledCPCount + 1
		if (m - n > Math.floor((2147483647 - delta) / handledCPCountPlusOne)) {
			return undefined
		}
		delta += (m - n) * handledCPCountPlusOne
		n = m
		for (const currentValue of input) {
			if (currentValue < n && ++delta > 2147483647) {
				return undefined
			}
			if (currentValue == n) {
				let q = delta
				for (let k = 36; /* no condition */; k += 36) {
					const t = k <= bias ? 1 : (k >= bias + 26 ? 26 : k - bias)
					if (q < t) {
						break
					}
					const qMinusT = q - t
					const baseMinusT = 36 - t
					output.push(String.fromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)))
					q = Math.floor(qMinusT / baseMinusT)
				}
				output.push(String.fromCharCode(digitToBasic(q, 0)))
				bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength)
				delta = 0
				++handledCPCount
			}
		}
		++delta
		++n
	}
	return output.join('')
}

function sanitizeDomains(domains, skipRegex) {
	let sanitizedDomains = []
	let reg = new RegExp(/[A-Z0-9][A-Z0-9_-]*(\.[A-Z0-9][A-Z0-9_-]*)+/i)
	for (let i = 0; i < domains.length; i++) {
		let domain = domains[i]
		domain.replace(/^.*:\/\/|[\/,\:].*$/g, '')
		let newDomain = []
		let splitDomain = domain.split('.')
		for (let j = 0; j < splitDomain.length; j++) {
			let ascii = /[^\0-\x7E]/.test(splitDomain[j]) ? 'xn--' + encode(splitDomain[j]) : splitDomain[j]
			newDomain.push(ascii)
		}
		domain = newDomain.join('.')
		if (skipRegex === true) {
			sanitizedDomains.push(domain.toLowerCase())
		} else {
			let checkedDomain = reg.exec(domain)
			if (checkedDomain !== null) {
				sanitizedDomains.push(checkedDomain[0].toLowerCase())
			}
		}
	}
	return sanitizedDomains
}

updateLists()
loadSettings()