/* eslint-disable no-console */
const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const Router = require('koa-router');
const { streamEvents } = require('http-event-stream');
const InstanceServer = require('./InstanceServer');
const Logger = require('./Logger');

const app = new Koa();
const router = new Router();
const instServer = new InstanceServer();

const log = new Logger();
const logMessages = [
  { instanceServerEvent: 'inscreated', loggingMessage: 'created' },
  { instanceServerEvent: 'insremoved', loggingMessage: 'removed' },
  { instanceServerEvent: 'insrun', loggingMessage: 'running' },
  { instanceServerEvent: 'insstopped', loggingMessage: 'stopped' },
  { serverEvent: 'createreq', loggingMessage: 'create request' },
  { serverEvent: 'removereq', loggingMessage: 'remove request' },
  { serverEvent: 'startreq', loggingMessage: 'start request' },
  { serverEvent: 'stopreq', loggingMessage: 'stop request' },
];
logMessages
  .filter((o) => o.instanceServerEvent)
  .forEach((o) => instServer.addEventListener(o.instanceServerEvent, (instance) => {
    log.push({ instanceID: instance.id, event: o.loggingMessage });
  }));

// Koa body initialize
app.use(koaBody({
  urlencoded: true,
}));

// Preflight
// eslint-disable-next-line consistent-return
app.use(async (ctx, next) => {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  ctx.response.set({ ...headers });

  const origin = ctx.request.get('Origin');
  if (!origin) {
    // eslint-disable-next-line no-return-await
    return await next();
  }

  if (ctx.request.method !== 'OPTIONS') {
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }
  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    });
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      );
    }
    ctx.response.status = 204;
  }
});

router.get('/sse', async (ctx) => {
  streamEvents(ctx.req, ctx.res, {
    async fetch(lastEventId) {
      return log.getAllAfter(lastEventId);
    },
    stream(sse) {
      const sendEvent = (msg) => {
        sse.sendEvent({ id: msg.id, event: 'message', data: JSON.stringify(msg) });
      };
      log.addEventListener('push', sendEvent);
      return () => log.removeEventListener(sendEvent);
    },
  });
  ctx.respond = false;
});

router.get('/instances', async (ctx) => {
  const { id } = ctx.request.query;
  if (id) {
    const instance = instServer.instances.find((i) => i.id === id);
    if (!instance) {
      ctx.response.type = 404;
      ctx.response.body = {
        success: false,
        message: 'id not found',
      };
      return;
    }
    ctx.response.type = 200;
    ctx.response.body = {
      success: true,
      data: instance,
    };
    return;
  }
  ctx.response.type = 200;
  ctx.response.body = instServer.instances;
});

router.post('/instances', async (ctx) => {
  instServer.createInstance();
  log.push({ event: logMessages.find((o) => o.serverEvent === 'createreq').loggingMessage });
  ctx.response.type = 200;
  ctx.response.body = { success: true };
});

router.put('/instances', async (ctx) => {
  const rsvdInst = ctx.request.body;
  if (!rsvdInst || !rsvdInst.id || !rsvdInst.state) {
    ctx.response.type = 417;
    ctx.response.body = {
      success: false,
      message: 'instance object expected',
    };
    return;
  }

  if (!instServer.setState(rsvdInst.id, rsvdInst.state)) {
    ctx.response.type = 417;
    ctx.response.body = {
      success: false,
      message: 'Object error. ID not found or wrong state',
    };
    return;
  }
  const evt = rsvdInst.state === 'running' ? 'startreq' : 'stopreq';
  log.push({
    instanceID: rsvdInst.id,
    event: logMessages.find((o) => o.serverEvent === evt).loggingMessage,
  });
  ctx.response.type = 200;
  ctx.response.body = { success: true };
});

router.delete('/instances', async (ctx) => {
  const { id } = ctx.request.query;
  if (!id || !instServer.instances.find((i) => i.id === id)) {
    ctx.response.type = 404;
    ctx.response.body = {
      success: false,
      message: 'id not found',
    };
    return;
  }

  instServer.removeInstance(id);
  log.push({
    instanceID: id,
    event: logMessages.find((o) => o.serverEvent === 'removereq').loggingMessage,
  });
  ctx.response.type = 200;
  ctx.response.body = { success: true };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Run server
const port = process.env.PORT || 7070;
// eslint-disable-next-line no-unused-vars
const server = http.createServer(app.callback()).listen(port);

console.log(`Server is listening on port ${port}`);
