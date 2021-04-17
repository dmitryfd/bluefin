const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '');

const config = require('./config');
const { log, parseConfigCommand } = require('./utils');

bot.use(async (ctx, next) => {
    const allowedUsers = config.allowedUsers || [];
    const id = ctx.chat.id.toString();
    const name = ctx.chat.type == 'private' ? ctx.chat.first_name : ctx.chat.title;

    if (allowedUsers.indexOf(id) < 0) {
        log(`unauthorized msg from ${name} (${id})`);
        ctx.replyWithMarkdown(`🛑 Sorry, you are not authorized to use this bot!`);
    }
    else {
        await next();
    }
});

bot.start(ctx => {
    const id = ctx.chat.id.toString();
    const name = ctx.chat.type == 'private' ? ctx.chat.first_name : ctx.chat.title;

    ctx.replyWithMarkdown(`👋 Hey there, ${name} (${id})!`);
});

bot.command('set', async (ctx) => {
    const c = parseConfigCommand(ctx.message.text);
    if (!c || !c.id || !c.value) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }

    const status = await config.set(c.id, c.value);
    ctx.replyWithMarkdown(status ? `👍 OK` : `👎 Failed`);
});

bot.command('setInt', async (ctx) => {
    const c = parseConfigCommand(ctx.message.text);
    if (!c || !c.id || !c.value) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }

    const intValue = parseInt(c.value);
    if (isNaN(intValue)) {
        ctx.replyWithMarkdown(`😥 Couldn't parse as int`);
        return;
    }

    const status = await config.set(c.id, intValue);
    ctx.replyWithMarkdown(status ? `👍 OK` : `👎 Failed`);
});

bot.command('setFloat', async (ctx) => {
    const c = parseConfigCommand(ctx.message.text);
    if (!c || !c.id || !c.value) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }

    const floatValue = parseFloat(c.value);
    if (isNaN(floatValue)) {
        ctx.replyWithMarkdown(`😥 Couldn't parse as float`);
        return;
    }

    const status = await config.set(c.id, floatValue);
    ctx.replyWithMarkdown(status ? `👍 OK` : `👎 Failed`);
});

bot.command('setArray', async (ctx) => {
    const c = parseConfigCommand(ctx.message.text);
    if (!c || !c.id || !c.value) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }

    const arrayValue = c.value.split(',');

    const status = await config.set(c.id, arrayValue);
    ctx.replyWithMarkdown(status ? `👍 OK` : `👎 Failed`);
});

async function broadcast(msg, opts) {
    opts = opts || { parse_mode: 'html' };

    const allowedUsers = config.allowedUsers || [];
    for (const userId of allowedUsers) {
        try {
            await bot.telegram.sendMessage(userId, msg, opts);
        }
        catch (err) {
            console.error(err);
        }
    }
}

module.exports = {
    bot,
    broadcast
};
