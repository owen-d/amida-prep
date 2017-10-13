'use strict';

const Koa = require('koa');
const app = new Koa();
const moment = require('moment');
const join = require('path').join;
const body = require('co-body');
const bb = require('bluebird');
const fs = bb.promisifyAll(require('fs'));
const parse = require('./parse/parser');


app.use(async (ctx, next) => {
  if (ctx.path === '/api/sample') {

    ctx.status = 200;
    ctx.body = {
      metadata: moment.utc().format('YYYY-MM-DD h:mm:ss a'),
      data: require(join(__dirname, 'parse/sampleOutput.json'))
    };
  } else {
    await next();
  }

});

app.use(async ctx => {
  if (ctx.path === '/api/parse' && ctx.method === 'POST') {
    let data = await body.text(ctx);

    await bb.resolve(data)
      .then(x => parse(x))
      .then(parsed => fs.writeFileAsync(join(__dirname, 'post.json'), JSON.stringify(parsed)))
      .then(() => ctx.status = 200)
      .catch(e => ctx.throw(400, e.message));
  }
})


app.listen(process.env.PORT || 8000);
