'use strict'
let settings
let done = {}
const textResult = 'g'
const textResultMobile = 'xpd'
const imgResult = 'isv-r'
const allResults = '.' + css.nestedResult + '\,.' + imgResult
const allButtons = '.' + css.blockDiv + '\,.' + css.unblockDiv + '\,.' + css.blockedByRemote + '\,.' + css.whitelistedByRemote

document.addEventListener('DOMContentLoaded', scanTextResults, true)
document.addEventListener('load', scanImageResults, true)

/*---Handle settings---*/

browser.runtime.onMessage.addListener(message => {
	settings = message
	update()
})

async function update() {
	settings = settings ?? await browser.runtime.sendMessage({action: actions.getActiveSettings})
	for (const e of document.querySelectorAll(allResults)) {
		let blockDiv = e.querySelector('.' + css.blockDiv)
		let unblockDiv = e.querySelector('.' + css.unblockDiv)
		let blockedByRemote = e.querySelector('.' + css.blockedByRemote)
		let whitelistedByRemote = e.querySelector('.' + css.whitelistedByRemote)
		if ((blockDiv === null || unblockDiv === null) && (blockedByRemote === null || whitelistedByRemote === null)) {
			continue
		} else if (blockedByRemote !== null) {
			blockedByRemote.classList.toggle(css.hidden, settings.enabled === 0 || settings.showButtons === 0)
		}
		if (settings.enabled === 0) {
			e.classList.remove(css.hidden, css.blockedShow)
			if (blockDiv !== null) {
				blockDiv.classList.add(css.hidden)
				unblockDiv.classList.add(css.hidden)
			}
		} else if (e.classList.contains(css.blocked)) {
			settings.showBlocked === 1 ? (e.classList.remove(css.hidden), e.classList.add(css.blockedShow)) : (e.classList.remove(css.blockedShow), e.classList.add(css.hidden))
			if (blockDiv !== null) {
				blockDiv.classList.add(css.hidden)
				unblockDiv.classList.remove(css.hidden)
			}
		} else {
			e.classList.remove(css.hidden, css.blockedShow)
			if (blockDiv !== null && whitelistedByRemote === null) {
				blockDiv.classList.toggle(css.hidden, settings.showButtons === 0)
				unblockDiv.classList.add(css.hidden)
			}
		}
	}
	browser.runtime.sendMessage({action: actions.updateBadge, blockedNumber: settings.enabled === 1 ? document.querySelectorAll('.' + css.blocked).length : 0})
}

/*---Scan search results---*/

function scanTextResults() {
	let elements = []
	for (const e of document.querySelectorAll('.' + textResult)) {
		for (const el of e.querySelectorAll(':scope > div')) {
			el.classList.add(css.nestedResult)
		}
	}
	for (const e of document.querySelectorAll('.' + css.nestedResult)) {
		if (shouldHandle(e)) {
			giveId(e)
			elements.push(e)
		}
	}
	handleResults(elements)
}

function scanImageResults() {
	let elements = []
	for (const e of document.querySelectorAll('div.' + imgResult)) {
		if (shouldHandle(e)) {
			giveId(e)
			if (!done[e.getAttribute(css.sesbId)]) {
				done[e.getAttribute(css.sesbId)] = true
				elements.push(e)
			}
		}
	}
	handleResults(elements)
}

function giveId(e) {
	if (e.getAttribute(css.sesbId) === null) {
		e.setAttribute(css.sesbId, Math.random())
	}
}

async function handleResults(elements) {
	let toSend = []
	for (const e of elements) {
		const urls = getUrls(e)
		for (const u of urls) {
			if (u !== '' && u !== undefined) {
				toSend.push({id: e.getAttribute(css.sesbId), url: u})
			}
		}
	}
	const responses = await browser.runtime.sendMessage({action: actions.check, urls: toSend})
	if (responses !== undefined) {
		addButtons(responses)
	}
}

