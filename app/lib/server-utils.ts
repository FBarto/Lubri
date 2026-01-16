import { revalidatePath } from 'next/cache';

// Helper for safe revalidation
// This is in a separate file to avoid 'use server' conflicts
export function safeRevalidate(path: string) {
    try {
        revalidatePath(path);
    } catch (e) {
        // Ignored during testing/script execution or if outside request context
    }
}
