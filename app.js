require('dotenv').config();

const config = require('./config');
const { updateItems } = require('./items');
const { initDatabase } = require('./database');
const { bot, notifyChanges } = require('./telegram');

let updateTimeout = null;

async function init() {
    await initDatabase();
    await config.sync();
    await bot.launch();

    const changes = await updateItems();
    await notifyChanges(changes);

    scheduleUpdate();
}

function scheduleUpdate() {
    const updateInterval = config.updateInterval;
    if (updateInterval > 0) {
        updateTimeout = setTimeout(async () => {
            await config.sync();

            const changes = await updateItems();
            await notifyChanges(changes);

            scheduleUpdate();
        }, updateInterval * 1000 * 60);
    }
}

init();