// ============================================================
// voice-recorder.js — MediaRecorder wrapper with waveform
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;
  let mediaRecorder = null, audioStream = null, audioChunks = [];
  let recordingStartTime = 0, timerInterval = null, animationId = null;
  let audioContext = null, analyser = null, wakeLock = null;

  App.initVoiceRecorder = function({ onRecordingStart, onRecordingStop, onError }) {
    const recordBtn = document.getElementById('btnVoiceRecord');
    const timerEl = document.getElementById('voiceTimer');
    const statusEl = document.getElementById('voiceStatus');
    const canvas = document.getElementById('voiceWaveform');
    const ctx = canvas.getContext('2d');
    let isRecording = false;

    drawIdleWaveform(ctx, canvas.width, canvas.height);

    recordBtn.addEventListener('click', async () => {
      if (isRecording) { await stopRecording(); }
      else { await startRecording(); }
    });

    async function startRecording() {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 16000 }
        });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(audioStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);

        const mimeType = ['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
        mediaRecorder = new MediaRecorder(audioStream, { mimeType, audioBitsPerSecond: 32000 });
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunks, { type: mimeType });
          const duration = (Date.now() - recordingStartTime) / 1000;
          if (audioStream) { audioStream.getTracks().forEach(t => t.stop()); audioStream = null; }
          if (audioContext && audioContext.state !== 'closed') { audioContext.close(); audioContext = null; analyser = null; }
          if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
          onRecordingStop({ blob, duration });
        };
        try { wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
        mediaRecorder.start(150);
        recordingStartTime = Date.now();
        isRecording = true;
        recordBtn.classList.add('voice-record-btn--recording');
        timerEl.classList.add('voice-recorder__timer--recording');
        timerEl.textContent = '00:00';
        statusEl.textContent = '录音中...';
        timerInterval = setInterval(() => {
          const elapsed = (Date.now() - recordingStartTime) / 1000;
          timerEl.textContent = App.formatDuration(elapsed);
          if (elapsed >= 270 && elapsed < 271) statusEl.textContent = '录音将在30秒后自动停止';
          if (elapsed >= 300) stopRecording();
        }, 200);
        animateWaveform(ctx, canvas.width, canvas.height);
        if (onRecordingStart) onRecordingStart();
      } catch(err) {
        console.error('Mic error:', err);
        if (onError) onError(err);
      }
    }

    async function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        await new Promise(resolve => {
          const orig = mediaRecorder.onstop;
          mediaRecorder.onstop = (e) => { if (orig) orig.call(mediaRecorder, e); resolve(); };
        });
      }
      isRecording = false;
      clearInterval(timerInterval); timerInterval = null;
      cancelAnimationFrame(animationId); animationId = null;
      recordBtn.classList.remove('voice-record-btn--recording');
      timerEl.classList.remove('voice-recorder__timer--recording');
      timerEl.textContent = '00:00';
      statusEl.textContent = '点击开始录音';
      drawIdleWaveform(ctx, canvas.width, canvas.height);
    }
  };

  function drawIdleWaveform(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#E8E8ED'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
  }

  function animateWaveform(ctx, w, h) {
    if (!analyser) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    function draw() {
      animationId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#E8E8ED'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
      ctx.strokeStyle = '#FF6B6B'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(w, h/2); ctx.stroke();
    }
    draw();
  }

  App.isVoiceSupported = function() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

})();
