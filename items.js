const { itemsContainer } = require('./database');
const { stripMetadata } = require('./utils');
const Item = require('./item');

let lastUpdate = null;

function formatItem(resource) {
    if (resource) {
        var strippedResource = stripMetadata(resource);
        return Item.fromObject(strippedResource);
    }
    return null;
}

async function getItem(id) {
    const { resource } = await itemsContainer.item(id).read();
    return formatItem(resource);
}

async function addItem(item) {
    const { resource } = await itemsContainer.items.create(item);
    return formatItem(resource);
}

async function replaceItem(item) {
    const { resource } = await itemsContainer.item(item.id).replace(item);
    return formatItem(resource);
}

async function queryItems(querySpec) {
    const { resources } = await itemsContainer.items.query(querySpec).fetchAll();
    return resources && resources.map(r => formatItem(r));
}

async function cleanItems() {
    if (!lastUpdate) {
        return -1;
    }

    const allItems = [...lastUpdate.added, ...lastUpdate.modified, ...lastUpdate.existing];
    const allIds = allItems.map(x => `"${x.mlsId}"`).join(', ');

    const { resources } = await itemsContainer.items.query({
        query: `SELECT * FROM c WHERE c.id NOT IN (${allIds})`
    }).fetchAll();

    if (!resources) {
        return 0;
    }

    let deleted = 0;
    for (const r of resources) {
        try {
            await itemsContainer.item(r.id).delete();
            ++deleted;
        }
        catch (err) {
            console.error(err);
        }
    }

    return deleted;
}

function getLastUpdate() {
    return lastUpdate;
}

function setLastUpdate(update) {
    lastUpdate = update;
}

module.exports = {
    getItem,
    addItem,
    replaceItem,
    queryItems,
    cleanItems,
    getLastUpdate,
    setLastUpdate
};