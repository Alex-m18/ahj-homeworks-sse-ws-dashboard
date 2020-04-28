const uuid = require('uuid');
const iStates = require('./instanceStates');

class Instance {
  constructor() {
    this.id = uuid.v4();
    this.state = iStates.stopped;
  }

  async run() {
    await this.apply('run');
  }

  async stop() {
    await this.apply('stop');
  }

  async apply(command) {
    const state = (command === 'run') ? iStates.running : iStates.stopped;

    if (this.state === state) return this.state;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.state = state;
        resolve(this);
      }, 20000);
    });
  }
}

module.exports = Instance;
