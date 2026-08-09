import { randomBytes } from 'node:crypto';
import { stdin, stdout } from 'node:process';
import { argon2id } from 'hash-wasm';

async function hiddenInput(prompt: string) {
  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('请在终端中运行这个命令');
  }

  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  return new Promise<string>((resolve, reject) => {
    let value = '';

    function cleanUp() {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
    }

    function onData(chunk: string) {
      if (chunk === '\u0003') {
        cleanUp();
        stdout.write('\n');
        reject(new Error('已取消'));
        return;
      }
      if (chunk === '\r' || chunk === '\n') {
        cleanUp();
        stdout.write('\n');
        resolve(value);
        return;
      }
      if (chunk === '\u007f' || chunk === '\b') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }
      if (/^[^\u0000-\u001f\u007f]+$/u.test(chunk)) {
        value += chunk;
        stdout.write('*'.repeat([...chunk].length));
      }
    }

    stdin.on('data', onData);
  });
}

try {
  const password = await hiddenInput('设置后台密码：');
  if (password.length < 10) throw new Error('密码至少需要 10 个字符');
  const confirmation = await hiddenInput('再次输入密码：');
  if (password !== confirmation) throw new Error('两次输入的密码不一致');

  const hash = await argon2id({
    password,
    salt: randomBytes(16),
    iterations: 2,
    parallelism: 1,
    memorySize: 19_456,
    hashLength: 32,
    outputType: 'encoded',
  });
  stdout.write(`\n${hash}\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
