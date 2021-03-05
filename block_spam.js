const textResult = '.g';
const imgResult = '.isv-r';
const mo = new MutationObserver(onMutation);
observe();

var done = {};
function onMutation(mutations) {
	for (const {addedNodes} of mutations) {
		for (const n of addedNodes) {
			if (n.tagName === 'DIV') {
				if (n.matches(textResult)) {
					removeElement(n, 0);
				} else if (n.matches(imgResult) && !done[n.getAttribute("data-id")]) {
					removeElement(n, 1);
					done[n.getAttribute("data-id")] = true;
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

function updateYourBlocklist(url, e) {
	browser.runtime.sendMessage({action: "update", url: url});
	if (showResults === true) {
		e.style.backgroundColor = "lightcoral";
		e.style.border = "3px solid lightcoral";
		e.style.opacity = "0.7";
	} else {
		e.remove();
	}
}

function addButtons(elem, url, domain) {
	elem.style.display = "inline-table";
	var div = document.createElement("div");
	div.innerHTML = "<b>Block: </b>";
	var blockBtn = document.createElement("button");
	blockBtn.innerText = "Domain";
	blockBtn.title = domain;
	blockBtn.addEventListener("mouseup", function(){updateYourBlocklist(domain, elem);});
	div.appendChild(blockBtn);
	if (url !== domain) {
		var blockBtnSub = document.createElement("button");
		blockBtnSub.innerText = "Subdomain";
		blockBtnSub.title = url;
		blockBtnSub.addEventListener("mouseup", function(){updateYourBlocklist(url, elem);});
		div.appendChild(blockBtnSub);
	}
	elem.appendChild(div);
}

async function removeElement(e, pos) {
	var elem = e.getElementsByTagName('a')[pos];
	var url = elem.href.replace(/^http.*:\/\/|\/.*$/g, '');
	var response = await browser.runtime.sendMessage({action: "check", url: url}).catch(e => console.log(e));
	if (response.toRemove === true) {
		if (response.showResults === 1) {
			e.style.backgroundColor = "lightcoral";
			e.style.border = "3px solid lightcoral";
			e.style.opacity = "0.7";
		} else {
			e.remove();
		}
	} else if (response.addBlockButtons === 1) {
		addButtons(e, url, response.domain);
	}
}