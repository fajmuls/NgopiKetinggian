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
    await uploadBytes(storageRef, fileToUpload);
    return await getDownloadURL(storageRef);
};
