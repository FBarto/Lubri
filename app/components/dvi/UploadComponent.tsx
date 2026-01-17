'use client';

import { useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface UploadedFile {
    url: string;
    type: 'IMAGE' | 'VIDEO';
    description?: string;
}

interface UploadComponentProps {
    onUploadComplete: (files: UploadedFile[]) => void;
}

export default function UploadComponent({ onUploadComplete }: UploadComponentProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            const newFile: UploadedFile = {
                url: data.url,
                type: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE',
                description: file.name
            };

            const updatedList = [...uploadedFiles, newFile];
            setUploadedFiles(updatedList);
            onUploadComplete(updatedList);
        } catch (error) {
            console.error(error);
            alert('Error al subir archivo');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const removeFile = (index: number) => {
        const updatedList = uploadedFiles.filter((_, i) => i !== index);
        setUploadedFiles(updatedList);
        onUploadComplete(updatedList);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <input
                    type="file"
                    id="dvi-upload"
                    accept="image/*,video/*"
                    capture="environment" // Open camera on mobile
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                <label
                    htmlFor="dvi-upload"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold cursor-pointer transition-all ${uploading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                        }`}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <Camera className="w-5 h-5" />
                            Adjuntar Foto/Video
                        </>
                    )}
                </label>
            </div>

            {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square">
                            {file.type === 'IMAGE' ? (
                                <Image
                                    src={file.url}
                                    alt="Evidencia"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <video src={file.url} className="w-full h-full object-cover" controls />
                            )}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
