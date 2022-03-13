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
	clearBlocklistAlert: 'WARNING:\n\nThis will irreversibly remove all domains from your blocklist,\ndo you really want to proceed?',
	removeFromBlocklist: 'Remove this domain from your blocklist?',
	removeFromWhitelist: 'Remove this domain from your whitelist?',
	block: 'Block:',
	unblock: 'Unblock:',
	remove: '✖'
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
	updateBadge: 15
}