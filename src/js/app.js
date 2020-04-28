import InstanceClient from './InstanceClient';
import ConsoleLogger from './ConsoleLogger';
import WorklogWidget from './WorklogWidget';
import ControlPanelWidget from './ControlPanelWidget';

const url = 'https://alex-m18-ahj-sse-dashboard.herokuapp.com';

const client = new InstanceClient(url);

// eslint-disable-next-line no-unused-vars
const consoleLogger = new ConsoleLogger(client);

const cpWidget = new ControlPanelWidget(client);
cpWidget.bindToDOM(document.body.querySelector('.cloud_dashboard'));
cpWidget.init();

const logWidget = new WorklogWidget(client);
logWidget.bindToDOM(document.body.querySelector('.cloud_dashboard'));
logWidget.init();
