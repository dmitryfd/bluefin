const { itemsContainer } = require('./database');
const { stripMetadata } = require('./utils');
const Item = require('./item');

async function getItem(id) {
    const { resource } = await itemsContainer.item(id).read();
    if (resource) {
        var strippedResource = stripMetadata(resource);
        return Item.fromObject(strippedResource);
    }
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
    getItem,
    addItem,
    replaceItem
};