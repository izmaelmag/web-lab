export const stream2buffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<Uint8Array>();

    stream.on('data', (chunk) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err) => reject(`error converting stream - ${err}`));
  });
};
