const { Bot, Collector, Viewer } = require('storybot');

const botController = new Bot({
	database: {
	  filename: __dirname + '/storybot.sqlite'
	} // Имя базы данных Mongo DB
});

async function addNewBot (options={}) {
	const collectorOptions = options.collector;
	const viewersOptions = options.viewers;
	const botOptions = options.bot;

	let viewers = [];

	// Добавляем виюверы
	viewersOptions.forEach(viewerOptions => {
	  let viewer = new Viewer(viewerOptions);
	  viewers.push(viewer);
	});

	let collector = new Collector(collectorOptions);
	console.log(`Добавляем нового бота ${options.bot.name}`);
	botController.addBot({
	  viewers,
	  collector,
	  ...botOptions
	});
	console.log(`Бот ${options.bot.name} добавлен`);
}

module.exports = {
	addNewBot,
	botController
}