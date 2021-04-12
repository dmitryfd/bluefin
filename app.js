require('dotenv').config();

const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN || "");

bot.start(ctx => {
    const name = ctx.chat.type == "private" ? ctx.chat.first_name : ctx.chat.title;
    const id = ctx.chat.id;

    ctx.replyWithMarkdown(`👋 Hey there, ${name} (${id})!`);
});

bot.launch();

const server = require('fastify')();

server.get('/', async (req, res) => {
    return { hello: 'world' };
});

server.listen(process.env.PORT || '3000');