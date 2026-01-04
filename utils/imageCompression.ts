/**
 * Compresses an image file by resizing and reducing quality
 * Target: Under 5MB for Pixel 10 photos (originally ~10MB)
 */
export async function compressImage(file: File, maxSizeMB: number = 5): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 2048px on longest side)
        let width = img.width;
        let height = img.height;
        const maxDimension = 2048;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to get under target size
        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              const fileSizeMB = blob.size / (1024 * 1024);
              
              // If still too large and quality can be reduced, try again
              if (fileSizeMB > maxSizeMB && quality > 0.5) {
                tryCompress(quality - 0.1);
                return;
              }
              
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              console.log(`Image compressed: ${(file.size / (1024 * 1024)).toFixed(2)}MB → ${fileSizeMB.toFixed(2)}MB (${quality * 100}% quality)`);
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        
        // Start with 85% quality (good balance of quality and file size)
        tryCompress(0.85);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Validates and prepares an image file for upload
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  // Check if file is larger than 5MB - if so, compress it
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (fileSizeMB > 5) {
    console.log(`Image is ${fileSizeMB.toFixed(2)}MB, compressing...`);
    return await compressImage(file, 5);
  }
  
  // Already small enough
  console.log(`Image is ${fileSizeMB.toFixed(2)}MB, no compression needed`);
  return file;
}
