'use strict'
let settings
let done = {}
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
		let byRemote = e.querySelector('.' + css.byRemote)
		if ((blockDiv === null || unblockDiv === null) && byRemote === null) {
			continue
		} else if (byRemote !== null) {
			byRemote.classList.toggle(css.hidden, settings.enabled === 0 || settings.showButtons === 0)
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
			if (blockDiv !== null) {
				blockDiv.classList.toggle(css.hidden, settings.showButtons === 0)
				unblockDiv.classList.add(css.hidden)
			}
		}
	}
	browser.runtime.sendMessage({action: actions.updateBadge, blockedNumber: settings.enabled === 1 ? document.querySelectorAll('.' + css.blocked).length : 0})
}

/*---Scan search results---*/

function scanResults() {
	setTimeout(function () {
		for (const e of document.querySelectorAll(allResults)) {
			if (e.getAttribute(css.sesbId) === null) {
				e.setAttribute(css.sesbId, Math.random())
			}
			if (!done[e.getAttribute(css.sesbId)]) {
				e.setAttribute(css.sesbId, Math.random())
				done[e.getAttribute(css.sesbId)] = true
				handleResult(e)
			}
		}
		update()
	}, 2000)
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
	e.classList.toggle(css.blocked, response.toRemove === true)
	if (response.inRemoteBlocklist !== undefined) {
		addBanner(e, response.inRemoteBlocklist, true)
		return
	} else if (response.inRemoteWhitelist !== undefined) {
		addBanner(e, response.inRemoteWhitelist, false)
		return
	}
	if (e.querySelector('.' + css.blockDiv) === null && response.whitelisted === false) {
		addButton(e, response.domains, true)
	}
	if (e.querySelector('.' + css.unblockDiv) === null) {
		addButton(e, response.domains, false)
	}
}

function getUrl(e) {
	return e.getAttribute('data-testid') === textResult ? e.getAttribute('domain').replace(regex.urlRegex, '') : e.querySelector('cite').textContent.replace(regex.urlRegex, '')
}

/*---Add block/unblock buttons---*/

function addBanner(e, listUrl, block) {
	const div = document.createElement('div')
	div.classList.add(css.byRemote)
	div.innerText = (block ? texts.blockedByRemote : texts.whitelistedByRemote) + listUrl
	e.classList.add(css.fixHeight)
	e.append(div)
}

function addButton(e, domains, block) {
	const div = document.createElement('div')
	div.classList.add(block ? css.blockDiv : css.unblockDiv)
	div.classList.add(css.hidden)
	div.innerText = block ? texts.block : texts.unblock
	for (let i = domains.length - 1; i >= 0; i--) {
		const button = document.createElement('button')
		button.innerText = domains[i]
		button.addEventListener('click', function(event){updateResults(domains[i], block, event)})
		div.appendChild(button)
	}
	e.querySelector('[class^="WebResult-module__subContainer"],[class^="Card-module__Card___"]').prepend(div)
}

async function updateResults(url, block, event) {
	event.stopPropagation()
	event.preventDefault()
	const response = await browser.runtime.sendMessage({action: block ? actions.update : actions.unblock, url: url})
	if (block === false) {
		for (const e of document.querySelectorAll(allResults)) {
			e.classList.remove(css.blocked, css.blockedShow)
		}
	}
	done = {}
	scanResults()
	setTimeout(update, 200)
}
