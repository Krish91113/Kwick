import { MockStorageProvider } from '../../src/storage/mock.provider';

describe('Unit: Storage Provider', () => {
  let provider: MockStorageProvider;

  beforeEach(() => {
    provider = new MockStorageProvider();
  });

  it('should upload a buffer and return metadata', async () => {
    const buffer = Buffer.from('test file data');
    const result = await provider.upload(buffer, {
      storageKey: 'test_key_1',
      contentType: 'text/plain',
      originalName: 'test.txt'
    });

    expect(result.storageKey).toBe('test_key_1');
    expect(result.bytes).toBe(buffer.length);
    expect(provider.has('test_key_1')).toBe(true);
  });

  it('should delete a stored item', async () => {
    const buffer = Buffer.from('delete me');
    await provider.upload(buffer, {
      storageKey: 'test_del',
      contentType: 'text/plain',
      originalName: 'del.txt'
    });

    expect(provider.has('test_del')).toBe(true);
    await provider.delete('test_del');
    expect(provider.has('test_del')).toBe(false);
  });

  it('should return a readable stream for download', async () => {
    const content = 'streamable content';
    const buffer = Buffer.from(content);
    await provider.upload(buffer, {
      storageKey: 'stream_test',
      contentType: 'text/plain',
      originalName: 'stream.txt'
    });

    const stream = await provider.getDownloadStream('stream_test');
    expect(stream).not.toBeNull();

    const chunks: Buffer[] = [];
    for await (const chunk of stream!) {
      chunks.push(chunk as Buffer);
    }
    const downloadedText = Buffer.concat(chunks).toString('utf8');
    expect(downloadedText).toBe(content);
  });
});
