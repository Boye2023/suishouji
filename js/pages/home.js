// ============================================================
// home.js — Home page: Quick record
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;

  App.mountHomePage = function() {
    initNoteTypeSelector();
    initTextInput();
    initImageSection();
    initVoiceSection();

    if (!App.isVoiceSupported()) {
      const voiceBtn = document.querySelector('[data-type="voice"]');
      if (voiceBtn) { voiceBtn.style.opacity = '0.4'; voiceBtn.title = '当前浏览器不支持录音'; }
    }
  };

  App.unmountHomePage = function() {};

  function initNoteTypeSelector() {
    const buttons = document.querySelectorAll('.note-type-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        buttons.forEach(b => b.classList.remove('note-type-btn--active'));
        btn.classList.add('note-type-btn--active');
        document.querySelectorAll('.record-view').forEach(v => v.classList.remove('record-view--active'));
        const viewMap = { text: 'viewText', image: 'viewImage', voice: 'viewVoice' };
        const viewEl = document.getElementById(viewMap[type]);
        if (viewEl) viewEl.classList.add('record-view--active');
        App.setState('noteType', type);
      });
    });
  }

  function initTextInput() {
    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('textCharCount');
    const sendBtn = document.getElementById('btnSendText');
    if (!textInput) return;

    textInput.addEventListener('input', () => {
      const len = textInput.value.length;
      charCount.textContent = `${len}/5000`;
      sendBtn.disabled = len === 0;
    });

    sendBtn.addEventListener('click', async () => {
      const content = textInput.value.trim();
      if (!content) return;
      sendBtn.disabled = true;
      showAI(true);
      try {
        const note = await App.processWithAI({ type: 'text', textContent: content });
        await App.saveNote(note);
        textInput.value = '';
        charCount.textContent = '0/5000';
        showToast('文字记录已保存');
      } catch(err) {
        console.error('Save text error:', err);
        showToast('保存失败，请重试', true);
      } finally {
        showAI(false);
        sendBtn.disabled = false;
      }
    });

    window.addEventListener('page-changed', (e) => {
      if (e.detail.page === 'home' && App.getState('noteType') === 'text') {
        setTimeout(() => textInput.focus(), 300);
      }
    });
    setTimeout(() => textInput.focus(), 500);
  }

  function initImageSection() {
    App.initImageUploader({
      onFileSelected: async ({ file, thumbnail, caption }) => {
        showAI(true);
        try {
          const note = await App.processWithAI({ type: 'image', textContent: caption || '', imageBlob: file, imageThumbnail: thumbnail });
          await App.saveNote(note);
          App.clearPendingImage();
          showToast('图片记录已保存');
        } catch(err) {
          console.error('Save image error:', err);
          showToast('保存失败，请重试', true);
        } finally { showAI(false); }
      },
      onFileRemoved: () => {},
      onError: (msg) => showToast(msg, true)
    });
  }

  function initVoiceSection() {
    App.initVoiceRecorder({
      onRecordingStart: () => {},
      onRecordingStop: async ({ blob, duration }) => {
        showAI(true);
        try {
          const note = await App.processWithAI({ type: 'voice', voiceBlob: blob, voiceDuration: duration });
          await App.saveNote(note);
          showToast('语音记录已保存');
        } catch(err) {
          console.error('Save voice error:', err);
          showToast('保存失败，请重试', true);
        } finally { showAI(false); }
      },
      onError: (err) => {
        if (err.name === 'NotAllowedError') showToast('请允许使用麦克风', true);
        else if (err.name === 'NotFoundError') showToast('未检测到麦克风设备', true);
        else showToast('录音失败，请重试', true);
      }
    });
  }

  function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (!toast) return;
    toast.classList.remove('toast--visible', 'toast--error');
    toastText.textContent = message;
    if (isError) toast.classList.add('toast--error');
    void toast.offsetWidth;
    toast.classList.add('toast--visible');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('toast--visible'), 2000);
  }

  function showAI(show) {
    const overlay = document.getElementById('aiProcessing');
    if (overlay) { if (show) overlay.classList.remove('hidden'); else overlay.classList.add('hidden'); }
  }

})();
