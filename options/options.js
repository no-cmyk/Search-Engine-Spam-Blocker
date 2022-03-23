'use strict'
const blocklistElem = document.getElementById(html.yourBlocklist)
const exportElem = document.getElementById(html.export)
const importElem = document.getElementById(html.import)
const textareaElem = document.getElementById(html.addDomainsTextarea)
const resultOkElem = document.getElementById(html.resultOk)
const textareaWhitelistElem = document.getElementById(html.whitelistDomainsTextarea)
const whitelistElem = document.getElementById(html.whitelist)
const addBlocklistUrlsTextarea = document.getElementById(html.addBlocklistUrlsTextarea)
const addBlocklistUrlsButton = document.getElementById(html.addBlocklistUrlsButton)
const remoteBlocklistsElem = document.getElementById(html.yourRemoteBlocklists)
const addWhitelistUrlsTextarea = document.getElementById(html.addWhitelistUrlsTextarea)
const addWhitelistUrlsButton = document.getElementById(html.addWhitelistUrlsButton)
const remoteWhitelistsElem = document.getElementById(html.yourRemoteWhitelists)
let domainsAsList = []
let whitelistDomainsAsList = []
let remoteBlocklists = []
let remoteWhitelists = []
let listIndex = 0
const interval = 2000
init()

function init() {
	loadLists()
	document.addEventListener('click', handleClicks)
	importElem.addEventListener('change', handleFile)
	blocklistElem.addEventListener('scroll', scrollBlocklist)
}

function handleClicks(click) {
	switch (click.srcElement.id) {
		case html.domain:
			removeUrl(actions.remove, click.srcElement.parentElement)
			if (blocklistElem.childElementCount === 0) {
				listIndex = 0
			}
			break
		case html.domainWhitelist:
			removeUrl(actions.removeFromWhitelist, click.srcElement.parentElement)
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
			addUrls(actions.updateMultiple, textareaElem.value, textareaElem)
			break
		case html.clearBlocklist:
			if (confirm(texts.clearBlocklistAlert)) {
				domainsAsList = []
				blocklistElem.innerHTML = ''
				listIndex = 0
				browser.runtime.sendMessage({action: actions.clearBlocklist})
			}
			break
		case html.whitelistDomainsButton:
			addUrls(actions.whitelistMultiple, textareaWhitelistElem.value, textareaWhitelistElem)
			break
		case html.addBlocklistUrlsButton:
			addUrls(actions.addBlocklistsFromUrls, addBlocklistUrlsTextarea.value, addBlocklistUrlsTextarea)
			break
		case html.addWhitelistUrlsButton:
			addUrls(actions.addWhitelistsFromUrls, addWhitelistUrlsTextarea.value, addWhitelistUrlsTextarea)
			break
		case html.remoteBlocklist:
			removeUrl(actions.removeFromRemoteBlocklists, click.srcElement.parentElement)
			break
		case html.remoteWhitelist:
			removeUrl(actions.removeFromRemoteWhitelists, click.srcElement.parentElement)
			break
		default:
			break
	}
}

function handleFile(event) {
	const fileReader = new FileReader()
	fileReader.onload = function(event) {
		blocklistElem.innerHTML = ''
		addUrls(actions.updateMultiple, event.target.result, null)
	}
	fileReader.readAsText(event.target.files[0])
	importElem.value = ''
}

function scrollBlocklist() {
	if (blocklistElem.scrollTop === (blocklistElem.scrollHeight - blocklistElem.offsetHeight) && listIndex < domainsAsList.length) {
		listIndex += interval
		populateBlocklist()
	}
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
	blocklistElem.appendChild(c)
}

function populateList(urls, recordId, listElem) {
	const c = document.createDocumentFragment()
	for (let i = 0; i < urls.length; i++) {
		const li = document.createElement('li')
		const removeBtn = document.createElement('span')
		removeBtn.id = recordId
		removeBtn.innerText = texts.remove
		li.innerText = urls[i]
		li.prepend(removeBtn)
		c.appendChild(li)
	}
	listElem.appendChild(c)
}

function addUrls(action, urls, textarea) {
	blocklistElem.innerHTML = ''
	whitelistElem.innerHTML = ''
	remoteBlocklistsElem.innerHTML = ''
	remoteWhitelistsElem.innerHTML = ''
	browser.runtime.sendMessage({action: action, urls: urls.split('\n')})
	if (textarea !== null) {
		textarea.value = ''
	}
	checkListsUpdated()
}

function removeUrl(action, li) {
	browser.runtime.sendMessage({action: action, url: li.innerText.substring(1)})
	li.remove()
}

async function loadLists() {
	domainsAsList = await browser.runtime.sendMessage({action: actions.loadYourBlocklist})
	populateBlocklist()
	whitelistDomainsAsList = await browser.runtime.sendMessage({action: actions.loadWhitelist})
	populateList(whitelistDomainsAsList, html.domainWhitelist, whitelistElem)
	remoteBlocklists = await browser.runtime.sendMessage({action: actions.loadRemoteBlocklists})
	populateList(remoteBlocklists, html.remoteBlocklist, remoteBlocklistsElem)
	remoteWhitelists = await browser.runtime.sendMessage({action: actions.loadRemoteWhitelists})
	populateList(remoteWhitelists, html.remoteWhitelist, remoteWhitelistsElem)
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
