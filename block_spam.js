const textResult = '.g';
const imgResult = '.isv-r';
const mo = new MutationObserver(onMutation);
onMutation([{addedNodes:[document.documentElement]}]).then(observe());

async function onMutation(mutations) {
	for (const {addedNodes} of mutations) {
		for (const n of addedNodes) {
			if (n.tagName) {
				if (n.matches(textResult)) {
					removeElement(n, 0);
				} else if (n.matches(imgResult)) {
					removeElement(n, 1);
				}
			}
		}
	}
}

function observe() {
	mo.observe(document, {
		subtree: true,
		childList: true,
	});
}

async function removeElement(e, pos) {
	var url = e.getElementsByTagName('a')[pos].href.replace(/^http.*:\/\/|\/.*$/g, '');
	var toRemove = await browser.runtime.sendMessage(url);
	if (toRemove === true) {
		e.remove();
	}
}