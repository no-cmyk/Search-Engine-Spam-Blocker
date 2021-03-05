const yourBlocklistElem = document.getElementById("your-blocklist");
const yourBlocklistDivElem = document.getElementById('your-blocklist-div');
const showResultsElem = document.getElementsByName('show-results');
const addBlockButtonsElem = document.getElementsByName('add-block-buttons');
var yourBlocklist;
var showResults;
var addBlockButtons;
document.addEventListener("mouseup", handleClicks);

function handleClicks(click) {
	var initiator = click.originalTarget.name;
	switch (initiator) {
		case "show-results":
			showResults = !showResults;
			browser.runtime.sendMessage({action: "show-results"});
			break;
		case "add-block-buttons":
			addBlockButtons = !addBlockButtons;
			browser.runtime.sendMessage({action: "add-block-buttons"});
			break;
		case "update-spam-lists":
			browser.runtime.sendMessage({action: "update-spam-lists"});
		default:
			break;
	}
}

async function loadSettings() {
	var settings = await browser.runtime.sendMessage({action: "load-settings"});
	showResults = settings.showResults;
	addBlockButtons = settings.addBlockButtons;
	showResultsElem[0].checked = showResults;
	addBlockButtonsElem[0].checked = addBlockButtons;
	var yb = await browser.runtime.sendMessage({action: "load-your-blocklist"});
	if (yb !== undefined) {
		yourBlocklistProps = Object.getOwnPropertyNames(yb).sort();
		if (yourBlocklistProps.length) {
			yourBlocklistDivElem.classList.remove("hidden");
			for (var i = 0; i < yourBlocklistProps.length; i++) {
				li = document.createElement("li");
				li.innerText = yourBlocklistProps[i];
				li.addEventListener("mouseup", function(){removeFromYourBlocklist(this);});
				yourBlocklistElem.appendChild(li);
			}
		} else {
			yourBlocklistDivElem.classList.add("hidden");
		}
	}
	yourBlocklistNeedsUpdate = false;
}

function removeFromYourBlocklist(li) {
	browser.runtime.sendMessage({action: "remove", url: li.innerText});
	li.remove();
}

loadSettings();