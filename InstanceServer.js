const Instance = require('./Instance');
const iStates = require('./instanceStates');

class InstanceServer {
  constructor() {
    this.instances = [];
    this.createdEventListeners = [];
    this.removedEventListeners = [];
    this.runEventListeners = [];
    this.stoppedEventListeners = [];
    this.listeners = [
      { event: 'inscreated', array: this.createdEventListeners },
      { event: 'insremoved', array: this.removedEventListeners },
      { event: 'insrun', array: this.runEventListeners },
      { event: 'insstopped', array: this.stoppedEventListeners },
    ];
  }

  async createInstance() {
    const newI = new Instance();
    await new Promise((resolve) => {
      setTimeout(() => {
        this.instances.push(newI);
        resolve();
      }, 20000);
    });
    setTimeout(() => this.createdEventListeners.forEach((c) => c.call(null, newI)));
    return newI;
  }

  async removeInstance(id) {
    let insIndex;
    const instance = this.instances.find((o, index) => {
      if (o.id === id) {
        insIndex = index;
        return true;
      }
      return false;
    });
    if (!instance) return;
    if (instance.state === iStates.running) await this.stopInstance(id);

    await new Promise((resolve) => {
      setTimeout(() => {
        this.instances.splice(insIndex, 1);
        resolve();
      }, 20000);
    });

    setTimeout(() => this.removedEventListeners.forEach((c) => c.call(null, instance)));
  }

  async runInstance(id) {
    const instance = this.instances.find((o) => o.id === id);
    if (!instance) return;
    await instance.run();
    setTimeout(() => this.runEventListeners.forEach((c) => c.call(null, instance)));
  }

  async stopInstance(id) {
    const instance = this.instances.find((o) => o.id === id);
    if (!instance) return;
    await instance.stop();
    setTimeout(() => this.stoppedEventListeners.forEach((c) => c.call(null, instance)));
  }

  async setState(id, state) {
    const instance = this.instances.find((o) => o.id === id);
    if (!instance) return;
    if (state === iStates.running) await this.runInstance(id);
    if (state === iStates.stopped) await this.stopInstance(id);
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

module.exports = InstanceServer;
