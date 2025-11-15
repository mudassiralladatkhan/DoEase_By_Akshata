import './style.css';
import { App } from './src/app.js';

const appContainer = document.getElementById('app');
const app = new App(appContainer);
app.init();
