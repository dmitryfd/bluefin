require('dotenv').config();

const redfin = require('./redfin');
const config = require('./config');
const { getItem, addItem, replaceItem, setLastUpdate } = require('./items');
const { initDatabase } = require('./database');
const { bot, broadcast } = require('./telegram');
const { log, shouldUpdateItem, r, k } = require('./utils');

async function init() {
    await initDatabase();
    await config.sync();
    await bot.launch();
    await update();

    // TODO: updateInterval is read once, not dynamically
    const updateInterval = config.updateInterval || 0;
    if (updateInterval > 0) {
        setInterval(async () => {
            await config.sync();
            await update();
        }, updateInterval * 1000 * 60);
    }
}

async function update() {
    log(`starting update`);

    try {
        const results = await getResults();
        const changes = await processResults(results);
        await notifyChanges(changes);
    }
    catch (err) {
        console.error(err);
        broadcast(`⚠ An error occured during update: ${err}`);
    }

    log(`finished update`);
}

async function getResults() {
    const maxPrice = config.maxPrice;
    const minBeds = config.minBeds;
    const minSqft = config.minSqft;

    const res = await redfin.getHomes({
        'max_price': maxPrice,
        'num_beds': minBeds,
        'min_listing_approx_size': minSqft
    });

    log(`retrieved ${res.length} results`);
    return res;
}

async function processResults(results) {
    if (!results || !results.length) {
        return;
    }

    const changes = {
        added: [],
        modified: [],
        existing: []
    };

    for (const result of results) {
        const item = await getItem(result.id);
        if (!item) {
            const extended = await redfin.getExtendedData(result);
            if (extended) {
                result.extended = extended;
            }

            changes.added.push(result);
            await addItem(result);

            log(`-- added: ${result.address}`);
        }
        else if (shouldUpdateItem(result, item)) {
            result.extended = item.extended;
            // TODO: Consider whether extended data needs to be refreshed

            changes.modified.push(result);
            await replaceItem(result);

            log(`-- replaced: ${result.address}`);
        }
        else {
            changes.existing.push(item);
        }
    }

    verbose(`finished update: +${changes.added.length}, ~${changes.modified.length}, ${changes.existing.length}`);

    setLastUpdate(changes);
    return changes;
}

async function notifyChanges(changes) {
    if (config.mute) {
        return;
    }

    for (const item of changes.added) {
        // TODO: Add notify criteria in config
        broadcast(item.print());
    }
}

function verbose(msg) {
    if (config.verbose) {
        broadcast(msg);
    }
}

init();