// ============================================================
// image-uploader.js — Image file input + drag-drop + thumbnail
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;
  let pendingFile = null, pendingThumbnail = null;
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const THUMBNAIL_MAX_DIM = 200;

  App.initImageUploader = function({ onFileSelected, onFileRemoved, onError }) {
    const dropZone = document.getElementById('imageDropZone');
    const fileInput = document.getElementById('imageFileInput');
    const previewContainer = document.getElementById('imagePreview');
    const previewImg = document.getElementById('imagePreviewImg');
    const captionWrapper = document.getElementById('imageCaptionWrapper');
    const captionInput = document.getElementById('imageCaptionInput');
    const removeBtn = document.getElementById('btnRemoveImage');
    const sendBtn = document.getElementById('btnSendImage');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.add('image-drop-zone--active');
    });
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove('image-drop-zone--active');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove('image-drop-zone--active');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    removeBtn.addEventListener('click', () => { clearImage(); if (onFileRemoved) onFileRemoved(); });

    captionInput.addEventListener('input', () => { sendBtn.disabled = !pendingFile; });

    sendBtn.addEventListener('click', () => {
      if (pendingFile && onFileSelected) {
        onFileSelected({ file: pendingFile, thumbnail: pendingThumbnail, caption: captionInput.value.trim() });
      }
    });

    async function handleFile(file) {
      if (!file.type.startsWith('image/')) { if (onError) onError('请选择图片文件'); return; }
      if (file.size > MAX_FILE_SIZE) { if (onError) onError('图片大小不能超过20MB'); return; }
      try {
        const thumbnail = await generateThumbnail(file);
        pendingFile = file; pendingThumbnail = thumbnail;
        App.setState('pendingImage', { file, thumbnailBlob: thumbnail });
        const url = URL.createObjectURL(thumbnail);
        previewImg.src = url;
        previewContainer.classList.remove('hidden');
        dropZone.parentElement.style.display = 'none';
        captionWrapper.classList.remove('hidden');
        captionInput.value = '';
        captionInput.focus();
        sendBtn.disabled = false;
      } catch(err) {
        console.error('Image error:', err);
        if (onError) onError('图片处理失败');
      }
    }

    function clearImage() {
      if (previewImg.src) URL.revokeObjectURL(previewImg.src);
      pendingFile = null; pendingThumbnail = null;
      App.setState('pendingImage', null);
      previewContainer.classList.add('hidden');
      previewImg.src = '';
      dropZone.parentElement.style.display = 'block';
      captionWrapper.classList.add('hidden');
      captionInput.value = '';
      sendBtn.disabled = true;
    }
  };

  async function generateThumbnail(file, maxDim = THUMBNAIL_MAX_DIM) {
    if ('createImageBitmap' in window) {
      try {
        const bitmap = await createImageBitmap(file, { resizeWidth: maxDim, resizeHeight: maxDim, resizeQuality: 'medium' });
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0); bitmap.close();
        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('toBlob failed')); }, 'image/jpeg', 0.75);
        });
      } catch(e) { console.warn('createImageBitmap failed:', e); }
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('toBlob failed')); }, 'image/jpeg', 0.7);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }

  App.clearPendingImage = function() {
    const previewImg = document.getElementById('imagePreviewImg');
    const previewContainer = document.getElementById('imagePreview');
    const dropZone = document.getElementById('imageDropZone');
    const captionWrapper = document.getElementById('imageCaptionWrapper');
    const captionInput = document.getElementById('imageCaptionInput');
    const sendBtn = document.getElementById('btnSendImage');
    if (previewImg && previewImg.src) URL.revokeObjectURL(previewImg.src);
    pendingFile = null; pendingThumbnail = null;
    App.setState('pendingImage', null);
    if (previewContainer) previewContainer.classList.add('hidden');
    if (previewImg) previewImg.src = '';
    if (dropZone) dropZone.parentElement.style.display = 'block';
    if (captionWrapper) captionWrapper.classList.add('hidden');
    if (captionInput) captionInput.value = '';
    if (sendBtn) sendBtn.disabled = true;
  };

})();
