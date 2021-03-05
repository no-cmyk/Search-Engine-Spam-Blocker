const listElem = document.getElementById('your-blocklist')
const exportElem = document.getElementById('export')
const importElem = document.getElementById('import')
const textareaElem = document.getElementById('add-domains-textarea')
const resultOkElem = document.getElementById('result-ok')
let domainsAsList = []
let listIndex = 0
addListeners()

function addListeners() {
	loadBlocklist()
	document.addEventListener('click', handleClicks)
	importElem.addEventListener('change', handleFile)
	listElem.addEventListener('scroll', scrollList)
}

function scrollList() {
	if (listElem.scrollTop === (listElem.scrollHeight - listElem.offsetHeight) && listIndex < domainsAsList.length) {
		const interval = (domainsAsList.length < 200) ? 12 : 1000
		listIndex += interval
		populateUlList(interval)
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

function populateUlList(interval) {
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

function handleClicks(click) {
	const initiator = click.srcElement.id
	switch (initiator) {
		case 'domain':
			removeFromYourBlocklist(click.srcElement)
			break
		case 'update-spam-lists':
			browser.runtime.sendMessage({action: 'update-spam-lists'})
			resultOkElem.classList.remove('hidden')
			setTimeout(function() {
				resultOkElem.classList.add('hidden')
			}, 3000)
			break
		case 'export':
			exportElem.parentElement.setAttribute('href', 'data:text/plaincharset=utf-8,' + encodeURIComponent(listElem.innerText))
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
		default:
			break
	}
}

function addDomains(domains) {
	domainsAsList = domains.split('\n').filter((e) => e.match(/.\../))
	browser.runtime.sendMessage({action: 'update-multiple', url: domainsAsList})
	populateUlList(100)
}

async function loadBlocklist() {
	domainsAsList = await browser.runtime.sendMessage({action: 'load-your-blocklist'})
	populateUlList(100)
}

function removeFromYourBlocklist(li) {
	browser.runtime.sendMessage({action: 'remove', url: li.innerText})
	li.remove()
	if (listElem.childElementCount === 0) {
		listIndex = 0
	}
}
