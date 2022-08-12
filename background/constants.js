'use strict'
const defaultSettings = {
	enabled: 1,
	showBlocked: 0,
	showButtons: 0
}
const defaultBlocklist = {
	'https://raw.githubusercontent.com/no-cmyk/Search-Engine-Spam-Blocklist/master/blocklist.txt': true
}
const css = {
	blockDiv: 'sesb-block-div',
	unblockDiv: 'sesb-unblock-div',
	blockedShow: 'sesb-blocked-show',
	fixHeight: 'sesb-fix-height',
	fixImageSize: 'sesb-fix-image-size',
	hidden: 'sesb-hidden',
	sesbId: 'sesb-id',
	blocked: 'sesb-blocked',
	blockedByRemote: 'sesb-blocked-by-remote',
	whitelistedByRemote: 'sesb-whitelisted-by-remote'
}
const regex = {
	urlRegex: /^http.*:\/\/|\/.*$|:\d+/g,
	urlRegexWithArrow: /^http.*:\/\/|\/.*$|:\d+|\s›.*/g
}
const texts = {
	clearBlocklistAlert: 'WARNING:\n\nThis will irreversibly remove all domains from your blocklist,\ndo you really want to proceed?',
	block: 'Block:',
	unblock: 'Unblock:',
	remove: '✖',
	blockedByRemote: 'Blocked by ',
	whitelistedByRemote: 'Whitelisted by '
}	
const actions = {
	check: 1,
	getActiveSettings: 2,
	checkOptionsListsUpdated: 3,
	clearBlocklist: 4,
	loadWhitelist: 5,
	loadYourBlocklist: 6,
	reloadSettings: 7,
	remove: 8,
	removeFromWhitelist: 9,
	unblock: 10,
	update: 11,
	updateMultiple: 12,
	updateSpamLists: 13,
	whitelistMultiple: 14,
	updateBadge: 15,
	loadRemoteBlocklists: 16,
	removeFromRemoteBlocklists: 17,
	loadRemoteWhitelists: 18,
	removeFromRemoteWhitelists: 19,
	addBlocklistsFromUrls: 20,
	addWhitelistsFromUrls: 21
}