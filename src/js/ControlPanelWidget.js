export default class ControlPanelWidget {
  constructor(client) {
    this.container = null;
    this.element = null;
    this.client = client;
    this.instances = new Map();
  }

  init() {
    this.element = document.createElement('div');
    this.element.classList.add('cp_widget');
    this.container.appendChild(this.element);

    this.title = document.createElement('h3');
    this.title.classList.add('title');
    this.title.textContent = 'Your micro instanses:';
    this.element.appendChild(this.title);

    this.instancesEl = document.createElement('div');
    this.instancesEl.classList.add('instances_area');
    this.element.appendChild(this.instancesEl);

    this.createEl = document.createElement('div');
    this.createEl.classList.add('create_btn');
    this.createEl.textContent = 'Create new instance';
    this.instancesEl.appendChild(this.createEl);

    this.instancesEl.addEventListener('click', this.onInstancesClick.bind(this));
    this.createEl.addEventListener('click', this.onCreateClick.bind(this));

    this.client.listeners.forEach((o) => {
      this.client.addEventListener(o.event, this.onMessageRecieved.bind(this));
    });

    this.getAllInstances();
  }

  onInstancesClick(evt) {
    if (evt.prevented) return;
    evt.preventDefault();

    const element = evt.target.closest('.instance');
    if (!element) return;

    const id = element.getAttribute('data-id');
    if (evt.target.classList.contains('start_btn')) {
      this.client.runInstance(id);
    }

    if (evt.target.classList.contains('stop_btn')) {
      this.client.stopInstance(id);
    }

    if (evt.target.classList.contains('remove_btn')) {
      this.client.removeInstance(id);
    }
  }

  onCreateClick(evt) {
    evt.preventDefault();
    this.client.createInstance();
  }

  onMessageRecieved(evt) {
    if (evt.name === 'inscreated') {
      const doScroll = this.instancesEl.scrollTop
        === (this.instancesEl.scrollHeight - this.instancesEl.clientHeight);
      this.createInstanceEl(evt.rcvdMsg.message.instanceID);
      if (doScroll) this.instancesEl.scrollTop = this.instancesEl.scrollHeight;
    }

    if (evt.name === 'insremoved') {
      const instance = this.instances.get(evt.rcvdMsg.message.instanceID);
      instance.remove();
      this.instances.delete(evt.rcvdMsg.message.instanceID);
    }

    if (['insrun', 'insstopped'].includes(evt.name)) {
      this.updateInstance(evt.rcvdMsg.message.instanceID);
    }
  }

  createInstanceEl(id, state) {
    const newInstance = document.createElement('div');
    newInstance.classList.add('instance');
    newInstance.setAttribute('data-id', id);
    this.instancesEl.insertBefore(newInstance, this.createEl);
    this.instances.set(id, newInstance);

    const idEl = document.createElement('div');
    idEl.classList.add('instance_id');
    idEl.textContent = id;
    newInstance.appendChild(idEl);

    // Status
    const statusEl = document.createElement('div');
    statusEl.classList.add('instance_status');
    newInstance.appendChild(statusEl);

    const statusTitleEl = document.createElement('div');
    statusTitleEl.classList.add('status_title');
    statusTitleEl.textContent = 'Status:';
    statusEl.appendChild(statusTitleEl);

    const statusImgEl = document.createElement('div');
    statusImgEl.classList.add('status_img');
    statusImgEl.classList.add(state === 'running' ? 'green' : 'red');
    statusEl.appendChild(statusImgEl);

    const statusNameEl = document.createElement('div');
    statusNameEl.classList.add('status_name');
    statusNameEl.textContent = state || 'Stopped';
    statusEl.appendChild(statusNameEl);

    // Actions
    const actionsEl = document.createElement('div');
    actionsEl.classList.add('instance_actions');
    newInstance.appendChild(actionsEl);

    const actionsTitleEl = document.createElement('div');
    actionsTitleEl.classList.add('actions_title');
    actionsTitleEl.textContent = 'Actions:';
    actionsEl.appendChild(actionsTitleEl);

    const startEl = document.createElement('div');
    startEl.classList.add('start_btn');
    actionsEl.appendChild(startEl);

    const stopEl = document.createElement('div');
    stopEl.classList.add('stop_btn');
    actionsEl.appendChild(stopEl);

    const removeEl = document.createElement('div');
    removeEl.classList.add('remove_btn');
    actionsEl.appendChild(removeEl);

    if (!state) this.updateInstance(id);
    else this.toggleStartStopButtons(id, state);
  }

  async updateInstance(id) {
    const instance = this.instances.get(id);
    if (!instance) return;

    const state = await this.getInstanceState(id);
    instance.querySelector('.status_name')
      .textContent = (state === 'running') ? 'Running' : 'Stopped';

    const statusImg = instance.querySelector('.status_img');
    statusImg.classList.remove('red');
    statusImg.classList.remove('green');
    statusImg.classList.add((state === 'running') ? 'green' : 'red');

    this.toggleStartStopButtons(id, state);
  }

  toggleStartStopButtons(id, state) {
    const instance = this.instances.get(id);
    if (!instance) return;

    const stopEl = instance.querySelector('.stop_btn');
    const startEl = instance.querySelector('.start_btn');

    if (state === 'running') {
      stopEl.classList.add('show');
      startEl.classList.remove('show');
    } else {
      stopEl.classList.remove('show');
      startEl.classList.add('show');
    }
  }

  async getAllInstances() {
    const array = await this.client.getInstances();
    array.forEach((o) => this.createInstanceEl(o.id, o.state));
  }

  async getInstanceState(id) {
    const instance = await this.client.getInstance(id);
    return instance.state;
  }

  bindToDOM(container) {
    this.container = container;
  }
}
