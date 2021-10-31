'use strict'
const textResult = 'g'
const imgResult = 'isv-r'
let updated
const imgDone = {}
document.addEventListener('DOMContentLoaded', initial, true)
document.addEventListener('load', redo, true)

function redo() {
	for (const n of document.querySelectorAll('.' + imgResult)) {
		if (!imgDone[n.getAttribute('data-id')]) {
			removeElement(n)
			imgDone[n.getAttribute('data-id')] = true
		}
	}
}

function initial() {
	for (const n of document.querySelectorAll('.' + textResult)) {
		if (n.getElementsByClassName(textResult).length === 0
			&& !n.classList.contains('mnr-c')
			&& !n.classList.contains('g-blk')) {
			removeElement(n)
		}
	}
}

function findAndBlock(response, url) {
	if (response.whitelisted === true) {
		if (confirm('This domain must be removed from your whitelist in order to be blocked.\nDo you want to proceed?')) {
			browser.runtime.sendMessage({action: sesbConstants.actions.removeFromWhitelistAndUpdate, url: url})
		} else {
			return
		}
	}
	for (const elem of document.querySelectorAll('.' + textResult + '\,.' + imgResult)) {
		if (getUrl(elem).endsWith(url)) {
			elem.getElementsByClassName(sesbConstants.css.blockDiv)[0].classList.add(sesbConstants.css.hidden)
			if (response.showBlocked === 1) {
				elem.classList.add(sesbConstants.css.blockedShow)
				elem.getElementsByClassName(sesbConstants.css.unblockDiv)[0].classList.remove(sesbConstants.css.hidden)
			} else {
				elem.classList.add(sesbConstants.css.hidden)
			}
		}
	}
}

function findAndUnblock(response, url) {
	for (const elem of document.querySelectorAll('.' + textResult + '\,.' + imgResult)) {
		if (getUrl(elem).endsWith(url)) {
			elem.classList.remove(sesbConstants.css.hidden, sesbConstants.css.blockedShow)
			if (response.showBlocked === 1) {
				elem.getElementsByClassName(sesbConstants.css.blockDiv)[0].classList.remove(sesbConstants.css.hidden)
			}
			elem.getElementsByClassName(sesbConstants.css.unblockDiv)[0].classList.add(sesbConstants.css.hidden)
		}
	}
}

function updateYourBlocklist(url) {
	browser.runtime.sendMessage({action: sesbConstants.actions.update, url: url}).then((resp) => findAndBlock(resp, url))
}

function unblock(url, isSub) {
	browser.runtime.sendMessage({action: sesbConstants.actions.unblock, url: url, isSub: isSub}).then((resp) => findAndUnblock(resp, url))
}

function createBlockButton(url, div, elem) {
	const button = document.createElement('button')
	button.innerText = url
	button.title = 'Block ' + url + '?'
	button.addEventListener('click', function(){updateYourBlocklist(url)})
	div.appendChild(button)
}

function addBlockButtons(elem, url, domain, privateDomain, showButtons, showBlocked, toRemove) {
	const div = document.createElement('div')
	div.classList.add(sesbConstants.css.blockDiv)
	div.innerHTML = 'Block '
	if (showButtons !== 1 || toRemove === true) {
		div.classList.add(sesbConstants.css.hidden)
	}
	if (showBlocked === 1) {
		addUnblockButtons(elem, url, domain, privateDomain, showBlocked, toRemove)
	}
	if (domain !== undefined) {
		createBlockButton(domain, div, elem)
	}
	if (privateDomain !== undefined && privateDomain !== url) {
		createBlockButton(privateDomain, div, elem)
	}
	if (url !== domain) {
		createBlockButton(url, div, elem)
	}
	elem.classList.add(sesbConstants.css.fixHeight)
	elem.append(div)
}

function createUnblockButton(url, div, elem, isSub) {
	const button = document.createElement('button')
	button.innerText = url
	button.title = 'Unblock ' + url + '?'
	button.addEventListener('click', function(){unblock(url, isSub)})
	div.appendChild(button)
}

function addUnblockButtons(elem, url, domain, privateDomain, showButtons, toRemove) {
	const div = document.createElement('div')
	div.classList.add(sesbConstants.css.unblockDiv)
	div.innerHTML = 'Unblock '
	if (showButtons !== 1 || toRemove !== true) {
		div.classList.add(sesbConstants.css.hidden)
	}
	if (domain !== undefined) {
		createUnblockButton(domain, div, elem, false)
	}
	if (privateDomain !== undefined && privateDomain !== url) {
		createUnblockButton(privateDomain, div, elem, false)
	}
	if (url !== domain) {
		createUnblockButton(url, div, elem, true)
	}
	elem.classList.add(sesbConstants.css.fixHeight)
	elem.append(div)
}

function getUrl(e) {
	return e.getElementsByTagName('a')[e.classList.contains(textResult) ? 0 : 1].href.replace(/^http.*:\/\/|\/.*$|:\d+/g, '')
}

async function removeElement(e) {
	const url = getUrl(e)
	if (url === '' || url === undefined) {
		return
	}
	const response = await browser.runtime.sendMessage({action: sesbConstants.actions.check, url: url})
	if (response === undefined) {
		return
	}
	if (response.domain === undefined && updated === undefined) {
		browser.runtime.sendMessage({action: sesbConstants.actions.updateSpamLists})
		updated = true
		return
	}
	if (response.toRemove === true) {
		e.classList.add(response.showBlocked === 1 ? sesbConstants.css.blockedShow : sesbConstants.css.hidden)
	}
	addBlockButtons(e, url, response.domain, response.privateDomain, response.showButtons, response.showBlocked, response.toRemove)
}
