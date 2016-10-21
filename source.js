function drawPixel(ctx, x, y, color) {
	var g = 255 - color * 255;
	g = g|0;
	ctx.beginPath();
	ctx.strokeStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
	ctx.moveTo(x + 0.5, y);
	ctx.lineTo(x + 0.5, y + 1);
	ctx.stroke();
}

function drawRect(ctx, x, y, width, height, color) {
	var g = 255 - color * 255;
	g = g|0;
	ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
	ctx.fillRect(x, y, width, height);
}

function Fractal(canvas) {
	this.canvas_ = canvas;
	this.ctx_ = canvas.getContext('2d');

	this.re_min_ = -2;
	this.re_max_ = 2;
	this.im_min_ = -2;
	this.im_max_ = 2;

	this.iters_ = 100;

	this.draw_callback_id_ = null;
	this.draw_depth_ = 0;

	// test drawing progressively
	this.draw = function() {
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
					drawRect(this.ctx_, left, top, right - left, bottom - top, fn(left, top));
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
			}
		}.bind(this);
		this.draw_callback_id_ = window.setTimeout(timeout_fn, 0);
	};

	// The function to draw a point in the set. Takes a point a+bi on the complex
	// plane and returns a value between 0 and 1 for the shade to draw - 0 for
	// not in the set, and 1 for in the set.
	this.fn_ = function(a, b) {
		var z_re = 0;
		var z_im = 0;
		for (var i = 0; i < this.iters_; i++) {
			// compute z = z^2 + a+bi:
			// z = (z_re + z_im*i)^2 + a + b*i
			// z = z_re^2 + 2*z_re*z_im*i - z_im^2 + a + b*i
			// z = z_re^2 - z_im^2 + a + i*(2*z_re*z_im + b)
			var re = z_re*z_re - z_im*z_im + a;
			z_im = 2*z_re*z_im + b;
			z_re = re;
			// if (z_re > 2 || z_re < -2 || z_im > 2 || z_im < -2) {
			if (Math.sqrt(z_re*z_re + z_im*z_im) > 2) {
				return i / this.iters_;
			}
		}
		return 1;
	};
};

window.addEventListener('load', function() {
	var canvas = document.getElementById('mandelbrot');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	var fractal = new Fractal(canvas);
	fractal.draw();

	window.addEventListener('resize', function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		fractal.draw();
	});
});
