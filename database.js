const { stripMetadata } = require('./utils');

const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
    endpoint: process.env.DB_ENDPOINT,
    key: process.env.DB_KEY
});

const database = client.database('bluefin');
const itemsContainer = database.container('items');
const configContainer = database.container('config');

const defaultConfig = {
    updateInterval: 900000,
    maxPrice: 750000,
    minSqft: 1000,
    minBeds: 2
};

async function init() {
    await client.databases.createIfNotExists({ id: 'bluefin' });

    await database.containers.createIfNotExists({ id: 'items' });
    await database.containers.createIfNotExists({ id: 'config' });
}

async function getConfig(id) {
    const { resource } = await configContainer.item(id).read();
    return resource && resource.value || defaultConfig[id];
}

async function setConfig(id, value) {
    const { resource } = await configContainer.items.upsert({ id, value });
    return resource && resource.value;
}

async function getItem(id) {
    const { resource } = await itemsContainer.item(id).read();
    return stripMetadata(resource);
}

async function addItem(item) {
    const { resource } = await itemsContainer.items.create(item);
    return resource;
}

async function replaceItem(item) {
    const { resource } = await itemsContainer.item(item.id).replace(item);
    return resource;
}

module.exports = {
    init,
    getConfig,
    setConfig,
    getItem,
    addItem,
    replaceItem
};