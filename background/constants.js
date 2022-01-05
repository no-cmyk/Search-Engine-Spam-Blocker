'use strict'
const defaultSettings = {
	enabled: 1,
	enableDefaultBlocklist: 1,
	showBlocked: 0,
	showButtons: 0
}
const storedVars = {
	blocklist: 'sesbBlocklist',
	lastUpdate: 'sesbLastUpdate',
	privateSuffixList: 'sesbPrivateSuffixList',
	suffixList: 'sesbSuffixList'
}
const storedResources = {
	settings: 'sesbSettings',
	whitelist: 'sesbWhitelist',
	yourBlocklist: 'sesbYourBlocklist'
}
const css = {
	blockDiv: 'sesb-block-div',
	unblockDiv: 'sesb-unblock-div',
	blockedShow: 'sesb-blocked-show',
	fixHeight: 'sesb-fix-height',
	fixImageSize: 'sesb-fix-image-size',
	hidden: 'sesb-hidden',
	sesbId: 'sesb-id',
	blocked: 'sesb-blocked'
}
const html = {
	addDomainsButton: 'add-domains-button',
	addDomainsTextarea: 'add-domains-textarea',
	clearBlocklist: 'clear-blocklist',
	domain: 'domain',
	domainWhitelist: 'domain-whitelist',
	enabled: 'enabled',
	enableDefaultBlocklist: 'enable-default-blocklist',
	export: 'export',
	import: 'import',
	manageYourBlocklist: 'manage-your-blocklist',
	resultOk: 'result-ok',
	showBlockButtons: 'show-block-buttons',
	showBlocked: 'show-blocked',
	toHide: 'to-hide',
	updateSpamLists: 'update-spam-lists',
	whitelist: 'whitelist',
	whitelistDomainsButton: 'whitelist-domains-button',
	whitelistDomainsTextarea: 'whitelist-domains-textarea',
	yourBlocklist: 'your-blocklist'
}
const regex = {
	urlRegex: /^http.*:\/\/|\/.*$|:\d+/g,
	urlRegexWithArrow: /^http.*:\/\/|\/.*$|:\d+|\s›.*/g
}
const texts = {
	blockAlert: 'This domain must be removed from your whitelist in order to be blocked.\nDo you want to proceed?',
	clearBlocklistAlert: 'WARNING:\n\nThis will irreversibly remove all domains from your blocklist,\ndo you really want to proceed?',
	removeFromBlocklist: 'Remove this domain from your blocklist?',
	removeFromWhitelist: 'Remove this domain from your whitelist?',
	block: 'Block:',
	unblock: 'Unblock:',
	remove: '✖'
}	
const actions = {
	check: 1,
	checkOptionsBlocklistUpdated: 2,
	checkOptionsWhitelistUpdated: 3,
	clearBlocklist: 4,
	loadWhitelist: 5,
	loadYourBlocklist: 6,
	reloadSettings: 7,
	remove: 8,
	removeFromWhitelist: 9,
	removeFromWhitelistAndUpdate: 10,
	unblock: 11,
	update: 12,
	updateMultiple: 13,
	updateSpamLists: 14,
	whitelistMultiple: 15,
	updateBadge: 16,
	getActiveSettings: 17
}