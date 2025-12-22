import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Here you can limit file types or sizes
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          tokenPayload: JSON.stringify({ }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after the file is successfully in the cloud
        console.log('Upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}