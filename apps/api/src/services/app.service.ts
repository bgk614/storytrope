import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

@Injectable()
export class AppService {
  async getMessage() {
    const filePath = path.join(process.cwd(), 'data', 'test.txt');

    const content = await readFile(filePath, 'utf8');

    return {
      message: content,
    };
  }
  getHello(): string {
    return 'Hello World!';
  }
}
