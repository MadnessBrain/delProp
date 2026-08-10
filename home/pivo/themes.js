// home/pivo/themes.js
// Theme HTML template for the pivo widget.
// Kept as a separate module to make themes easier to edit / extend.
window.delProp = window.delProp || {};
window.delProp.pivo = window.delProp.pivo || {};

window.delProp.pivo.buildThemeHtml = function(theme) {
	return `
		<div class="container theme-${theme}">
			<div class="glass">
				<div class="stopwatch-top"></div>
				<div class="handle"></div>
				<div class="bottle-neck"></div>
				<div class="glass_container">
					<div class="wrapper">
						<div class="foam"></div>
					</div>
					<div class="glass_grooves">
						<div class="groove"></div>
						<div class="groove"></div>
						<div class="groove"></div>
					</div>
					<span id="percent"></span>
				</div>
				<div class="sun-arc-container">
					<div class="sun-arc-path"></div>
					<div class="sun-element">☀️</div>
					<div class="earth-element"></div>
					<span id="sun-percent" class="sun-percent">0%</span>
				</div>
				<div class="rocket-container">
					<div class="space-bg">
						<div class="stars"></div>
					</div>
					<div class="rocket-element">🚀</div>
					<div class="rocket-fire">🔥</div>
					<span id="rocket-percent" class="rocket-percent">0%</span>
				</div>
				<div class="plant-container">
					<div class="soil-element"></div>
					<div class="plant-stem">
						<div class="plant-leaf leaf-left">🍃</div>
						<div class="plant-leaf leaf-right">🍃</div>
						<div class="plant-flower">🌹</div>
						<div class="plant-shoot">🌱</div>
					</div>
					<span id="plant-percent" class="plant-percent">0%</span>
				</div>
				<div class="battery-container">
					<div class="battery-head"></div>
					<div class="battery-body">
						<div class="battery-fill"></div>
						<div class="battery-flash">⚡</div>
						<span id="battery-percent" class="battery-percent">0%</span>
					</div>
				</div>
				<div class="kettle-container">
					<div class="kettle-body">
						<div class="kettle-water"></div>
						<div class="kettle-steam">💨</div>
						<span id="kettle-percent" class="kettle-percent">0%</span>
					</div>
					<div class="kettle-handle"></div>
					<div class="kettle-spout"></div>
				</div>
				<div class="pizza-container">
					<div class="pizza-oven">
						<div class="pizza-board">
							<div class="pizza-crust">
								<div class="pizza-cheese">
									<div class="pep pep-1"></div>
									<div class="pep pep-2"></div>
									<div class="pep pep-3"></div>
									<div class="pep pep-4"></div>
								</div>
							</div>
						</div>
						<span id="pizza-percent" class="pizza-percent">0%</span>
					</div>
				</div>
				<div class="popcorn-container">
					<div class="popcorn-bucket">
						<div class="popcorn-fill"></div>
						<div class="popcorn-kernels">🍿🍿🍿🍿🍿</div>
						<span id="popcorn-percent" class="popcorn-percent">0%</span>
					</div>
				</div>
				<div class="wine-container">
					<div class="wine-glass-body">
						<div class="wine-liquid"></div>
						<span id="wine-percent" class="wine-percent">0%</span>
					</div>
					<div class="wine-stem"></div>
					<div class="wine-base"></div>
				</div>
				<div class="car-container">
					<div class="highway">
						<div class="road-line"></div>
						<div class="road-line"></div>
						<div class="road-line"></div>
						<div class="finish-line">🏁</div>
						<div class="car-element">🚗</div>
						<span id="car-percent" class="car-percent">0%</span>
					</div>
				</div>
				<div class="stars-container">
					<div class="night-sky">
						<div class="moon">🌙</div>
						<div class="star star-1">⭐</div>
						<div class="star star-2">⭐</div>
						<div class="star star-3">⭐</div>
						<div class="star star-4">⭐</div>
						<div class="star star-5">⭐</div>
						<div class="star star-6">⭐</div>
						<div class="star star-7">⭐</div>
						<div class="star star-8">⭐</div>
						<span id="stars-percent" class="stars-percent">0%</span>
					</div>
				</div>
			</div>
			<div class="notifications">
				<h2 class="not"></h2>
				<div class="timer hidden">
					<span id="h">00</span>
					<span id="min">00</span>
					<span id="sec">00</span>
					<span id="ms">00</span>
				</div>
			</div>
		</div>
	`;
};
