'use strict'
const listElem = document.getElementById(html.yourBlocklist)
const exportElem = document.getElementById(html.export)
const importElem = document.getElementById(html.import)
const textareaElem = document.getElementById(html.addDomainsTextarea)
const resultOkElem = document.getElementById(html.resultOk)
const textareaWhitelistElem = document.getElementById(html.whitelistDomainsTextarea)
const whitelistElem = document.getElementById(html.whitelist)
let domainsAsList = []
let whitelistDomainsAsList = []
let listIndex = 0
const interval = 2000
addListeners()

function addListeners() {
	loadLists()
	document.addEventListener('click', handleClicks)
	importElem.addEventListener('change', handleFile)
	listElem.addEventListener('scroll', scrollBlocklist)
}

function handleClicks(click) {
	switch (click.srcElement.id) {
		case html.domain:
			removeFromYourBlocklist(click.srcElement.parentElement)
			break
		case html.domainWhitelist:
			removeFromWhitelist(click.srcElement.parentElement)
			break
		case html.updateSpamLists:
			browser.runtime.sendMessage({action: actions.updateSpamLists})
			resultOkElem.style.display = 'initial'
			setTimeout(function(){resultOkElem.style.display = 'none'}, 3000)
			break
		case html.export:
			exportElem.parentElement.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(domainsAsList.join('\n')))
			exportElem.parentElement.setAttribute('download', 'SESB_Blocklist_' + new Date().toISOString() + '.txt')
			break
		case html.addDomainsButton:
			listElem.innerHTML = ''
			whitelistElem.innerHTML = ''
			addDomainsToBlocklist(textareaElem.value)
			textareaElem.value = ''
			break
		case html.clearBlocklist:
			if (confirm(texts.clearBlocklistAlert)) {
				domainsAsList = []
				listElem.innerHTML = ''
				listIndex = 0
				browser.runtime.sendMessage({action: actions.clearBlocklist})
			}
			break
		case html.whitelistDomainsButton:
			listElem.innerHTML = ''
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
		removeBtn.id = html.domainWhitelist
		removeBtn.innerText = texts.remove
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
		removeBtn.id = html.domain
		removeBtn.innerText = texts.remove
		li.innerText = domainsAsList[i]
		li.prepend(removeBtn)
		c.appendChild(li)
	}
	listElem.appendChild(c)
}

function addDomainsToBlocklist(domains) {
	browser.runtime.sendMessage({action: actions.updateMultiple, url: domains.split('\n')})
	checkListsUpdated()
}

function whitelistDomains(domains) {
	browser.runtime.sendMessage({action: actions.whitelistMultiple, url: domains.split('\n')})
	checkListsUpdated()
}

function removeFromYourBlocklist(li) {
	browser.runtime.sendMessage({action: actions.remove, url: li.innerText.substring(1)})
	li.remove()
	if (listElem.childElementCount === 0) {
		listIndex = 0
	}
}

function removeFromWhitelist(li) {
	browser.runtime.sendMessage({action: actions.removeFromWhitelist, url: li.innerText.substring(1)})
	li.remove()
}

async function loadLists() {
	domainsAsList = await browser.runtime.sendMessage({action: actions.loadYourBlocklist})
	populateBlocklist()
	whitelistDomainsAsList = await browser.runtime.sendMessage({action: actions.loadWhitelist})
	populateWhitelist()
}

async function checkListsUpdated() {
	let updated = false
	while (updated === false) {
		await new Promise(resolve => setTimeout(resolve, 400))
		updated = await browser.runtime.sendMessage({action: actions.checkOptionsListsUpdated})
		if (updated === true) {
			loadLists()
		}
	}
}
