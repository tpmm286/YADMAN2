import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface ExportFileOptions {
  fileName: string;
  blob: Blob;
  mimeType: string;
  shareTitle?: string;
  shareText?: string;
}

/**
 * Converts a Blob to a base64 string (without data URL prefix)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Universal file export handler that works seamlessly across:
 * 1. Native Android APK (Capacitor)
 * 2. Mobile browsers (Android Chrome, Samsung Internet, Safari)
 * 3. Desktop browsers (Windows, Mac, Linux)
 */
export async function exportFile({
  fileName,
  blob,
  mimeType,
  shareTitle = 'دانلود فایل',
  shareText = 'خروجی فایل از سامانه یادمان',
}: ExportFileOptions): Promise<{ success: boolean; method: string; message?: string }> {
  try {
    // -----------------------------------------------------------------
    // 1. Native Android / iOS APK (Capacitor)
    // -----------------------------------------------------------------
    if (Capacitor.isNativePlatform()) {
      const base64Data = await blobToBase64(blob);

      // First write file to Cache directory (guaranteed accessible uri)
      const cachedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Also attempt to write to Documents for persistent file saving
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });
      } catch (docErr) {
        console.warn('Could not save to Documents directory, cache URI will be used:', docErr);
      }

      // Trigger native Android Share dialog (allows user to save to Downloads, open in PDF viewer, or send)
      await Share.share({
        title: shareTitle,
        text: shareText,
        url: cachedFile.uri,
        dialogTitle: 'ذخیره یا باز کردن فایل',
      });

      return {
        success: true,
        method: 'capacitor-native',
        message: 'فایل با موفقیت در دستگاه آماده شد.',
      };
    }

    // -----------------------------------------------------------------
    // 2. Mobile Web Browser (Android / iOS Browser with Web Share API)
    // -----------------------------------------------------------------
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      try {
        // Attempt file sharing if supported by browser
        const file = new File([blob], fileName, { type: mimeType });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: shareText,
          });
          return {
            success: true,
            method: 'web-share-file',
            message: 'فایل آماده اشتراک و ذخیره شد.',
          };
        }
      } catch (shareErr) {
        console.log('Web share files failed or dismissed, falling back to download link:', shareErr);
      }
    }

    // -----------------------------------------------------------------
    // 3. Desktop / Standard Browser Anchor Download
    // -----------------------------------------------------------------
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = fileName;
    downloadAnchor.style.display = 'none';
    downloadAnchor.target = '_blank';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();

    setTimeout(() => {
      if (downloadAnchor.parentNode) {
        downloadAnchor.parentNode.removeChild(downloadAnchor);
      }
      URL.revokeObjectURL(blobUrl);
    }, 4000);

    return {
      success: true,
      method: 'anchor-blob',
      message: 'فایل دانلود شد.',
    };
  } catch (error: any) {
    console.error('File export error:', error);

    // Fallback: try Data URI for older browsers where blob url is blocked
    try {
      const base64 = await blobToBase64(blob);
      const dataUri = `data:${mimeType};base64,${base64}`;
      const fallbackAnchor = document.createElement('a');
      fallbackAnchor.href = dataUri;
      fallbackAnchor.download = fileName;
      fallbackAnchor.target = '_blank';
      document.body.appendChild(fallbackAnchor);
      fallbackAnchor.click();
      setTimeout(() => {
        if (fallbackAnchor.parentNode) fallbackAnchor.parentNode.removeChild(fallbackAnchor);
      }, 2000);

      return {
        success: true,
        method: 'data-uri-fallback',
        message: 'فایل دانلود شد.',
      };
    } catch (fallbackErr) {
      return {
        success: false,
        method: 'failed',
        message: error?.message || 'خطا در صدور فایل.',
      };
    }
  }
}

/**
 * Copies text content directly to clipboard with multiple browser fallbacks
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue to legacy fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
