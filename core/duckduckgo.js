'use strict'
let updated
let blockedNumber = 0
const done = {}
const textResult = 'result--url-above-snippet'
const imgResult = 'tile--img'

/*---Scan search results---*/

document.addEventListener('load', scanResults, true)

function scanResults() {
	for (const e of document.querySelectorAll('.' + textResult + '\,.' + imgResult)) {
		if (!done[e.getAttribute(css.sesbId)]) {
			e.setAttribute(css.sesbId, Math.random())
			done[e.getAttribute(css.sesbId)] = true
			handleResult(e)
		}
	}
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
		blockedNumber++
		e.classList.add(response.showBlocked === 1 ? css.blockedShow : css.hidden)
	}
	addBlockButtons(e, url, response.domain, response.privateDomain, response.showButtons, response.showBlocked, response.toRemove)
}

function getUrl(e) {
	return e.classList.contains(textResult) ?
		e.getAttribute('data-domain').replace(regex.urlRegex, '')
		: e.querySelector('.tile--img__sub').href.replace(regex.urlRegex, '')
}

/*---Add block/unblock buttons---*/

function addBlockButtons(e, url, domain, privateDomain, showButtons, showBlocked, toRemove) {
	const div = document.createElement('div')
	div.classList.add(css.blockDiv)
	div.innerText = texts.block
	if (showButtons !== 1 || toRemove === true) {
		div.classList.add(css.hidden)
	}
	if (showBlocked === 1) {
		addUnblockButtons(e, url, domain, privateDomain, showBlocked, toRemove)
	}
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
	e.classList.contains(textResult) ? e.prepend(div) : fixDimensions(e, div)
}

function addUnblockButtons(e, url, domain, privateDomain, showButtons, toRemove) {
	const div = document.createElement('div')
	div.classList.add(css.unblockDiv)
	div.innerText = texts.unblock
	if (showButtons !== 1 || toRemove !== true) {
		div.classList.add(css.hidden)
	}
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
	e.classList.contains(textResult) ? e.prepend(div) : fixDimensions(e, div)
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

function fixDimensions(e, div) {
	const dim = e.querySelectorAll('.tile--img__dimensions')[1]
	const sub = e.querySelector('.tile--img__sub')
	dim.remove()
	e.insertBefore(dim, sub)
	dim.classList.add(css.fixImageSize)
	e.appendChild(div)
}

/*---Block/unblock search results---*/

function block(event, url) {
	event.stopPropagation()
	browser.runtime.sendMessage({action: actions.update, url: url}).then((resp) => findAndBlock(resp, url))
}

function unblock(event, url, isSub) {
	event.stopPropagation()
	browser.runtime.sendMessage({action: actions.unblock, url: url, isSub: isSub}).then((resp) => findAndUnblock(resp, url))
}

function findAndBlock(response, url) {
	if (response.whitelisted === true) {
		if (!confirm(texts.blockAlert)) {
			return
		}
		browser.runtime.sendMessage({action: actions.removeFromWhitelistAndUpdate, url: url})
	}
	for (const e of document.querySelectorAll('.' + textResult + '\,.' + imgResult)) {
		if (getUrl(e).endsWith(url)) {
			blockedNumber++
			e.querySelector('.' + css.blockDiv).classList.add(css.hidden)
			if (response.showBlocked === 1) {
				e.classList.add(css.blockedShow)
				e.querySelector('.' + css.unblockDiv).classList.remove(css.hidden)
			} else {
				e.classList.add(css.hidden)
			}
		}
	}
}

function findAndUnblock(response, url) {
	for (const e of document.querySelectorAll('.' + textResult + '\,.' + imgResult)) {
		if (getUrl(e).endsWith(url)) {
			blockedNumber--
			e.classList.remove(css.hidden, css.blockedShow)
			if (response.showButtons === 1) {
				e.querySelector('.' + css.blockDiv).classList.remove(css.hidden)
			}
			e.querySelector('.' + css.unblockDiv).classList.add(css.hidden)
		}
	}
}