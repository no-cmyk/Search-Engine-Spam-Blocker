const textResult = '.g'
const imgResult = '.isv-r'
const mo = new MutationObserver(onMutation)
observe()

const done = {}
function onMutation(mutations) {
	for (const {addedNodes} of mutations) {
		for (const n of addedNodes) {
			if (n.tagName === 'DIV') {
				if (n.matches(textResult)) {
					removeElement(n, 0)
				} else if (n.matches(imgResult) && !done[n.getAttribute('data-id')]) {
					removeElement(n, 1)
					done[n.getAttribute('data-id')] = true
				}
			}
		}
	}
}

function observe() {
	mo.observe(document, {
		subtree: true,
		childList: true,
	})
}

function getClassToAdd(showBlocked) {
	return showBlocked === 1 ? 'sesb-blocked-show' : 'sesb-hidden'
}

function findAndReplace(response, url) {
	const classToAdd = getClassToAdd(response.showBlocked)
	document.querySelectorAll(textResult + '\,' + imgResult).forEach(
		function(elem) {
			const pos = elem.classList.contains('g') ? 0 : 1
			const elemUrl = getUrl(elem, pos)
			if (elemUrl.endsWith(url)) {
				elem.getElementsByClassName('sesb-block-div')[0].classList.add('sesb-hidden')
				elem.classList.add(classToAdd)
			}
		}
	)
}

async function updateYourBlocklist(url) {
	const response = await browser.runtime.sendMessage({action: 'update', url: url}).then((resp) => findAndReplace(resp, url))
}

function createButton(url, div, elem) {
	const blockBtn = document.createElement('button')
	blockBtn.innerText = url
	blockBtn.title = 'Block ' + url + '?'
	blockBtn.classList.add('sesb-block-button')
	blockBtn.addEventListener('click', function() {
		updateYourBlocklist(url)
	})
	div.appendChild(blockBtn)
}

function addButtons(elem, url, domain, showButtons) {
	const div = document.createElement('div')
	div.classList.add('sesb-block-div')
	if (showButtons !== 1) {
		div.classList.add('sesb-hidden')
	}
	div.innerHTML = 'Block '
	createButton(domain, div, elem)
	if (url !== domain && !url.startsWith('www.')) {
		createButton(url, div, elem)
	}
	elem.style.removeProperty('height')
	elem.classList.contains('g') ? elem.prepend(div) : elem.append(div)
}

function getUrl(e, pos) {
	return e.getElementsByTagName('a')[pos].href.replace(/^http.*:\/\/|\/.*$/g, '')
}

async function removeElement(e, pos) {
	const url = getUrl(e, pos)
	const response = await browser.runtime.sendMessage({action: 'check', url: url}).catch((e) => console.error(e))
	if (response.toRemove === true) {
		const classToAdd = getClassToAdd(response.showBlocked)
		e.classList.add(classToAdd)
	} else {
		addButtons(e, url, response.domain, response.showButtons)
	}
}
