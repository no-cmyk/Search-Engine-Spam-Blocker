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

async function updateYourBlocklist(url, e) {
	const response = await browser.runtime.sendMessage({action: 'update', url: url})
	if (response.showResults === true) {
		e.style.backgroundColor = 'lightcoral'
	} else {
		e.style.display = 'none'
	}
}

function createButton(url, div) {
	const blockBtn = document.createElement('button')
	blockBtn.innerText = url
	blockBtn.title = 'Block ' + url + '?'
	blockBtn.style.cursor = 'pointer'
	blockBtn.style.background = 'none'
	blockBtn.style.border = 'none'
	blockBtn.style.color = 'darkred'
	blockBtn.addEventListener('click', function() {
		updateYourBlocklist(url, elem)
	})
	blockBtn.addEventListener('mouseover', function() {
		blockBtn.style.fontWeight = 'bold'
	})
	blockBtn.addEventListener('mouseout', function() {
		blockBtn.style.fontWeight = 'normal'
	})
	div.appendChild(blockBtn)
}

function addButtons(elem, url, domain) {
	const div = document.createElement('div')
	div.style.color = 'crimson'
	div.innerHTML = '<b>Block:</b>'
	createButton(domain, div)
	if (url !== domain && !url.startsWith('www.')) {
		createButton(url, div)
	}
	elem.style.height = ''
	elem.appendChild(div)
}

async function removeElement(e, pos) {
	const url = e.getElementsByTagName('a')[pos].href.replace(/^http.*:\/\/|\/.*$/g, '')
	const response = await browser.runtime.sendMessage({action: 'check', url: url}).catch((e) => console.log(e))
	if (response.toRemove === false && response.addBlockButtons === 1) {
		addButtons(e, url, response.domain)
	} else if (response.toRemove === true) {
		if (response.showResults === 1) {
			e.style.backgroundColor = 'lightcoral'
		} else {
			e.style.display = 'none'
		}
	}
}
