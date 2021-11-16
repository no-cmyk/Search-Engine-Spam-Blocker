'use strict'
let updated
let activeSettings = {}
const imgDone = {}
const textResult = 'g'
const textResultMobile = 'xpd'
const imgResult = 'isv-r'

/*---Scan search results---*/

document.addEventListener('DOMContentLoaded', scanTextResults, true)
document.addEventListener('load', scanImageResults, true)
setInterval(update, 2000)

async function update(manual) {
	if (!manual) {
		const newActiveSettings = await browser.runtime.sendMessage({action: actions.updateBadge, blockedNumber: document.querySelectorAll('.' + css.blocked).length})
		if (newActiveSettings === activeSettings) {
			return
		}
		activeSettings = newActiveSettings
	}
	if (activeSettings.enabled === 0) {
		return
	}
	for (const e of document.querySelectorAll('.' + textResult + '\,.' + textResultMobile + '\,.' + imgResult)) {
		if (!shouldHandle(e)) {
			continue
		}
		if (e.classList.contains(css.blocked)) {
			activeSettings.showBlocked === 1 ? e.classList.add(css.blockedShow) : e.classList.remove(css.blockedShow)
			activeSettings.showBlocked === 1 ? e.classList.remove(css.hidden) : e.classList.add(css.hidden)
		} else {
			e.classList.remove(css.hidden)
			e.classList.remove(css.blockedShow)
		}
		if (e.classList.contains(css.blocked)) {
			e.querySelector('.' + css.blockDiv).classList.add(css.hidden)
			e.querySelector('.' + css.unblockDiv).classList.remove(css.hidden)
		} else if (activeSettings.showButtons === 1) {
			e.querySelector('.' + css.blockDiv).classList.remove(css.hidden)
			e.querySelector('.' + css.unblockDiv).classList.add(css.hidden)
		} else {
			e.querySelector('.' + css.blockDiv).classList.add(css.hidden)
			e.querySelector('.' + css.unblockDiv).classList.add(css.hidden)
		}
	}
}

function scanTextResults() {
	for (const e of document.querySelectorAll('.' + textResult + '\,.' + textResultMobile)) {
		if (shouldHandle(e) && e.querySelectorAll('.' + textResult + '\,.' + textResultMobile).length === 0) {
			handleResult(e)
		}
	}
	update(false)
}

function shouldHandle(e) {
	if (!e.classList.contains(textResultMobile)) {
		return !e.classList.contains('mnr-c')
		&& !e.classList.contains('g-blk')
		&& !e.parentElement.id.startsWith('WEB_ANSWERS_')
		&& e.querySelectorAll('.xpc\,.kp-wholepage').length === 0
	}
	return e.firstElementChild.firstElementChild !== null
	&& e.firstElementChild.firstElementChild.nodeName === 'A' 
	&& e.parentElement.parentElement.nodeName !== 'FOOTER'
}

function scanImageResults() {
	for (const e of document.querySelectorAll('.' + imgResult)) {
		if (!imgDone[e.getAttribute(css.sesbId)]) {
			e.setAttribute(css.sesbId, Math.random())
			imgDone[e.getAttribute(css.sesbId)] = true
			handleResult(e)
		}
	}
	update(false)
}

async function handleResult(e) {
	const url = getUrl(e)
	if (url === '' || url === undefined) {
		return
	}
	const response = await browser.runtime.sendMessage({action: actions.check, url: url})
	if (response === undefined) {
		return
	}
	if (response.domain === undefined && updated === undefined) {
		browser.runtime.sendMessage({action: actions.updateSpamLists})
		updated = true
		return
	}
	if (response.toRemove === true) {
		e.classList.add(css.blocked)
	}
	addBlockButtons(e, url, response.domain, response.privateDomain, response.toRemove)
	addUnblockButtons(e, url, response.domain, response.privateDomain, response.toRemove)
}

function getUrl(e) {
	return e.getElementsByTagName('a')[e.classList.contains(textResult) || e.classList.contains(textResultMobile) ? 0 : 1].href.replace(regex.urlRegex, '')
}

/*---Add block/unblock buttons---*/

function addBlockButtons(e, url, domain, privateDomain, toRemove) {
	const div = document.createElement('div')
	div.classList.add(css.blockDiv)
	div.classList.add(css.hidden)
	div.innerText = texts.block
	if (domain !== undefined) {
		createBlockButton(domain, div, e)
	}
	if (privateDomain !== undefined && privateDomain !== url) {
		createBlockButton(privateDomain, div, e)
	}
	if (url !== domain) {
		createBlockButton(url, div, e)
	}
	e.classList.add(css.fixHeight)
	e.append(div)
}

function addUnblockButtons(e, url, domain, privateDomain, toRemove) {
	const div = document.createElement('div')
	div.classList.add(css.unblockDiv)
	div.classList.add(css.hidden)
	div.innerText = texts.unblock
	if (domain !== undefined) {
		createUnblockButton(domain, div, e, false)
	}
	if (privateDomain !== undefined && privateDomain !== url) {
		createUnblockButton(privateDomain, div, e, false)
	}
	if (url !== domain) {
		createUnblockButton(url, div, e, true)
	}
	e.classList.add(css.fixHeight)
	e.append(div)
}

function createBlockButton(url, div, e) {
	const button = document.createElement('button')
	button.innerText = url
	button.addEventListener('click', function(){browser.runtime.sendMessage({action: actions.update, url: url}).then((resp) => findAndBlock(resp, url))})
	div.appendChild(button)
}

function createUnblockButton(url, div, e, isSub) {
	const button = document.createElement('button')
	button.innerText = url
	button.addEventListener('click', function(){browser.runtime.sendMessage({action: actions.unblock, url: url, isSub: isSub}).then((resp) => findAndUnblock(resp, url))})
	div.appendChild(button)
}

/*---Block/unblock search results---*/

function findAndBlock(response, url) {
	if (response.whitelisted === true) {
		if (!confirm(texts.blockAlert)) {
			return
		}
		browser.runtime.sendMessage({action: actions.removeFromWhitelistAndUpdate, url: url})
	}
	for (const e of document.querySelectorAll('.' + textResult + '\,.' + imgResult + '\,.' + textResultMobile)) {
		if (getUrl(e).endsWith(url) && shouldHandle(e)) {
			e.classList.add(css.blocked)
			update(true)
		}
	}
}

function findAndUnblock(response, url) {
	for (const e of document.querySelectorAll('.' + textResult + '\,.' + imgResult + '\,.' + textResultMobile)) {
		if (getUrl(e).endsWith(url) && shouldHandle(e)) {
			e.classList.remove(css.blocked)
			update(true)
		}
	}
}
