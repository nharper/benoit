fractals = function() {
	// The function to draw a point in the set. Takes a point a+bi on the complex
	// plane and returns a value between 0 and 1 for the shade to draw - 0 for
	// not in the set, and 1 for in the set.
	var mandelbrot = function(max_iters) {
		return function(a, b) {
			var z_re = 0;
			var z_im = 0;
			for (var i = 0; i < max_iters; i++) {
				// compute z = z^2 + a+bi:
				// z = (z_re + z_im*i)^2 + a + b*i
				// z = z_re^2 + 2*z_re*z_im*i - z_im^2 + a + b*i
				// z = z_re^2 - z_im^2 + a + i*(2*z_re*z_im + b)
				var re = z_re*z_re - z_im*z_im + a;
				z_im = 2*z_re*z_im + b;
				z_re = re;
				if (Math.sqrt(z_re*z_re + z_im*z_im) > 2) {
					return i;
				}
			}
			return i;
		};
	};

	var burningShip = function(max_iters) {
		return function(a, b) {
			var z_re = 0;
			var z_im = 0;
			for (var i = 0; i < max_iters; i++) {
				// z = (|z_re| + i|z_im|)^2 + a + bi
				// z = z_re^2 + 2|z_re||z_im|i - z_im^2 + a + bi
				// z = (z_re^2 - z_im^2 + a) + i(2|z_re||z_im| + b)
				var re = z_re*z_re - z_im*z_im + a;
				z_im = 2*Math.abs(z_re*z_im) - b;
				z_re = re;
				if (Math.sqrt(z_re*z_re + z_im*z_im) > 2) {
					return i;
				}
			}
			return i;
		};
	};

	return [
		{'name': 'Mandelbrot', 'fn': mandelbrot},
		{'name': 'Burning Ship', 'fn': burningShip},
	];
}();

// Computes values for fractal[fractalNum].fn(fractalIters) (i.e. fractal
// number |fractalNum|, with max iterations of |fractalIters|). Computation is
// done for a canvas with width |width| and height |height| that ranges from
// |re_min|+i*|im_min| to |re_max|+i*|im_max|. When data has been computed,
// |callback| is called with the following object or with the value "true" to
// indicate there is no more data to come:
// {
//   "w": array of integers forming ranges for the horizontal axis,
//   "h": array of integers forming ranges for the vertical axis,
//   "data": two-dimensional array of values for the fractal. Its width is one
//           less than the size of w; its height is one less than the size of h.
// }
function computeFractal(fractalNum, fractalIters, width, height, re_min, re_max, im_min, im_max, callback) {
	var fn = fractals[fractalNum].fn(fractalIters);
	var w = [0, width];
	var h = [0, height];
	var res = {};
	while (w.length < width + 1 || h.length < height + 1) {
		// subdivide each region in half
		var w_new = [];
		for (var i = 0; i < w.length - 1; i++) {
			var split = ((w[i + 1] - w[i]) / 2|0) + w[i];
			w_new.push(w[i]);
			if (split != w[i]) {
				w_new.push(split);
			}
		}
		w_new.push(w[w.length - 1]);
		w = w_new;
		var h_new = [];
		for (var i = 0; i < h.length - 1;  i++) {
			var split = ((h[i + 1] - h[i]) / 2|0) + h[i];
			h_new.push(h[i]);
			if (split != h[i]) {
				h_new.push(split);
			}
		}
		h_new.push(h[h.length - 1]);
		h = h_new;

		// Build data to post back
		res.w = w;
		res.h = h;
		res.data = [];
		for (var x = 0; x < w.length - 1; x++) {
			res.data[x] = [];
			for (var y = 0; y < h.length - 1; y++) {
				// Convert (w[x], h[y]) coords of canvas (with vertixal axis increasing
				// downwards) to a point a+bi on the imaginary plane within the bounds.
				var x_scaled = w[x] / width;
				var y_scaled = h[y] / height;
				var a = (1 - x_scaled) * re_min + x_scaled * re_max;
				var b = y_scaled * im_min + (1 - y_scaled) * im_max;
				res.data[x][y] = fn(a, b);
			}
		}
		callback(res);
	}
	callback(true);
}
