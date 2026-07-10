import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { AppService } from './app.service';

jest.mock('node:fs/promises');

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
    jest.clearAllMocks();
  });

  describe('getMessage', () => {
    it('reads data/test.txt from the process working directory', async () => {
      (readFile as jest.Mock).mockResolvedValue('hello from file');

      const result = await service.getMessage();

      expect(result).toEqual({ message: 'hello from file' });
      expect(readFile).toHaveBeenCalledWith(path.join(process.cwd(), 'data', 'test.txt'), 'utf8');
    });

    it('propagates errors when the file cannot be read', async () => {
      (readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(service.getMessage()).rejects.toThrow('ENOENT');
    });
  });

  describe('getHello', () => {
    it('returns a static greeting', () => {
      expect(service.getHello()).toBe('Hello World!');
    });
  });
});