function shouldHandle(e) {
	if (!e.classList.contains(textResultMobile)) {
		return !e.classList.contains('mnr-c')
			&& !e.classList.contains('g-blk')
			&& !e.classList.contains('gadasb')
			&& !e.parentElement.id.startsWith('WEB_ANSWERS_')
			&& e.querySelector('.xpc\,.kp-wholepage\,.gadasb') === null
			&& !e.parentElement.parentElement.parentElement.parentElement.parentElement.classList.contains(textResult)
	}
	return e.firstElementChild.firstElementChild !== null
		&& e.firstElementChild.firstElementChild.nodeName === 'A'
		&& e.parentElement.parentElement.nodeName !== 'FOOTER'
}

function getUrls(e) {
	let urls = []
	if (e.classList.contains(css.nestedResult) || e.classList.contains(textResultMobile)) {
		let url = e.getElementsByTagName('a')[0].href.replace(regex.urlRegex, '')
		urls.push(url)
		let nestedUrl = e.getElementsByTagName('a')[0].href.match(regex.nestedUrlRegex, '')
		if (nestedUrl !== null) {
			urls.push(nestedUrl[0].replace('=//', '').replace(/\/.*/, ''))
		}
	} else {
		urls.push(e.getElementsByTagName('a')[1].href.replace(regex.urlRegex, ''))
	}
	return urls
}

/*---Add block/unblock buttons---*/

function addButtons(responses) {
	for (const response of responses) {
		let e = document.querySelector('[' + css.sesbId + '="' + response.id + '"]')
		if (response.toRemove === true) {
			e.classList.add(css.blocked)
		}
		let byRemote = response.inRemoteBlocklist !== undefined || response.inRemoteWhitelist !== undefined
		if (response.whitelisted === false && response.inRemoteBlocklist !== undefined && e.querySelector('.' + css.blockedByRemote) === null) {
			addBanner(e, response.inRemoteBlocklist, true)
		} else if (response.inRemoteWhitelist !== undefined && e.querySelector('.' + css.whitelistedByRemote) === null) {
			addBanner(e, response.inRemoteWhitelist, false)
		}
		let blockDiv = e.querySelector('.' + css.blockDiv)
		let unblockDiv = e.querySelector('.' + css.unblockDiv)
		if ((blockDiv === null || !blockDiv.innerText.includes(response.domains)) && response.whitelisted === false) {
			addButton(e, response.domains, true, byRemote, blockDiv !== null)
		}
		if (unblockDiv === null || !unblockDiv.innerText.includes(response.domains)) {
			addButton(e, response.domains, false, byRemote, unblockDiv !== null)
		}
	}
	update()
}

function addBanner(e, listUrl, block) {
	const div = document.createElement('div')
	div.classList.add(block ? css.blockedByRemote : css.whitelistedByRemote)
	div.innerText = (block ? texts.blockedByRemote : texts.whitelistedByRemote) + listUrl
	e.classList.add(css.fixHeight)
	e.classList.toggle(css.fixWidth, e.classList.contains(css.nestedResult))
	e.append(div)
}

function addButton(e, domains, block, byRemote, nested) {
	let div
	const divClass = block ? css.blockDiv : css.unblockDiv
	if (nested) {
		div = e.querySelector('.' + divClass)
	} else {
		div = document.createElement('div')
		div.classList.add(divClass)
		div.classList.add(css.hidden)
		div.innerText = block ? texts.block : texts.unblock
	}
	div.classList.toggle(css.fixWidth, div.classList.contains(css.nestedResult))
	for (let i = domains.length - 1; i >= 0; i--) {
		const button = document.createElement('button')
		if (nested) {
			button.classList.add(css.nested)
		}
		button.innerText = domains[i]
		button.addEventListener('click', function(){updateResults(domains[i], block, byRemote)})
		div.appendChild(button)
	}
	if (!nested) {
		e.classList.add(css.fixHeight)
		e.append(div)
	}
}

async function updateResults(url, block, byRemote) {
	const response = await browser.runtime.sendMessage({action: block ? actions.update : actions.unblock, url: url, mustBeWhitelisted: !block && byRemote})
	for (const e of document.querySelectorAll(allResults)) {
		e.classList.remove(css.blocked, css.blockedShow, css.blockedByRemote, css.whitelistedByRemote, css.fixHeight)
		e.style.height = window.getComputedStyle(e).height
	}
	for (const e of document.querySelectorAll(allButtons)) {
		e.remove()
	}
	done = {}
	scanTextResults()
	scanImageResults()
}
