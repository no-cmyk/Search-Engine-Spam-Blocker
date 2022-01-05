'use strict'
let settings
let done = {}
const textResult = 'algo'

document.addEventListener('DOMContentLoaded', function(){setTimeout(scanResults, 500)}, true)

/*---Handle settings---*/

browser.runtime.onMessage.addListener(message => {
	settings = message
	update()
})

async function update() {
	if (settings === undefined) {
		settings = await browser.runtime.sendMessage({action: actions.getActiveSettings})
	}
	for (const e of document.querySelectorAll('.' + textResult)) {
		let blockDiv = e.querySelector('.' + css.blockDiv)
		let unblockDiv = e.querySelector('.' + css.unblockDiv)
		if (blockDiv === null || unblockDiv === null) {
			continue
		}
		if (settings.enabled === 0) {
			e.classList.remove(css.hidden, css.blockedShow)
			blockDiv.classList.add(css.hidden)
			unblockDiv.classList.add(css.hidden)
		} else if (e.classList.contains(css.blocked)) {
			settings.showBlocked === 1 ? (e.classList.remove(css.hidden), e.classList.add(css.blockedShow)) : (e.classList.remove(css.blockedShow), e.classList.add(css.hidden))
			blockDiv.classList.add(css.hidden)
			unblockDiv.classList.remove(css.hidden)
		} else {
			e.classList.remove(css.hidden, css.blockedShow)
			blockDiv.classList.toggle(css.hidden, settings.showButtons === 0)
			unblockDiv.classList.add(css.hidden)
		}
	}
	browser.runtime.sendMessage({action: actions.updateBadge, blockedNumber: settings.enabled === 1 ? document.querySelectorAll('.' + css.blocked).length : 0})
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
	if (response.toRemove === true) {
		e.classList.add(css.blocked)
	}
	addBlockButtons(e, response.domains, response.toRemove)
	addUnblockButtons(e, response.domains, response.toRemove)
}

function getUrl(e) {
	return e.getElementsByTagName('span')[0].innerText.replace(regex.urlRegexWithArrow, '')
}

/*---Add block/unblock buttons---*/

function addBlockButtons(e, domains, toRemove) {
	const div = document.createElement('div')
	div.classList.add(css.blockDiv, css.hidden)
	div.innerText = texts.block
	for (let i = domains.length - 1; i >= 0; i--) {
		createBlockButton(domains[i], div, e)
	}
	e.prepend(div)
}

function addUnblockButtons(e, domains, toRemove) {
	const div = document.createElement('div')
	div.classList.add(css.unblockDiv, css.hidden)
	div.innerText = texts.unblock
	for (let i = domains.length - 1; i >= 0; i--) {
		createUnblockButton(domains[i], div, e, i !== 0)
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
