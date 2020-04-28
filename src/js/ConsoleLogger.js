/* eslint-disable no-console */

import formatDate from './formatDate';

export default class ConsoleLogger {
  constructor(client) {
    this.client = client;

    this.msgTypes = [
      { clientEvt: 'inscreated', logMsg: 'created' },
      { clientEvt: 'insremoved', logMsg: 'removed' },
      { clientEvt: 'insrun', logMsg: 'running' },
      { clientEvt: 'insstopped', logMsg: 'stopped' },
      { clientEvt: 'createreq', logMsg: 'create instance request recieved' },
      { clientEvt: 'removereq', logMsg: 'remove request recieved' },
      { clientEvt: 'startreq', logMsg: 'start request recieved' },
      { clientEvt: 'stopreq', logMsg: 'stop request recieved' },
    ];

    this.client.listeners.forEach((o) => {
      this.client.addEventListener(o.event, this.onMessageRecieved.bind(this));
    });
  }

  onMessageRecieved(evt) {
    let str = `${formatDate(evt.rcvdMsg.date)}: `;
    if (evt.rcvdMsg.message.instanceID) {
      str += `Instance ID: ${evt.rcvdMsg.message.instanceID} `;
    }
    str += `${this.msgTypes.find((o) => o.clientEvt === evt.name).logMsg}`;

    console.log(str);
  }
}
