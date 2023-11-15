import { UploadClient } from '@uploadcare/upload-client';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Resume } from '$lib/modules/resume/Resume';

const client = new UploadClient({ publicKey: 'b6a27e1f38912067e9ba' });

export const POST: RequestHandler = async ({ request }) => {
	const { document } = await request.json();

	const resume = new Resume(document);

	const isValid = resume.isValid;

	if (isValid) {
		const buffer = await resume.render();

		const uploadResponse = await client.uploadFile(buffer, {
			fileName: 'resume.pdf',
			contentType: 'application/pdf'
		});

		return new Response(JSON.stringify({ url: uploadResponse.cdnUrl }), {
			status: 200,
			statusText: 'uploaded',
			headers: {
				'content-type': 'application/json'
			}
		});
	} else {
		throw error(400, resume.error);
	}
};
