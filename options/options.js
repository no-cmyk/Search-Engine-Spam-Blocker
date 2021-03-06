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
	loadBlocklist()
	document.addEventListener('click', handleClicks)
	importElem.addEventListener('change', handleFile)
	listElem.addEventListener('scroll', scrollList)
}

function handleClicks(click) {
	switch (click.srcElement.id) {
		case 'domain':
			removeFromYourBlocklist(click.srcElement)
			break
		case 'domain-whitelist':
			removeFromWhitelist(click.srcElement)
			break
		case 'update-spam-lists':
			browser.runtime.sendMessage({action: 'update-spam-lists'})
			resultOkElem.classList.remove('hidden')
			setTimeout(function() {
				resultOkElem.classList.add('hidden')
			}, 3000)
			break
		case 'export':
			exportElem.parentElement.setAttribute('href', 'data:text/plaincharset=utf-8,' + encodeURIComponent(domainsAsList.join('\n')))
			exportElem.parentElement.setAttribute('download', 'sesb_blocklist_' + Date.now() + '.txt')
			break
		case 'add-domains-button':
			addDomains(textareaElem.value)
			textareaElem.value = ''
			break
		case 'clear-blocklist':
			if (confirm('WARNING:\n\nThis will irreversibly remove all domains from your blocklist,\ndo you really want to proceed?')) {
				browser.runtime.sendMessage({action: 'clear-blocklist'})
				domainsAsList = []
				listElem.innerHTML = ''
				listIndex = 0
			}
			break
		case 'whitelist-domains-button':
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
		addDomains(event.target.result)
	}
	fileReader.readAsText(event.target.files[0])
	importElem.value = ''
}

function scrollList() {
	if (listElem.scrollTop === (listElem.scrollHeight - listElem.offsetHeight) && listIndex < domainsAsList.length) {
		listIndex += interval
		populateScrollList(interval)
	}
}

function populateWhitelist() {
	const c = document.createDocumentFragment()
	for (let i = 0; i < whitelistDomainsAsList.length; i++) {
		const li = document.createElement('li')
		li.id = 'domain-whitelist'
		li.innerText = whitelistDomainsAsList[i]
		c.appendChild(li)
	}
	whitelistElem.appendChild(c)
}

function populateScrollList() {
	const c = document.createDocumentFragment()
	for (let i = listIndex; i < listIndex + interval; i++) {
		if (i >= domainsAsList.length) {
			break
		}
		const li = document.createElement('li')
		li.id = 'domain'
		li.innerText = domainsAsList[i]
		c.appendChild(li)
	}
	listElem.appendChild(c)
}

function addDomains(domains) {
	domainsAsList = domains.split('\n')
	browser.runtime.sendMessage({action: 'update-multiple', url: domainsAsList})
	populateScrollList()
}

function whitelistDomains(domains) {
	whitelistDomainsAsList = domains.split('\n')
	browser.runtime.sendMessage({action: 'whitelist-multiple', url: whitelistDomainsAsList})
	populateWhitelist()
}

async function loadBlocklist() {
	domainsAsList = await browser.runtime.sendMessage({action: 'load-your-blocklist'})
	whitelistDomainsAsList = await browser.runtime.sendMessage({action: 'load-whitelist'})
	populateScrollList()
	populateWhitelist()
}

function removeFromYourBlocklist(li) {
	browser.runtime.sendMessage({action: 'remove', url: li.innerText})
	li.remove()
	if (listElem.childElementCount === 0) {
		listIndex = 0
	}
}

function removeFromWhitelist(li) {
	browser.runtime.sendMessage({action: 'remove-from-whitelist', url: li.innerText})
	li.remove()
}
