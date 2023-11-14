import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import * as Templates from './template';
import type { UserData } from './mock';

async function stream2buffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
	return new Promise<Buffer>((resolve, reject) => {
		const _buf = Array<Uint8Array>();

		stream.on('data', (chunk) => _buf.push(chunk));
		stream.on('end', () => resolve(Buffer.concat(_buf)));
		stream.on('error', (err) => reject(`error converting stream - ${err}`));
	});
}

export const generateDoc = async (data: UserData) => {
	const rs = await ReactPDF.renderToStream(<Templates.MyDocument data={data} />);

	const buffer = await stream2buffer(rs);

	return buffer;
};
