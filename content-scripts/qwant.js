'use strict'
let settings
const done = {}
const textResult = 'webResult'
const imgResult = 'imageResult'
const allResults = '[data-testid="' + textResult + '"],[data-testid="' + imgResult + '"]'

document.addEventListener('load', scanResults, true)

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
	setTimeout(function () {
		for (const e of document.querySelectorAll(allResults)) {
			if (!done[e.getAttribute(css.sesbId)]) {
				e.setAttribute(css.sesbId, Math.random())
				done[e.getAttribute(css.sesbId)] = true
				handleResult(e)
			}
		}
		update()
	}, 1500)
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
	return e.getAttribute('data-testid') === textResult ? e.getAttribute('domain').replace(regex.urlRegex, '') : e.querySelector('cite').textContent.replace(regex.urlRegex, '')
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
	e.querySelector('[class^="WebResult-module__subContainer"],[class^="Card-module__Card___"]').prepend(div)
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
	e.querySelector('[class^="WebResult-module__subContainer"],[class^="Card-module__Card___"]').prepend(div)
}

function createBlockButton(url, div, e) {
	const button = document.createElement('button')
	button.innerText = url
	button.addEventListener('click', function(event){block(event, url)})
	div.appendChild(button)
}

function createUnblockButton(url, div, e, isSub) {
	const button = document.createElement('button')
	button.innerText = url
	button.addEventListener('click', function(event){unblock(event, url, isSub)})
	div.appendChild(button)
}

/*---Block/unblock search results---*/

function block(event, url) {
	event.stopPropagation()
	event.preventDefault()
	browser.runtime.sendMessage({action: actions.update, url: url}).then((resp) => findAndBlock(resp, url))
}

function unblock(event, url, isSub) {
	event.stopPropagation()
	event.preventDefault()
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