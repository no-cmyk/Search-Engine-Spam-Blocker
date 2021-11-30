'use strict'
let updated
let activeSettings
let done = {}
const textResult = 'algo'

document.addEventListener('DOMContentLoaded', function(){setTimeout(scanResults, 500)}, true)

/*---Handle settings---*/

browser.runtime.onMessage.addListener(message => {
	activeSettings = message
	update()
})

async function update() {
	if (activeSettings === undefined) {
		activeSettings = await browser.runtime.sendMessage({action: actions.getActiveSettings})
	}
	if (activeSettings.enabled === 0) {
		return
	}
	for (const e of document.querySelectorAll('.' + textResult)) {
		let blockDiv = e.querySelector('.' + css.blockDiv)
		let unblockDiv = e.querySelector('.' + css.unblockDiv)
		if (blockDiv === null || unblockDiv === null) {
			continue
		}
		if (e.classList.contains(css.blocked)) {
			activeSettings.showBlocked === 1 ? e.classList.add(css.blockedShow) : e.classList.remove(css.blockedShow)
			activeSettings.showBlocked === 1 ? e.classList.remove(css.hidden) : e.classList.add(css.hidden)
			blockDiv.classList.add(css.hidden)
			unblockDiv.classList.remove(css.hidden)
		} else {
			e.classList.remove(css.hidden)
			e.classList.remove(css.blockedShow)
			activeSettings.showButtons === 1 ? blockDiv.classList.remove(css.hidden) : blockDiv.classList.add(css.hidden)
			unblockDiv.classList.add(css.hidden)
		}
	}
	browser.runtime.sendMessage({action: actions.updateBadge, blockedNumber: document.querySelectorAll('.' + css.blocked).length})
}

/*---Scan search results---*/

function scanResults() {
	for (const e of document.querySelectorAll('.' + textResult)) {
		if (!done[e.getAttribute(css.sesbId)]) {
			e.setAttribute(css.sesbId, Math.random())
			done[e.getAttribute(css.sesbId)] = true
			handleResult(e)
		}
	}
	update()
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
	return e.getElementsByTagName('span')[0].innerText.replace(regex.urlRegexWithArrow, '')
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
	e.prepend(div)
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
	e.prepend(div)
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
	for (const e of document.querySelectorAll('.' + textResult)) {
		if (getUrl(e).endsWith(url)) {
			e.classList.add(css.blocked)
		}
	}
	update()
}

function findAndUnblock(response, url) {
	for (const e of document.querySelectorAll('.' + textResult)) {
		if (getUrl(e).endsWith(url)) {
			e.classList.remove(css.blocked)
		}
	}
	update()
}
