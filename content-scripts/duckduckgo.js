'use strict'
let settings
let done = {}
const textResult = 'ARTICLE'
const imgResult = 'tile--img'
const allResults = textResult + '\,.' + imgResult
const allButtons = '.' + css.blockDiv + '\,.' + css.unblockDiv + '\,.' + css.blockedByRemote + '\,.' + css.whitelistedByRemote

document.addEventListener('load', scanResults, true)

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
			if (settings.showBlocked === 1) {
				e.style.setProperty('background', 'lightcoral', 'important')
				e.classList.remove(css.hidden)
				e.classList.add(css.blockedShow)
			} else {
				e.classList.remove(css.blockedShow)
				e.classList.add(css.hidden)
			}
			if (blockDiv !== null) {
				blockDiv.classList.add(css.hidden)
				unblockDiv.classList.remove(css.hidden)
			}
		} else {
			e.style.removeProperty('background')
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

function scanResults() {
	let elements = []
	for (const e of document.querySelectorAll(allResults)) {
		if (e.getAttribute(css.sesbId) === null) {
			e.setAttribute(css.sesbId, Math.random())
		}
		if (!done[e.getAttribute(css.sesbId)]) {
			e.setAttribute(css.sesbId, Math.random())
			done[e.getAttribute(css.sesbId)] = true
			elements.push(e)
		}
	}
	handleResults(elements)
}

async function handleResults(elements) {
	let toSend = []
	for (const e of elements) {
		const url = getUrl(e)
		if (url !== '' && url !== undefined) {
			toSend.push({id: e.getAttribute(css.sesbId), url: url})
		}
	}
	const responses = await browser.runtime.sendMessage({action: actions.check, urls: toSend})
	if (responses !== undefined) {
		addButtons(responses)
	}
}

function getUrl(e) {
	return e.tagName === textResult ?
		e.querySelectorAll('a')[1].href.replace(regex.urlRegex, '')
		: e.querySelector('.tile--img__sub').href.replace(regex.urlRegex, '')
}

/*---Add block/unblock buttons---*/

function addButtons(responses) {
	for (const response of responses) {
		let e = document.querySelector('[' + css.sesbId + '="' + response.id + '"]')
		e.classList.toggle(css.blocked, response.toRemove === true)
		let byRemote = response.inRemoteBlocklist !== undefined || response.inRemoteWhitelist !== undefined
		if (response.whitelisted === false && response.inRemoteBlocklist !== undefined && e.querySelector('.' + css.blockedByRemote) === null) {
			addBanner(e, response.inRemoteBlocklist, true)
		} else if (response.inRemoteWhitelist !== undefined && e.querySelector('.' + css.whitelistedByRemote) === null) {
			addBanner(e, response.inRemoteWhitelist, false)
		}
		if (e.querySelector('.' + css.blockDiv) === null && response.whitelisted === false) {
			addButton(e, response.domains, true, byRemote)
		}
		if (e.querySelector('.' + css.unblockDiv) === null) {
			addButton(e, response.domains, false, byRemote)
		}
	}
	update()
}

function addBanner(e, listUrl, block) {
	const div = document.createElement('div')
	div.classList.add(block ? css.blockedByRemote : css.whitelistedByRemote)
	div.innerText = (block ? texts.blockedByRemote : texts.whitelistedByRemote) + listUrl
	e.classList.add(css.fixHeight)
	e.append(div)
}

function addButton(e, domains, block, byRemote) {
	const div = document.createElement('div')
	div.classList.add(block ? css.blockDiv : css.unblockDiv)
	div.classList.add(css.hidden)
	div.innerText = block ? texts.block : texts.unblock
	for (let i = domains.length - 1; i >= 0; i--) {
		const button = document.createElement('button')
		button.innerText = domains[i]
		button.addEventListener('click', function(event){updateResults(domains[i], block, event, byRemote)})
		div.appendChild(button)
	}
	e.classList.add(css.fixHeight)
	e.tagName === textResult ? e.prepend(div) : fixDimensions(e, div)
}

function fixDimensions(e, div) {
	const dim = e.querySelectorAll('.tile--img__dimensions')[1]
	const sub = e.querySelector('.tile--img__sub')
	dim.remove()
	e.insertBefore(dim, sub)
	dim.classList.add(css.fixImageSize)
	e.appendChild(div)
}

async function updateResults(url, block, event, byRemote) {
	event.stopPropagation()
	const response = await browser.runtime.sendMessage({action: block ? actions.update : actions.unblock, url: url, mustBeWhitelisted: !block && byRemote})
	window.onscroll = function(){window.scrollTo(window.scrollX, window.scrollY)}
	for (const e of document.querySelectorAll(allResults)) {
		e.classList.remove(css.blocked, css.blockedShow, css.blockedByRemote, css.whitelistedByRemote)
	}
	for (const e of document.querySelectorAll(allButtons)) {
		e.remove()
	}
	done = {}
	scanResults()
	window.onscroll = function(){}
}
