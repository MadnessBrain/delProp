// home/pivo/messages.js
// All UI texts and theme-specific notification messages.
// Centralizing here keeps core.js clean.
window.delProp = window.delProp || {};
window.delProp.pivo = window.delProp.pivo || {};

window.delProp.pivo.messages = {
	// Breakievements during work day
	msg: {
		work: "😔 Работать:",
		start: ['Ураа..', 'Перерыв'],
		stop: ['Увы..', 'Пора работать'],
		morning: ['Работа еще не началась!', 'Но ты уже тут?', 'Сумасшествие!', 'Ожидайте...']
	},
	// Saturday / Sunday messages per theme
	satMsgs: {
		beer: ['Суббота же', 'Вот тебе пиво', 'А я домой!'],
		mountainDew: ['Суббота же', 'Вот тебе Dew', 'А я домой!'],
		cola: ['Суббота же', 'Вот тебе Кола', 'А я домой!'],
		bottle: ['Суббота же', 'Вот бутылка', 'А я домой!'],
		stopwatch: ['Суббота же', 'Время отдыхать', 'А я домой!'],
		sun: ['Суббота же', 'Солнце светит для отдыха', 'А я домой!'],
		rocket: ['Суббота же', 'Полеты отложены', 'А я домой!'],
		plant: ['Суббота же', 'Полив завершен', 'А я домой!'],
		battery: ['Суббота же', 'Зарядка 100%', 'А я домой!'],
		kettle: ['Суббота же', 'Чай заварен!', 'А я домой!'],
		pizza: ['Суббота же', 'Пицца съедена!', 'А я домой!'],
		popcorn: ['Суббота же', 'Кино закончилось!', 'А я домой!'],
		wine: ['Суббота же', 'Выходные начались!', 'А я домой!'],
		car: ['Суббота же', 'Маршрут завершен!', 'А я домой!'],
		stars: ['Суббота же', 'Звезды светят для отдыха', 'А я домой!']
	},
	// Work day completion messages per theme
	finishMsgs: {
		beer: ['Пиво налито!', 'Пора домой!!'],
		mountainDew: ['Dew налит!', 'Пора домой!!'],
		cola: ['Кола налита!', 'Пора домой!!'],
		bottle: ['Бутылка полна!', 'Пора домой!!'],
		stopwatch: ['Время вышло!', 'Пора домой!!'],
		sun: ['Солнце село!', 'Пора домой!!'],
		rocket: ['Ракета в космосе!', 'Пора домой!!'],
		plant: ['Росток вырос!', 'Пора домой!!'],
		battery: ['Заряжено на 100%!', 'Пора домой!!'],
		kettle: ['Чайник закипел!', 'Пора домой!!'],
		pizza: ['Пицца готова!', 'Пора домой!!'],
		popcorn: ['Ведро полно!', 'Пора домой!!'],
		wine: ['Бокал полон!', 'Пора домой!!'],
		car: ['Финишная черта!', 'Пора домой!!'],
		stars: ['Звездное небо!', 'Пора домой!!']
	}
};

// Helper getters with fallback to default theme
window.delProp.pivo.getSatMsg = function(theme) {
	return this.messages.satMsgs[theme] || this.messages.satMsgs.beer;
};
window.delProp.pivo.getFinishMsg = function(theme) {
	return this.messages.finishMsgs[theme] || this.messages.finishMsgs.beer;
};
window.delProp.pivo.getMsg = function() {
	return this.messages.msg;
};
