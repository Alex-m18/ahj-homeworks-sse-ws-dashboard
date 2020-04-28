import formatDate from './formatDate';

export default class WorklogWidget {
  constructor(client) {
    this.container = null;
    this.element = null;
    this.client = client;
    this.messages = [];
    this.msgTypes = [
      { clientEvt: 'inscreated', worklogMsg: 'Instance created' },
      { clientEvt: 'insremoved', worklogMsg: 'Instance removed' },
      { clientEvt: 'insrun', worklogMsg: 'Instance started' },
      { clientEvt: 'insstopped', worklogMsg: 'Instance stopped' },
      { clientEvt: 'createreq', worklogMsg: 'Create instance request' },
      { clientEvt: 'removereq', worklogMsg: 'Remove request' },
      { clientEvt: 'startreq', worklogMsg: 'Start request' },
      { clientEvt: 'stopreq', worklogMsg: 'Stop request' },
    ];
  }

  init() {
    this.element = document.createElement('div');
    this.element.classList.add('worklog_widget');
    this.container.appendChild(this.element);

    this.title = document.createElement('h3');
    this.title.classList.add('title');
    this.title.textContent = 'Worklog:';
    this.element.appendChild(this.title);

    this.log = document.createElement('div');
    this.log.classList.add('log_area');
    this.element.appendChild(this.log);

    this.client.listeners.forEach((o) => {
      this.client.addEventListener(o.event, this.onMessageRecieved.bind(this));
    });
  }

  onMessageRecieved(evt) {
    const doScroll = this.log.scrollTop === (this.log.scrollHeight - this.log.clientHeight);

    const newMsg = document.createElement('div');
    newMsg.classList.add('message');
    newMsg.setAttribute('data-id', evt.rcvdMsg.id);
    this.log.appendChild(newMsg);
    this.messages.push(newMsg);

    const date = document.createElement('div');
    date.classList.add('message_date');
    date.textContent = formatDate(evt.rcvdMsg.date);
    newMsg.appendChild(date);

    if (evt.rcvdMsg.message.instanceID) {
      const id = document.createElement('div');
      id.classList.add('message_id');
      id.textContent = `Server: ${evt.rcvdMsg.message.instanceID}`;
      newMsg.appendChild(id);
    }

    const info = document.createElement('div');
    info.classList.add('message_info');
    const wlMsg = this.msgTypes.find((o) => o.clientEvt === evt.name).worklogMsg;
    info.textContent = `INFO: ${wlMsg}`;
    newMsg.appendChild(info);

    if (doScroll) this.log.scrollTop = this.log.scrollHeight;
  }

  bindToDOM(container) {
    this.container = container;
  }
}
