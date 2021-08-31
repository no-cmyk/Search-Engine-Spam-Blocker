'use strict'
const textResult = 'serp-item'
let updated
const mo = new MutationObserver(onMutation)
mo.observe(document, {subtree: true, childList: true})
document.addEventListener('load', function(){setInterval(redo, 500)}, true)

function redo() {
	for (const n of document.querySelectorAll('.' + textResult)) {
		if (n.tagName === 'LI' && !n.classList.contains(sesbConstants.css.fixHeight) && n.getAttribute('data-fast-name') === null) {
			removeElement(n)
		}
	}
}

function onMutation(mutations) {
	for (const {addedNodes} of mutations) {
		for (const n of addedNodes) {
			if (n.tagName === 'LI' && n.classList.contains(textResult) && n.getAttribute('data-fast-name') === null) {
				removeElement(n)
			}
		}
	}
}

function findAndBlock(response, url) {
	if (response.whitelisted === true) {
		if (confirm('This domain must be removed from your whitelist in order to be blocked.\nDo you want to proceed?')) {
			chrome.runtime.sendMessage({action: sesbConstants.actions.removeFromWhitelistAndUpdate, url: url})
		} else {
			return
		}
	}
	for (const elem of document.querySelectorAll('.' + textResult)) {
		if (elem.classList.contains(sesbConstants.css.fixHeight) && getUrl(elem).endsWith(url)) {
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
	for (const elem of document.querySelectorAll('.' + textResult)) {
		if (elem.classList.contains(sesbConstants.css.fixHeight) && getUrl(elem).endsWith(url)) {
			elem.classList.remove(sesbConstants.css.hidden, sesbConstants.css.blockedShow)
			if (response.showBlocked === 1) {
				elem.getElementsByClassName(sesbConstants.css.blockDiv)[0].classList.remove(sesbConstants.css.hidden)
			}
			elem.getElementsByClassName(sesbConstants.css.unblockDiv)[0].classList.add(sesbConstants.css.hidden)
		}
	}
}

function updateYourBlocklist(url) {
	chrome.runtime.sendMessage({action: sesbConstants.actions.update, url: url}, function(resp){findAndBlock(resp, url)})
}

function unblock(url, isSub) {
	chrome.runtime.sendMessage({action: sesbConstants.actions.unblock, url: url, isSub: isSub}, function(resp){findAndUnblock(resp, url)})
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
	elem.prepend(div)
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
	createUnblockButton(domain, div, elem, false)
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
	return e.getElementsByTagName('a')[0].href.replace(/^http.*:\/\/|\/.*$|:\d+/g, '')
}

async function removeElement(e) {
	const url = getUrl(e)
	if (url === '' || url === undefined) {
		return
	}
	chrome.runtime.sendMessage({action: 'check', url: url}, function(response){
		if (response === undefined) {
			return
		}
		if (response.domain === undefined && updated === undefined) {
			chrome.runtime.sendMessage({action: sesbConstants.actions.updateSpamLists})
			updated = true
			return
		}
		if (response.toRemove === true) {
			e.classList.add(response.showBlocked === 1 ? sesbConstants.css.blockedShow : sesbConstants.css.hidden)
		}
		addBlockButtons(e, url, response.domain, response.privateDomain, response.showButtons, response.showBlocked, response.toRemove)
	})
}
