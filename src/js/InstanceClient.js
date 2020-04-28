export default class InstanceClient {
  constructor(url) {
    this.url = url;
    this.url2 = '/instances';
    this.eventSource = null;
    this.eventListeners = [];

    this.listeners = [
      { event: 'inscreated', msgEvent: 'created', array: this.createdEventListeners = [] },
      { event: 'insremoved', msgEvent: 'removed', array: this.removedEventListeners = [] },
      { event: 'insrun', msgEvent: 'running', array: this.runEventListeners = [] },
      { event: 'insstopped', msgEvent: 'stopped', array: this.stoppedEventListeners = [] },
      { event: 'createreq', msgEvent: 'create request', array: this.createReqEventListeners = [] },
      { event: 'removereq', msgEvent: 'remove request', array: this.removeReqEventListeners = [] },
      { event: 'startreq', msgEvent: 'start request', array: this.startReqEventListeners = [] },
      { event: 'stopreq', msgEvent: 'stop request', array: this.stopReqEventListeners = [] },
    ];

    this.eventSource = new EventSource(`${this.url}/sse`);
    this.eventSource.addEventListener('message', this.onMessageEventRecieved.bind(this));
  }

  onMessageEventRecieved(event) {
    const rcvdMsg = JSON.parse(event.data);
    const listener = this.listeners.find((o) => o.msgEvent === rcvdMsg.message.event);
    listener.array.forEach((c) => c.call(null, { name: listener.event, rcvdMsg }));
  }

  async getInstances() {
    const res = await fetch(`${this.url}${this.url2}`, { method: 'GET' });
    if (res.status !== 200) return null;
    const array = await res.json();
    return array;
  }

  async getInstance(id) {
    const res = await (await fetch(
      `${this.url}${this.url2}?${new URLSearchParams({ id })}`,
      {
        method: 'GET',
      },
    )).json();

    if (!res.success) return null;
    return res.data;
  }

  async createInstance() {
    const res = await (await fetch(`${this.url}${this.url2}`, { method: 'POST' })).json();
    if (res.success) return true;
    return false;
  }

  async removeInstance(id) {
    const res = await (await fetch(
      `${this.url}${this.url2}?${new URLSearchParams({ id })}`,
      { method: 'DELETE' },
    )).json();
    if (res.success) return true;
    return false;
  }

  async runInstance(id) {
    const res = await this.changeInstance(id, 'running');
    return res;
  }

  async stopInstance(id) {
    const res = await this.changeInstance(id, 'stopped');
    return res;
  }

  async changeInstance(id, state) {
    const res = await (await fetch(
      `${this.url}${this.url2}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, state }),
      },
    )).json();
    if (res.success) return true;
    return false;
  }

  addEventListener(event, callback) {
    if (!this.listeners.map((o) => o.event).includes(event)) return;

    const listeners = this.listeners.find((o) => o.event === event).array;
    listeners.push(callback);
  }

  removeEventListener(event, callback) {
    if (!this.listeners.map((o) => o.event).includes(event)) return;

    const listeners = this.listeners.find((o) => o.event === event).array;
    const index = listeners.indexOf(callback);
    if (index === -1) return;

    listeners.splice(index, 1);
  }
}
