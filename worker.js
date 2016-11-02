importScripts('fractals.js');

onmessage = function(e) {
	var args = e.data;
	// Take data from computeFractal and generate the ImageData for it
	var callback = function(res) {
		if (res === true) {
			postMessage(true);
			return;
		}
		var data = new Uint8ClampedArray(args.width * args.height * 4);
		var x = 0;
		for (var i = 0; i < args.width; i++) {
			if (i >= res.w[x + 1]) {
				x++;
			}
			var y = 0;
			for (var j = 0; j < args.height; j++) {
				if (j >= res.h[y + 1]) {
					y++;
				}
				var offset = (j * args.width + i) * 4;
				var color = args.colors[res.data[x][y]];
				data[offset] = color[0];
				data[offset + 1] = color[1];
				data[offset + 2] = color[2];
				data[offset + 3] = 255;
			}
		}
		postMessage(new ImageData(data, args.width, args.height));
	};
	computeFractal(args.fractal, args.depth, args.width, args.height, args.min[0], args.max[0], args.min[1], args.max[1], callback);
}
