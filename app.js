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

    if (config.updateOnLaunch) {
        await update();
    }
    scheduleUpdate();
}

async function update() {
    const changes = await updateItems();
    await notifyChanges(changes);
}

function scheduleUpdate() {
    const updateInterval = config.updateInterval;
    if (updateInterval > 0) {
        updateTimeout = setTimeout(async () => {
            try {
                await config.sync();
                await update();
            }
            finally {
                scheduleUpdate();
            }
        }, updateInterval * 1000 * 60);
    }
}

init();