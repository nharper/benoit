function drawPixel(ctx, x, y, color) {
	var g = 255 - color * 255;
	g = g|0;
	ctx.beginPath();
	ctx.strokeStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
	ctx.moveTo(x + 0.5, y);
	ctx.lineTo(x + 0.5, y + 1);
	ctx.stroke();
}

function Fractal(canvas) {
	this.canvas_ = canvas;
	this.ctx_ = canvas.getContext('2d');

	this.re_min_ = -2;
	this.re_max_ = 2;
	this.im_min_ = -2;
	this.im_max_ = 2;

	this.iters_ = 100;

	this.draw = function() {
		console.log('starting to draw');
		for (var y = 0; y < this.canvas_.height; y++) {
			window.setTimeout(function(y) {
				for (var x = 0; x < this.canvas_.width; x++) {
					// map the canvas's (x,y) to a point a+bi on the complex plane.
					var a = x / this.canvas_.width * (this.re_max_ - this.re_min_) + this.re_min_;
					var b = (1 - y / this.canvas_.height) * (this.im_max_ - this.im_min_) + this.im_min_;
					drawPixel(this.ctx_, x, y, this.fn_(a, b));
				}
			}.bind(this, y), 0);
		}
		console.log('done drawing');
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
