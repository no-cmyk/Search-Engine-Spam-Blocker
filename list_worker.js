onmessage = function(message) {
	Promise.resolve(true).then(values => {
		postMessage(values);
		close();
	});
}