import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `dvi/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        const bucket = storage.bucket(); // Uses default bucket from service account or config
        // Note: If no default bucket is in service account, we might need to specify it. 
        // Admin SDK usually infers it if configured, or we can assume it's set.
        // Let's try default. If it fails, user might need to add `storageBucket` to init.

        const fileRef = bucket.file(filename);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        await fileRef.makePublic();

        // Construct public URL
        // Format: https://storage.googleapis.com/BUCKET_NAME/FILENAME
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
