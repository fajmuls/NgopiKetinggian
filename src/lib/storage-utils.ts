import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

export const uploadFile = async (file: File, folder: string): Promise<string> => {
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
        const options = {
            maxSizeMB: 0.5, // 500KB Max
            maxWidthOrHeight: 1280,
            useWebWorker: true
        };
        try {
            fileToUpload = await imageCompression(file, options);
        } catch (error) {
            console.error("Compression failed, uploading original.", error);
        }
    }
    
    // We add .jpg.jpeg inside so even webp from compression gives the right format
    const extension = fileToUpload.name.split('.').pop();
    const fileName = `${Date.now()}_img.${extension}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    try {
        await uploadBytes(storageRef, fileToUpload);
        return await getDownloadURL(storageRef);
    } catch (e: any) {
        console.error("Firebase Storage Upload Error: ", e);
        if (e.code === 'storage/unauthorized') {
            throw new Error('Anda tidak memiliki izin mengunggah foto. Pastikan Anda sudah login, dan aturan Firebase Storage diset ke true untuk user.');
        } else if (e.code === 'storage/unknown' || e.message?.toLowerCase().includes('bucket')) {
            throw new Error('Firebase Storage belum diaktifkan di Firebase Console Anda. Silakan ke Firebase Console -> Storage -> Get Started.');
        } else {
            throw new Error(`Gagal mengunggah foto. Error: ${e.message}`);
        }
    }
};
