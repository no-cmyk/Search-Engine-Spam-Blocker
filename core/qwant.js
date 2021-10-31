'use strict'
const textResult = 'webResult'
const imgResult = 'imageResult'
let updated
const done = {}
document.addEventListener('load', redo, true)

function redo() {
	setTimeout(function () {
		for (const n of document.querySelectorAll('[data-testid="' + textResult + '"],[data-testid="' + imgResult + '"]')) {
			if (!done[n.getAttribute('sesb-id')]) {
				n.setAttribute('sesb-id', 'sesb' + Math.random())
				done[n.getAttribute('sesb-id')] = true
				removeElement(n)
			}
		}
	}, 500)
}

function findAndBlock(response, url) {
	if (response.whitelisted === true) {
		if (confirm('This domain must be removed from your whitelist in order to be blocked.\nDo you want to proceed?')) {
			browser.runtime.sendMessage({action: sesbConstants.actions.removeFromWhitelistAndUpdate, url: url})
		} else {
			return
		}
	}
	for (const elem of document.querySelectorAll('[data-testid="' + textResult + '"],[data-testid="' + imgResult + '"]')) {
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
	for (const elem of document.querySelectorAll('[data-testid="' + textResult + '"],[data-testid="' + imgResult + '"]')) {
		if (getUrl(elem).endsWith(url)) {
			elem.classList.remove(sesbConstants.css.hidden, sesbConstants.css.blockedShow)
			if (response.showBlocked === 1) {
				elem.getElementsByClassName(sesbConstants.css.blockDiv)[0].classList.remove(sesbConstants.css.hidden)
			}
			elem.getElementsByClassName(sesbConstants.css.unblockDiv)[0].classList.add(sesbConstants.css.hidden)
		}
	}
}

function updateYourBlocklist(event, url) {
	event.stopPropagation()
	event.preventDefault()
	browser.runtime.sendMessage({action: sesbConstants.actions.update, url: url}).then((resp) => findAndBlock(resp, url))
}

function unblock(event, url, isSub) {
	event.stopPropagation()
	event.preventDefault()
	browser.runtime.sendMessage({action: sesbConstants.actions.unblock, url: url, isSub: isSub}).then((resp) => findAndUnblock(resp, url))
}

function createBlockButton(url, div, elem) {
	const button = document.createElement('button')
	button.innerText = url
	button.title = 'Block ' + url + '?'
	button.addEventListener('click', function(event){updateYourBlocklist(event, url)})
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
	elem.prepend(div)
}

function createUnblockButton(url, div, elem, isSub) {
	const button = document.createElement('button')
	button.innerText = url
	button.title = 'Unblock ' + url + '?'
	button.addEventListener('click', function(event){unblock(event, url, isSub)})
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
	elem.prepend(div)
}

function getUrl(e) {
	return e.getAttribute('data-testid') === textResult ?
	e.getAttribute('domain').replace(/^http.*:\/\/|\/.*$|:\d+/g, '')
	: e.querySelector('cite').textContent.replace(/^http.*:\/\/|\/.*$|:\d+/g, '')
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
