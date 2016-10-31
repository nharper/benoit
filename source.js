function drawRect(ctx, x, y, width, height, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, width, height);
}

// The function to draw a point in the set. Takes a point a+bi on the complex
// plane and returns a value between 0 and 1 for the shade to draw - 0 for
// not in the set, and 1 for in the set.
function mandelbrot(max_iters) {
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

function burningShip(max_iters) {
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

// Generates an array of colors, where points is an array of tuples like
// [R, G, B, end], and the return value is an array of strings 'rgb(...)'.
// It starts at white for the first color (if one isn't specified).
function generateColors(points) {
	var colors = [];
	var r = 255, g = 255, b = 255;
	for (var p in points) {
		var r_next = points[p][0];
		var g_next = points[p][1];
		var b_next = points[p][2];
		var end = points[p][3];
		var start = colors.length;
		for (var i = start; i < end; i++) {
			var scale = (i - start) / (end - start);
			colors[i] = 'rgb(' + ((r * (1 - scale) + r_next * scale)|0) +
									',' + ((g * (1 - scale) + g_next * scale)|0) +
									',' + ((b * (1 - scale) + b_next * scale)|0) + ')';
		}
		r = r_next;
		g = g_next;
		b = b_next;
	}
	return colors;
}

function Fractal(container) {
	this.container_ = container;
	this.canvas_ = document.createElement('canvas');
	this.canvas_.style.position = "absolute";
	this.container_.insertBefore(this.canvas_, this.container_.firstChild);
	this.ctx_ = this.canvas_.getContext('2d');

	this.re_min_ = -2;
	this.re_max_ = 2;
	this.im_min_ = -2;
	this.im_max_ = 2;

	this.iters_ = 255;

	this.colors_ = generateColors([[0, 0, 0, this.iters_]]);

	this.draw_callback_id_ = null;
	this.draw_depth_ = 0;

	this.resize = function() {
		var style = window.getComputedStyle(this.container_);
		var width = this.container_.clientWidth
				- parseInt(style.paddingLeft, 10)
				- parseInt(style.paddingRight, 10);
		var height = this.container_.clientHeight
				- parseInt(style.paddingTop, 10)
				- parseInt(style.paddingBottom, 10);
		if (this.canvas_.width != width || this.canvas_.height != height) {
			this.canvas_.width = width;
			this.canvas_.height = height;
			this.draw();
		}
	}.bind(this);

	// test drawing progressively
	this.draw = function() {
		this.draw_start_ = performance.now();
		if (this.draw_callback_id_) {
			window.clearTimeout(this.draw_callback_id_);
		}
		// Draws from (left, top) inclusive to (right, bottom) exclusive. It calls
		// fn(x, y) to get the value to draw at that location. It draws the region
		// in blocks using the value from the top-left of the block to draw the
		// whole block.
		//
		// y coordinates go from top to bottom, so bottom > top. This is how
		// <canvas>'s coordinates are set up (postscript is similar), but not
		// your high school teacher's xy plane
		//
		var draw_in_blocks = function(left, top, right, bottom, fn, depth, draw) {
			if (left == right || top == bottom) {
				throw new Error("Bounds are touching!");
			}
			if (depth < 0) {
				throw new Error("depth went negative");
			}
			// Draw this level
			if (depth == 0) {
				if (draw) {
					// drawPixel(this.ctx_, left, top, fn(left, top));
					drawRect(this.ctx_, left, top, right - left, bottom - top, this.colors_[fn(left, top)]);
				}
				return true;
			}

			// If we have a single pixel, there's no need to subdivide further.
			if (right - left == 1 && bottom - top == 1) {
				return false;
			}

			depth--;
			var r = false;

			// This has an overflow bug. I'm assuming we're not drawing on canvases
			// that are large enough for this to be an issue.
			var hSplit = (left + right) / 2|0;
			var vSplit = (top + bottom) / 2|0;

			// Handle drawing a row of pixels
			if (bottom - top == 1) {
				r += draw_in_blocks(left, top, hSplit, bottom, fn, depth, false);
				r += draw_in_blocks(hSplit, top, right, bottom, fn, depth, true);
				return r > 0;
			}

			// Handle drawing a column of pixels
			if (right - left == 1) {
				r += draw_in_blocks(left, top, right, vSplit, fn, depth, false);
				r += draw_in_blocks(left, vSplit, right, bottom, fn, depth, true);
				return r > 0;
			}

			r += draw_in_blocks(left, top, hSplit, vSplit, fn, depth, false);
			r += draw_in_blocks(hSplit, top, right, vSplit, fn, depth, true);
			r += draw_in_blocks(left, vSplit, hSplit, bottom, fn, depth, true);
			r += draw_in_blocks(hSplit, vSplit, right, bottom, fn, depth, true);
			return r > 0;
		}.bind(this);

		this.draw_depth_ = 0;
		var timeout_fn = function() {
			var fn = function(x, y) {
				var a = x / this.canvas_.width * (this.re_max_ - this.re_min_) + this.re_min_;
				var b = (1 - y / this.canvas_.height) * (this.im_max_ - this.im_min_) + this.im_min_;
				return this.fn_(a, b);
			}.bind(this);
			if (draw_in_blocks(0, 0, this.canvas_.width, this.canvas_.height, fn,
												 this.draw_depth_, this.draw_depth_ == 0)) {
				this.draw_depth_++;
				this.draw_callback_id_ = window.setTimeout(timeout_fn, 0);
			} else {
				console.log("draw() took " + (performance.now() - this.draw_start_) + "ms");
			}
		}.bind(this);
		this.draw_callback_id_ = window.setTimeout(timeout_fn, 0);
	};


	this.fn_ = mandelbrot(this.iters_ - 1);

	this.setFractal = function(fractal) {
		this.fn_ = fractal(this.iters_ - 1);
		this.draw();
	}.bind(this);

	this.setColors = function(colors) {
		this.colors_ = colors;
		this.iters_ = colors.length;
		this.draw();
	}.bind(this);

	this.resetZoom = function() {
		this.re_min_ = -2;
		this.re_max_ = 2;
		this.im_min_ = -2;
		this.im_max_ = 2;
		this.draw();
	};

	this.zoomToCanvasCoords = function(startX, startY, endX, endY) {
		startX /= this.canvas_.width;
		startY /= this.canvas_.height;
		endX /= this.canvas_.width;
		endY /= this.canvas_.height;
		var re_min = this.re_min_ * (1 - startX) + this.re_max_ * startX;
		this.re_max_ = this.re_min_ * (1 - endX) + this.re_max_ * endX;
		this.re_min_ = re_min;
		var im_min = this.im_min_ * endY + this.im_max_ * (1 - endY);
		this.im_max_ = this.im_min_ * startY + this.im_max_ * (1 - startY);
		this.im_min_ = im_min;
		this.draw();
	}.bind(this);

	this.start = function() {
		window.addEventListener('resize', this.resize);
		this.resize();
	}.bind(this);

	this.stop = function() {
		window.removeEventListener('resize', this.resize);
	}.bind(this);
};

function RegionSelector(callback, container) {
	this.callback_ = callback;
	this.container_ = container;

	this.resize = function() {
		var style = window.getComputedStyle(this.container_);
		this.width = this.container_.clientWidth
				- parseInt(style.paddingLeft, 10)
				- parseInt(style.paddingRight, 10);
		this.height = this.container_.clientHeight
				- parseInt(style.paddingTop, 10)
				- parseInt(style.paddingBottom, 10);
	}.bind(this);

	this.start_select_ = function(x, y) {
		if (x < this.container_.offsetLeft || y < this.container_.offsetTop ||
				x > this.container_.offsetLeft + this.container_.clientWidth ||
				y > this.container_.offsetTop + this.container_.clientHeight) {
			return;
		}

		this.div_ = document.createElement('div');
		this.div_.style.position = "absolute";
		this.div_.style.zIndex = '100';
		this.div_.className = "selector";
		this.container_.insertBefore(this.div_, this.container_.firstChild);

		document.addEventListener('mousemove', this.update_listener_);

		this.startX = x;
		this.startY = y;
		this.div_.style.left = this.startX + 'px';
		this.div_.style.top = this.startY + 'px';
	}.bind(this);

	this.update_select_ = function(x, y) {
		var left, deltaX, top, deltaY;
		if (x < this.startX) {
			left = x;
			deltaX = this.startX - x;
		} else {
			left = this.startX;
			deltaX = x - this.startX;
		}
		if (y < this.startY) {
			top = y;
			deltaY = this.startY - y;
		} else {
			top = this.startY;
			deltaY = y - this.startY;
		}
		this.div_.style.left = left + 'px';
		this.div_.style.width = deltaX + 'px';
		this.div_.style.top = top + 'px';
		this.div_.style.height = deltaY + 'px';
	}.bind(this);

	this.update_listener_ = function(e) {
		this.update_select_(e.clientX, e.clientY);
	}.bind(this);

	this.end_select_ = function(x, y) {
		if (!this.div_) {
			return;
		}
		document.removeEventListener('mousemove', this.update_listener_);
		this.div_.remove();
		this.div_ = null;
		var sx, sy, ex, ey;
		if (x < this.startX) {
			sx = x;
			ex = this.startX;
		} else {
			sx = this.startX;
			ex = x;
		}
		if (y < this.startY) {
			sy = y;
			ey = this.startY;
		} else {
			sy = this.startY;
			ey = y;
		}
		this.callback_(sx - this.container_.offsetLeft,
									 sy - this.container_.offsetTop,
									 ex - this.container_.offsetLeft,
									 ey - this.container_.offsetTop);
	}.bind(this);

	this.init = function() {
		window.addEventListener('resize', this.resize);
		this.resize();

		this.startX = 0;
		this.startY = 0;
		this.endX = 0;
		this.endY = 0;
		document.addEventListener('mousedown', function(e) {
			this.start_select_(e.clientX, e.clientY);
		}.bind(this));


		document.addEventListener('mouseup', function(e) {
			this.end_select_(e.clientX, e.clientY);
		}.bind(this));
	};
};

function FractalSelector(fractal, container) {
	this.fractal_ = fractal;
	this.container_ = container;
	this.fractals_ = [
		{'name': 'Mandelbrot', 'fn': mandelbrot},
		{'name': 'Burning Ship', 'fn': burningShip},
	];
	this.select_ = document.createElement('select');
	for (var i in this.fractals_) {
		var option = document.createElement('option');
		option.innerText = this.fractals_[i].name;
		this.select_.appendChild(option);
	}
	this.select_.addEventListener('change', function() {
		this.fractal_.setFractal(this.fractals_[this.select_.selectedIndex].fn);
	}.bind(this));
	this.container_.parentNode.insertBefore(this.select_, this.container_.nextSibling);
};

function ColorChooser(fractal, container) {
	this.fractal_ = fractal;
	this.container_ = container;
	var colors = [
		{'name': 'Grayscale', 'points': [[0, 0, 0, 255]]},
		{'name': 'Orange', 'points': [[255, 255, 127, 0], [255, 127, 0, 63], [191, 0, 0, 127], [0, 0, 0, 255]]},
		{'name': 'Blue', 'points': [[63, 63, 255, 0], [255, 127, 0, 63], [191, 0, 0, 127], [0, 0, 0, 255]]},
		{'name': 'Rainbow', 'points': [[127, 0, 255, 0], [0, 0, 255, 31], [0, 255, 255, 63], [0, 255, 0, 95], [255, 255, 0, 127], [255, 0, 0, 191], [0, 0, 0, 255]]},
	];

	this.colors_ = [];
	for (var i = 0; i < colors.length; i++) {
		this.colors_[i] = generateColors(colors[i].points);
	}

	this.select_ = document.createElement('select');
	for (var i in colors) {
		var option = document.createElement('option');
		option.innerText = colors[i].name;
		this.select_.appendChild(option);
	}
	this.select_.addEventListener('change', function() {
		this.fractal_.setColors(this.colors_[this.select_.selectedIndex]);
	}.bind(this));
	this.container_.parentNode.insertBefore(this.select_, this.container_.nextSibling);
};

window.addEventListener('load', function() {
	var container = document.getElementById('set-viewer');
	var fractal = new Fractal(container);
	fractal.start();

	document.addEventListener('keypress', function(e) {
		if (e.keyCode == 48) {
			fractal.resetZoom();
		}
	});

	var selector = new RegionSelector(fractal.zoomToCanvasCoords, container);
	selector.init();

	var fractalSelector = new FractalSelector(fractal, container);
	var colorChooser = new ColorChooser(fractal, container);
});
