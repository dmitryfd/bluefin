const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '');

const config = require('./config');
const { log } = require('./utils');

bot.use(async (ctx, next) => {
    const allowedUsers = config.allowedUsers || [];
    const id = ctx.chat.id;
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
    const id = ctx.chat.id;
    const name = ctx.chat.type == 'private' ? ctx.chat.first_name : ctx.chat.title;

    ctx.replyWithMarkdown(`👋 Hey there, ${name} (${id})!`);
});

async function broadcast(msg, opts) {
    opts = opts || { parse_mode: 'html' };

    const allowedUsers = config.allowedUsers || [];
    for (const userId of allowedUserIds) {
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
