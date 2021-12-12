'use strict'
let settings
const textResult = 'w-gl__result__main'
const textResultAd = 'z_'
const imgResult = 'image-container'
const allResults = '.' + textResult + '\,.' + textResultAd + '\,.' + imgResult

document.addEventListener('DOMContentLoaded', function(){setTimeout(scanResults, 1500)}, true)

/*---Handle settings---*/

browser.runtime.onMessage.addListener(message => {
	settings = message
	update()
})

async function update() {
	if (settings === undefined) {
		settings = await browser.runtime.sendMessage({action: actions.getActiveSettings})
	}
	for (const e of document.querySelectorAll(allResults)) {
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
	for (const e of document.querySelectorAll(allResults)) {
		handleResult(e)
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
	addBlockButtons(e, url, response.domain, response.privateDomain, response.toRemove)
	addUnblockButtons(e, url, response.domain, response.privateDomain, response.toRemove)
}

function getUrl(e) {
	return e.classList.contains(imgResult) ? e.querySelector('.image-quick-details').lastChild.lastChild.data.replace(regex.urlRegexWithArrow, '') : e.getElementsByTagName('a')[1].href.replace(regex.urlRegexWithArrow, '')
}

/*---Add block/unblock buttons---*/

function addBlockButtons(e, url, domain, privateDomain, toRemove) {
	const div = document.createElement('div')
	div.classList.add(css.blockDiv, css.hidden)
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
	div.classList.add(css.unblockDiv, css.hidden)
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
	button.addEventListener('click', function(event){block(url, event)})
	div.appendChild(button)
}

function createUnblockButton(url, div, e, isSub) {
	const button = document.createElement('button')
	button.innerText = url
	button.addEventListener('click', function(event){unblock(url, isSub, event)})
	div.appendChild(button)
}

/*---Block/unblock search results---*/

function block(url, event) {
	if (event) {
		event.stopPropagation()
	}
	browser.runtime.sendMessage({action: actions.update, url: url}).then((resp) => findAndBlock(resp, url))
}

function unblock(url, isSub, event) {
	if (event) {
		event.stopPropagation()
	}
	browser.runtime.sendMessage({action: actions.unblock, url: url, isSub: isSub}).then((resp) => findAndUnblock(resp, url))
}

function findAndBlock(response, url) {
	if (response.whitelisted === true) {
		if (!confirm(texts.blockAlert)) {
			return
		}
		browser.runtime.sendMessage({action: actions.removeFromWhitelistAndUpdate, url: url})
	}
	for (const e of document.querySelectorAll(allResults)) {
		if (getUrl(e).endsWith(url)) {
			e.classList.add(css.blocked)
		}
	}
	update()
}

function findAndUnblock(response, url) {
	for (const e of document.querySelectorAll(allResults)) {
		if (getUrl(e).endsWith(url)) {
			e.classList.remove(css.blocked)
		}
	}
	update()
}
