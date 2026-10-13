import './styles/global.css';
import './styles/animations.css';
import '@fontsource-variable/exo-2';
import '@fontsource-variable/rubik';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import GameApp from './GameApp.vue';

createApp(GameApp).use(createPinia()).mount('#root');