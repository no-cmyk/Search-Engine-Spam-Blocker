'use strict'
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
	importButton.addEventListener('change', handleFile)
	yourBlocklist.addEventListener('scroll', scrollBlocklist)
}

function handleClicks(click) {
	switch (click.srcElement.id) {
		case 'domain':
			removeUrl(actions.remove, click.srcElement.parentElement)
			if (yourBlocklist.childElementCount === 0) {
				listIndex = 0
			}
			break
		case 'domainWhitelist':
			removeUrl(actions.removeFromWhitelist, click.srcElement.parentElement)
			break
		case 'updateSpamLists':
			browser.runtime.sendMessage({action: actions.updateSpamLists})
			resultOk.style.display = 'initial'
			setTimeout(function(){resultOk.style.display = 'none'}, 3000)
			break
		case 'exportButton':
			exportButton.parentElement.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(domainsAsList.join('\n')))
			exportButton.parentElement.setAttribute('download', 'SESB_Blocklist_' + new Date().toISOString() + '.txt')
			break
		case 'addDomainsButton':
			addUrls(actions.updateMultiple, addDomainsTextarea.value, addDomainsTextarea)
			break
		case 'clearBlocklist':
			if (confirm(texts.clearBlocklistAlert)) {
				domainsAsList = []
				yourBlocklist.innerHTML = ''
				listIndex = 0
				browser.runtime.sendMessage({action: actions.clearBlocklist})
			}
			break
		case 'whitelistDomainsButton':
			addUrls(actions.whitelistMultiple, whitelistDomainsTextarea.value, whitelistDomainsTextarea)
			break
		case 'addBlocklistUrlsButton':
			addUrls(actions.addBlocklistsFromUrls, addBlocklistUrlsTextarea.value, addBlocklistUrlsTextarea)
			break
		case 'addWhitelistUrlsButton':
			addUrls(actions.addWhitelistsFromUrls, addWhitelistUrlsTextarea.value, addWhitelistUrlsTextarea)
			break
		case 'remoteBlocklist':
			removeUrl(actions.removeFromRemoteBlocklists, click.srcElement.parentElement)
			break
		case 'remoteWhitelist':
			removeUrl(actions.removeFromRemoteWhitelists, click.srcElement.parentElement)
			break
		default:
			break
	}
}

function handleFile(event) {
	const fileReader = new FileReader()
	fileReader.onload = function(event) {
		yourBlocklist.innerHTML = ''
		addUrls(actions.updateMultiple, event.target.result, null)
	}
	fileReader.readAsText(event.target.files[0])
	importButton.value = ''
}

function scrollBlocklist() {
	if (yourBlocklist.scrollTop === (yourBlocklist.scrollHeight - yourBlocklist.offsetHeight) && listIndex < domainsAsList.length) {
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
		const removeButton = document.createElement('span')
		removeButton.id = 'domain'
		removeButton.innerText = texts.remove
		li.innerText = domainsAsList[i]
		li.prepend(removeButton)
		c.appendChild(li)
	}
	yourBlocklist.appendChild(c)
}

function populateList(urls, recordId, listElem) {
	const c = document.createDocumentFragment()
	for (let i = 0; i < urls.length; i++) {
		const li = document.createElement('li')
		const removeButton = document.createElement('span')
		removeButton.id = recordId
		removeButton.innerText = texts.remove
		li.innerText = urls[i]
		li.prepend(removeButton)
		c.appendChild(li)
	}
	listElem.appendChild(c)
}

function addUrls(action, urls, textarea) {
	yourBlocklist.innerHTML = ''
	whitelist.innerHTML = ''
	yourRemoteBlocklists.innerHTML = ''
	yourRemoteWhitelists.innerHTML = ''
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
	populateList(whitelistDomainsAsList, 'domainWhitelist', whitelist)
	remoteBlocklists = await browser.runtime.sendMessage({action: actions.loadRemoteBlocklists})
	populateList(remoteBlocklists, 'remoteBlocklist', yourRemoteBlocklists)
	remoteWhitelists = await browser.runtime.sendMessage({action: actions.loadRemoteWhitelists})
	populateList(remoteWhitelists, 'remoteWhitelist', yourRemoteWhitelists)
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
