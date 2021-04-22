const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '');

const config = require('./config');
const { log } = require('./utils');

bot.use(async (ctx, next) => {
    const allowedUsers = config.allowedUsers || [];
    const id = ctx.chat.id.toString();
    const name = ctx.chat.type == 'private' ? ctx.chat.first_name : ctx.chat.title;

    if (allowedUsers.indexOf(id) < 0) {
        log(`unauthorized msg from ${name} (${id})`);
        ctx.replyWithMarkdown(`🛑 Sorry, you are not authorized to use this bot! (${id})`);
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

bot.command('get', ctx => {
    const tokens = ctx.message.text.split(' ');
    if (tokens.length != 2) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }

    const id = tokens[1];
    const value = config[id];

    if (typeof value == 'undefined') {
        ctx.replyWithMarkdown(`👎 Such setting does not exist`);
    }
    else {
        ctx.replyWithHTML(JSON.stringify(value));
    }
});

bot.command('unset', async (ctx) => {
    const tokens = ctx.message.text.split(' ');
    if (tokens.length != 2) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }

    const id = tokens[1];

    const status = await config.unset(id);
    ctx.replyWithMarkdown(status ? `👍 OK` : `👎 Failed`);
});

bot.command('set', async (ctx) => {
    const text = ctx.message.text;
    if (text) {
        const matches = text.match(/^\/?\w+ (\w+) (.*)$/);
        if (matches && matches.length == 3) {
            const id = matches[1].trim();
            const valueJson = matches[2].trim();
            try
            {
                const valueObj = JSON.parse(valueJson);
                if (id && typeof valueObj != 'undefined') {
                    const status = await config.set(id, valueObj);
                    ctx.replyWithMarkdown(status ? `👍 OK` : `👎 Failed`);
                    return;
                }
            }
            catch (err) {
                console.error(err);
            }          
        }
    } 

    ctx.replyWithMarkdown(`😥 Couldn't process that`);
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
