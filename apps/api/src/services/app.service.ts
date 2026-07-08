import { Injectable } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { join } from 'path'

@Injectable()
export class AppService {
  async getMessage() {
    const filePath = join(process.cwd(), 'data', 'test.txt')

    const content = await readFile(filePath, 'utf-8')

    return {
      message: content
    }
  }
  getHello(): string {
    return 'Hello World!'
  }
}
