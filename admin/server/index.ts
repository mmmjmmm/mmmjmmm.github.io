import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`博客后台已启动：http://127.0.0.1:${config.port}`);
});
