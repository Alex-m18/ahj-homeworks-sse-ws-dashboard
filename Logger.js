const uuid = require('uuid');

class Logger {
  constructor() {
    this.messages = [];
    this.eventListeners = [];
  }

  push(message) {
    const newMsg = {
      message,
      id: uuid.v4(),
      date: new Date(),
    };
    this.messages.push(newMsg);
    setTimeout(() => this.eventListeners.forEach((c) => c.call(null, newMsg)));
  }

  get(messageID) {
    return this.messages.find((m) => m.id === messageID);
  }

  getAllAfter(messageID) {
    return this.messages.slice(this.get(messageID) + 1);
  }

  addEventListener(event, callback) {
    if (event === 'push') this.eventListeners.push(callback);
  }

  removeEventListener(callback) {
    this.eventListeners.splice(this.eventListeners.indexOf(callback), 1);
  }
}

module.exports = Logger;
