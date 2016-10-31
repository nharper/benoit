function drawRect(ctx, x, y, width, height, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, width, height);
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

	this.iters_ = 100;

	this.colors_ = [];
	for (var i = 0; i < this.iters_; i++) {
		var g = 255 - i / this.iters_ * 255;
		g = g|0;
		this.colors_[i] = 'rgb(' + g + ',' + g + ',' + g + ')';
	}

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

	// The function to draw a point in the set. Takes a point a+bi on the complex
	// plane and returns a value between 0 and 1 for the shade to draw - 0 for
	// not in the set, and 1 for in the set.
	this.mandelbrot = function(a, b) {
		var z_re = 0;
		var z_im = 0;
		for (var i = 0; i < this.iters_ - 1; i++) {
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

	this.burning_ship = function(a, b) {
		var z_re = 0;
		var z_im = 0;
		for (var i = 0; i < this.iters_ - 1; i++) {
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

	this.fn_ = this.mandelbrot;
	// this.fn_ = this.burning_ship;

	this.resetZoom = function() {
		this.re_min_ = -2;
		this.re_max_ = 2;
		this.im_min_ = -2;
		this.im_max_ = 2;
		this.draw();
	};

	this.zoomToCanvasCoords = function(startX, startY, endX, endY) {
		startX -= this.canvas_.offsetLeft;
		endX -= this.canvas_.offsetLeft;
		startY -= this.canvas_.offsetTop;
		endY -= this.canvas_.offsetTop;
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
		this.resize_event_handle_ = window.addEventListener('resize', this.resize);
		this.resize();
	}.bind(this);

	this.stop = function() {
		window.removeEventListener('resize', this.resize_event_handle_);
	}.bind(this);
};

function RegionSelector(callback) {
	this.init = function() {
		this.startX = 0;
		this.startY = 0;
		this.endX = 0;
		this.endY = 0;
		document.addEventListener('mousedown', function(e) {
			this.startX = e.clientX;
			this.startY = e.clientY;
		}.bind(this));

		document.addEventListener('mouseup', function(e) {
			this.endX = e.clientX;
			this.endY = e.clientY;
			var startX = this.startX;
			var startY = this.startY;
			var endX = this.endX;
			var endY = this.endY;
			if (startX > endX) {
				startX = this.endX;
				endX = this.startX;
			}
			if (startY > endY) {
				startY = this.endY;
				endY = this.startY;
			}
			callback(startX, startY, endX, endY);
		}.bind(this));
	};
};

window.addEventListener('load', function() {
	var fractal = new Fractal(document.getElementById('set-viewer'));
	fractal.start();

	document.addEventListener('keypress', function(e) {
		if (e.keyCode == 48) {
			fractal.resetZoom();
		}
	});

	var selector = new RegionSelector(fractal.zoomToCanvasCoords);
	selector.init();
});
