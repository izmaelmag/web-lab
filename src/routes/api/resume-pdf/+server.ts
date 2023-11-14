import { UploadClient } from '@uploadcare/upload-client';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDoc } from './generate-doc';
import { DemoResume } from './mock';

// export const GET: RequestHandler = ({ url }) => {
// 	const min = Number(url.searchParams.get('min') ?? '0');
// 	const max = Number(url.searchParams.get('max') ?? '1');
// 	const d = max - min;
// 	if (isNaN(d) || d < 0) {
// 		throw error(400, 'min and max must be numbers, and min must be less than max');
// 	}
// 	const random = min + Math.random() * d;
// 	return new Response(String(random));
// };

const client = new UploadClient({ publicKey: 'b6a27e1f38912067e9ba' });

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	console.log(data);

	const buffer = await generateDoc(DemoResume);

	const uploadResponse = await client.uploadFile(buffer, {
		fileName: 'resume.pdf',
		contentType: 'application/pdf'
	});

	console.log(uploadResponse);

	return new Response(JSON.stringify({ url: uploadResponse.cdnUrl }), {
		status: 200,
		statusText: 'works fine',
		headers: {
			'content-type': 'application/json'
		}
	});
};
