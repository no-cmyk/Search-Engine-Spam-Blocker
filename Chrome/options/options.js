const listElem = document.getElementById('your-blocklist')
const exportElem = document.getElementById('export')
const importElem = document.getElementById('import')
const textareaElem = document.getElementById('add-domains-textarea')
const resultOkElem = document.getElementById('result-ok')
const textareaWhitelistElem = document.getElementById('whitelist-domains-textarea')
const whitelistElem = document.getElementById('whitelist')
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
		case 'domain':
			removeFromYourBlocklist(click.srcElement.parentElement)
			break
		case 'domain-whitelist':
			removeFromWhitelist(click.srcElement.parentElement)
			break
		case 'update-spam-lists':
			chrome.runtime.sendMessage({action: 'update-spam-lists'})
			resultOkElem.classList.remove('hidden')
			setTimeout(function(){resultOkElem.classList.add('hidden')}, 3000)
			break
		case 'export':
			exportElem.parentElement.setAttribute('href', 'data:text/plaincharset=utf-8,' + encodeURIComponent(domainsAsList.join('\n')))
			exportElem.parentElement.setAttribute('download', 'sesb_blocklist_' + new Date().toISOString() + '.txt')
			break
		case 'add-domains-button':
			listElem.innerHTML = ''
			addDomainsToBlocklist(textareaElem.value)
			textareaElem.value = ''
			break
		case 'clear-blocklist':
			if (confirm('WARNING:\n\nThis will irreversibly remove all domains from your blocklist,\ndo you really want to proceed?')) {
				domainsAsList = []
				listElem.innerHTML = ''
				listIndex = 0
				chrome.runtime.sendMessage({action: 'clear-blocklist'})
			}
			break
		case 'whitelist-domains-button':
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
		removeBtn.id = 'domain-whitelist'
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
		removeBtn.id = 'domain'
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
	chrome.runtime.sendMessage({action: 'update-multiple', url: domainsToAdd}, function(){
		checkBlocklistUpdated()
	})
}

function whitelistDomains(domains) {
	whitelistDomainsAsList = domains.split('\n')
	chrome.runtime.sendMessage({action: 'whitelist-multiple', url: whitelistDomainsAsList}, function(){
		checkWhitelistUpdated()
	})
}

function loadLists(loadBlock, loadWhite) {
	if (loadBlock === true) {
		chrome.runtime.sendMessage({action: 'load-your-blocklist'}, function(bl){
			domainsAsList = bl
			populateBlocklist()
		})
	}
	if (loadWhite === true) {
		chrome.runtime.sendMessage({action: 'load-whitelist'}, function(wl){
		whitelist = wl
		populateWhitelist()
		})
	}
}

function removeFromYourBlocklist(li) {
	chrome.runtime.sendMessage({action: 'remove', url: li.innerText.substring(1)})
	li.remove()
	if (listElem.childElementCount === 0) {
		listIndex = 0
	}
}

function removeFromWhitelist(li) {
	chrome.runtime.sendMessage({action: 'remove-from-whitelist', url: li.innerText.substring(1)})
	li.remove()
}

async function checkBlocklistUpdated() {
	let updated = false
	while (updated === false) {
		await sleep(400)
		chrome.runtime.sendMessage({action: 'check-options-blocklist-updated'}, function(r){
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
		chrome.runtime.sendMessage({action: 'check-options-whitelist-updated'}, function(r){
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