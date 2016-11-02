importScripts('fractals.js');

onmessage = function(e) {
	var args = e.data;
	args.push(postMessage);
	computeFractal.apply(null, args);
}
