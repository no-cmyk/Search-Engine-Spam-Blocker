'use strict'
const listElem = document.getElementById(sesbConstants.html.yourBlocklist)
const exportElem = document.getElementById(sesbConstants.html.export)
const importElem = document.getElementById(sesbConstants.html.import)
const textareaElem = document.getElementById(sesbConstants.html.addDomainsTextarea)
const resultOkElem = document.getElementById(sesbConstants.html.resultOk)
const textareaWhitelistElem = document.getElementById(sesbConstants.html.whitelistDomainsTextarea)
const whitelistElem = document.getElementById(sesbConstants.html.whitelist)
let domainsAsList = []
let whitelistDomainsAsList = []
let listIndex = 0
const interval = 2000
addListeners()

function addListeners() {
	loadLists(true, true)
	document.addEventListener('click', handleClicks)
	importElem.addEventListener('change', handleFile)
	listElem.addEventListener('scroll', scrollBlocklist)
}

function handleClicks(click) {
	switch (click.srcElement.id) {
		case sesbConstants.html.domain:
			removeFromYourBlocklist(click.srcElement.parentElement)
			break
		case sesbConstants.html.domainWhitelist:
			removeFromWhitelist(click.srcElement.parentElement)
			break
		case sesbConstants.html.updateSpamLists:
			chrome.runtime.sendMessage({action: sesbConstants.actions.updateSpamLists})
			resultOkElem.classList.remove('hidden')
			setTimeout(function(){resultOkElem.classList.add('hidden')}, 3000)
			break
		case sesbConstants.html.export:
			exportElem.parentElement.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(domainsAsList.join('\n')))
			exportElem.parentElement.setAttribute('download', 'SESB_Blocklist_' + new Date().toISOString() + '.txt')
			break
		case sesbConstants.html.addDomainsButton:
			listElem.innerHTML = ''
			addDomainsToBlocklist(textareaElem.value)
			textareaElem.value = ''
			break
		case sesbConstants.html.clearBlocklist:
			if (confirm('WARNING:\n\nThis will irreversibly remove all domains from your blocklist,\ndo you really want to proceed?')) {
				domainsAsList = []
				listElem.innerHTML = ''
				listIndex = 0
				chrome.runtime.sendMessage({action: sesbConstants.actions.clearBlocklist})
			}
			break
		case sesbConstants.html.whitelistDomainsButton:
			whitelistElem.innerHTML = ''
			whitelistDomains(textareaWhitelistElem.value)
			textareaWhitelistElem.value = ''
			break
		default:
			break
	}
}

function handleFile(event) {
	const fileReader = new FileReader()
	fileReader.onload = function(event) {
		listElem.innerHTML = ''
		addDomainsToBlocklist(event.target.result)
	}
	fileReader.readAsText(event.target.files[0])
	importElem.value = ''
}

function scrollBlocklist() {
	if (listElem.scrollTop === (listElem.scrollHeight - listElem.offsetHeight) && listIndex < domainsAsList.length) {
		listIndex += interval
		populateBlocklist()
	}
}

function populateWhitelist() {
	const c = document.createDocumentFragment()
	for (let i = 0; i < whitelistDomainsAsList.length; i++) {
		const li = document.createElement('li')
		const removeBtn = document.createElement('span')
		removeBtn.id = sesbConstants.html.domainWhitelist
		removeBtn.innerText = '✖'
		removeBtn.title = 'Remove this domain from your whitelist?'
		li.innerText = whitelistDomainsAsList[i]
		li.prepend(removeBtn)
		c.appendChild(li)
	}
	whitelistElem.appendChild(c)
}

function populateBlocklist() {
	const c = document.createDocumentFragment()
	for (let i = listIndex; i < listIndex + interval; i++) {
		if (i >= domainsAsList.length) {
			break
		}
		const li = document.createElement('li')
		const removeBtn = document.createElement('span')
		removeBtn.id = sesbConstants.html.domain
		removeBtn.innerText = '✖'
		removeBtn.title = 'Remove this domain from your blocklist?'
		li.innerText = domainsAsList[i]
		li.prepend(removeBtn)
		c.appendChild(li)
	}
	listElem.appendChild(c)
}

function addDomainsToBlocklist(domains) {
	let domainsToAdd = domains.split('\n')
	chrome.runtime.sendMessage({action: sesbConstants.actions.updateMultiple, url: domainsToAdd}, function(){
		checkBlocklistUpdated()
	})
}

function whitelistDomains(domains) {
	whitelistDomainsAsList = domains.split('\n')
	chrome.runtime.sendMessage({action: sesbConstants.actions.whitelistMultiple, url: whitelistDomainsAsList}, function(){
		checkWhitelistUpdated()
	})
}

function loadLists(loadBlock, loadWhite) {
	if (loadBlock === true) {
		chrome.runtime.sendMessage({action: sesbConstants.actions.loadYourBlocklist}, function(bl){
			domainsAsList = bl
			populateBlocklist()
		})
	}
	if (loadWhite === true) {
		chrome.runtime.sendMessage({action: sesbConstants.actions.loadWhitelist}, function(wl){
		whitelistDomainsAsList = wl
		populateWhitelist()
		})
	}
}

function removeFromYourBlocklist(li) {
	chrome.runtime.sendMessage({action: sesbConstants.actions.remove, url: li.innerText.substring(1)})
	li.remove()
	if (listElem.childElementCount === 0) {
		listIndex = 0
	}
}

function removeFromWhitelist(li) {
	chrome.runtime.sendMessage({action: sesbConstants.actions.removeFromWhitelist, url: li.innerText.substring(1)})
	li.remove()
}

async function checkBlocklistUpdated() {
	let updated = false
	while (updated === false) {
		await sleep(400)
		chrome.runtime.sendMessage({action: sesbConstants.actions.checkOptionsBlocklistUpdated}, function(r){
			updated = r
			if (r === true) {
				loadLists(true, false)
			}
		})
	}
}

async function checkWhitelistUpdated() {
	let updated = false
	while (updated === false) {
		await sleep(400)
		chrome.runtime.sendMessage({action: sesbConstants.actions.checkOptionsWhitelistUpdated}, function(r){
			updated = r
			if (r === true) {
				loadLists(false, true)
			}
		})
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}