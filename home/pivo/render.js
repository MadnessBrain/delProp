// home/pivo/render.js
// Per-theme DOM updates: given a percent (0..100), update all theme elements.
// Each theme handler keeps the same signature: ({ root, percent, wrapper, percentDiv, glass, state })
window.delProp = window.delProp || {};
window.delProp.pivo = window.delProp.pivo || {};

(function() {
	const R = {};

	// Beer/Dew/Cola/Bottle/Stopwatch themes (base)
	R.base = function(ctx) {
		const { percent, wrapper, percentDiv, glass, root, state } = ctx;
		updateWrapperHeight(ctx);
		updatePercentVisibility(ctx);
		updateWrapperColor(ctx);
		updateFoam(ctx);
		updateBubbles(ctx);
	};

	// Sun theme
	R.sun = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const sunEl = root.querySelector('.sun-element');
		if (sunEl) {
			const pct = Math.max(0, Math.min(100, percent));
			const theta = (pct / 100) * Math.PI;
			const RADIUS = 60, CX = 70, CY = 120;
			const x = CX + RADIUS * Math.cos(theta);
			const y = CY - RADIUS * Math.sin(theta);
			sunEl.style.left = `${x - 12}px`;
			sunEl.style.top = `${y - 12}px`;
		}
		setText(ctx, '#sun-percent', `${percent}%`);
	};

	// Rocket theme
	R.rocket = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const rocketEl = root.querySelector('.rocket-element');
		const fireEl = root.querySelector('.rocket-fire');
		const spaceBg = root.querySelector('.space-bg');
		if (rocketEl) {
			const b = 10 + (percent / 100) * 180;
			rocketEl.style.bottom = `${b}px`;
			if (fireEl) {
				fireEl.style.bottom = `${b - 20}px`;
				fireEl.style.display = percent > 5 ? 'block' : 'none';
			}
		}
		if (spaceBg) {
			spaceBg.style.opacity = (percent / 100).toFixed(2);
		}
		setText(ctx, '#rocket-percent', `${percent}%`);
	};

	// Plant theme
	R.plant = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const stem = root.querySelector('.plant-stem');
		const shoot = root.querySelector('.plant-shoot');
		const flower = root.querySelector('.plant-flower');
		const leafL = root.querySelector('.leaf-left');
		const leafR = root.querySelector('.leaf-right');
		if (stem) stem.style.height = `${(percent / 100) * 120}px`;
		if (shoot) shoot.style.display = percent < 80 ? 'block' : 'none';
		if (flower) {
			flower.style.display = percent >= 80 ? 'block' : 'none';
			flower.style.transform = `translateX(-50%) scale(${Math.max(0, (percent - 80) / 20)})`;
		}
		if (leafL) leafL.style.display = percent > 30 ? 'block' : 'none';
		if (leafR) leafR.style.display = percent > 60 ? 'block' : 'none';
		setText(ctx, '#plant-percent', `${percent}%`);
	};

	// Battery theme
	R.battery = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const fill = root.querySelector('.battery-fill');
		if (fill) {
			fill.style.height = `${percent}%`;
			let bg;
			if (percent < 20) bg = 'linear-gradient(0deg, #b91c1c, #ef4444)';
			else if (percent < 60) bg = 'linear-gradient(0deg, #a16207, #eab308)';
			else bg = 'linear-gradient(0deg, #15803d, #22c55e)';
			fill.style.background = bg;
		}
		setText(ctx, '#battery-percent', `${percent}%`);
	};

	// Kettle theme
	R.kettle = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const water = root.querySelector('.kettle-water');
		const steam = root.querySelector('.kettle-steam');
		if (water) water.style.height = `${percent}%`;
		if (steam) {
			steam.style.display = percent > 65 ? 'block' : 'none';
			steam.style.opacity = Math.min(1, (percent - 65) / 35).toFixed(2);
		}
		setText(ctx, '#kettle-percent', `${percent}%`);
	};

	// Pizza theme
	R.pizza = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const crust = root.querySelector('.pizza-crust');
		if (crust) {
			const sepia = (percent / 100) * 0.4;
			const saturate = 1 + (percent / 100) * 0.8;
			const brightness = 1 - (percent / 100) * 0.15;
			crust.style.filter = `sepia(${sepia}) saturate(${saturate}) brightness(${brightness})`;
		}
		['pep-1', 'pep-2', 'pep-3', 'pep-4'].forEach((cls, i) => {
			const el = root.querySelector(`.${cls}`);
			if (el) el.style.display = percent > (20 + i * 20) ? 'block' : 'none';
		});
		setText(ctx, '#pizza-percent', `${percent}%`);
	};

	// Popcorn theme
	R.popcorn = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const fill = root.querySelector('.popcorn-fill');
		if (fill) fill.style.height = `${percent}%`;
		setText(ctx, '#popcorn-percent', `${percent}%`);
	};

	// Wine theme
	R.wine = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const liquid = root.querySelector('.wine-liquid');
		if (liquid) liquid.style.height = `${percent}%`;
		setText(ctx, '#wine-percent', `${percent}%`);
	};

	// Car theme
	R.car = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const carEl = root.querySelector('.car-element');
		if (carEl) {
			carEl.style.bottom = `${10 + (percent / 100) * 180}px`;
		}
		setText(ctx, '#car-percent', `${percent}%`);
	};

	// Stars theme
	R.stars = function(ctx) {
		R.base(ctx);
		const { root, percent } = ctx;
		const moon = root.querySelector('.moon');
		if (moon) {
			moon.style.opacity = percent > 10 ? (percent / 100).toFixed(2) : 0;
		}
		for (let i = 1; i <= 8; i++) {
			const star = root.querySelector(`.star-${i}`);
			if (star) star.style.display = percent >= (i * 12) ? 'block' : 'none';
		}
		setText(ctx, '#stars-percent', `${percent}%`);
	};

	// Common helpers used by all themes
	function updateWrapperHeight({ percent, wrapper }) {
		if (wrapper) wrapper.style.height = `${percent}%`;
	}

	function updatePercentVisibility({ percent, percentDiv }) {
		if (!percentDiv) return;
		if (percent <= 0) {
			percentDiv.style.display = 'none';
		} else {
			percentDiv.style.display = 'block';
		}
	}

	function updateWrapperColor({ percent, percentDiv }) {
		if (!percentDiv) return;
		if (percent > 63) {
			percentDiv.style.color = '#00000091';
		} else {
			percentDiv.style.color = '#999519';
		}
	}

	function updateFoam({ root, percent }) {
		const foam = root && root.querySelector('.foam');
		if (foam) {
			foam.style.display = percent > 3 ? 'block' : 'none';
		}
	}

	function updateBubbles({ wrapper, percent, state }) {
		if (state && state.hasBubbles()) return;
		if (!wrapper) return;
		if (percent > 20 && percent < 50) {
			state.drawBubbles(40, wrapper);
		} else if (percent >= 50 && percent < 80) {
			state.drawBubbles(80, wrapper);
		} else if (percent >= 80) {
			state.drawBubbles(100, wrapper);
		}
	}

	function setText(ctx, selector, text) {
		const el = ctx.root && ctx.root.querySelector(selector);
		if (el) el.textContent = text;
	}

	// Public dispatch: given a theme name, return the correct render function. Default: base.
	window.delProp.pivo.getRenderer = function(theme) {
		return R[theme] || R.base;
	};
})();
