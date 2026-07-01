// ============================================================
// note-card.js — Note card renderer
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;

  App.renderNoteCard = function(note) {
    const card = document.createElement('div');
    card.className = `note-card note-card--${note.type}`;
    card.dataset.noteId = note.id;

    // Header
    const header = document.createElement('div');
    header.className = 'note-card__header';
    const title = document.createElement('div');
    title.className = 'note-card__title';
    title.textContent = note.aiTitle || '未命名笔记';
    const time = document.createElement('span');
    time.className = 'note-card__time';
    time.textContent = App.formatTime(note.createdAt);
    header.appendChild(title); header.appendChild(time);

    // Delete
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'note-card__delete';
    deleteBtn.innerHTML = '✕';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('确定删除这条记录吗？')) {
        await App.deleteNote(note.id);
        card.style.transition = 'all 0.2s ease';
        card.style.opacity = '0'; card.style.transform = 'scale(0.95)';
        card.style.maxHeight = card.offsetHeight + 'px';
        requestAnimationFrame(() => { card.style.maxHeight = '0'; card.style.padding = '0'; card.style.marginBottom = '0'; });
        setTimeout(() => { card.remove(); window.dispatchEvent(new CustomEvent('note-deleted', { detail: { id: note.id } })); }, 250);
      }
    });
    card.appendChild(deleteBtn);
    card.appendChild(header);

    // Body
    if (note.type === 'image' && note.imageThumbnail) {
      const img = document.createElement('img');
      img.className = 'note-card__image';
      img.src = URL.createObjectURL(note.imageThumbnail);
      img.alt = note.aiTitle || '图片';
      img.loading = 'lazy';
      img._objectUrl = img.src;
      card.appendChild(img);
      if (note.textContent) {
        const body = document.createElement('div');
        body.className = 'note-card__body';
        body.textContent = note.textContent;
        card.appendChild(body);
      }
    } else if (note.type === 'voice') {
      const vc = document.createElement('div');
      vc.className = 'note-card__voice';
      const playBtn = document.createElement('button');
      playBtn.className = 'note-card__play-btn';
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
      const playIcon = playBtn.querySelector('svg');
      let audio = null, isPlaying = false;
      playBtn.addEventListener('click', () => {
        if (!audio && note.voiceBlob) {
          const url = URL.createObjectURL(note.voiceBlob);
          audio = new Audio(url); audio._objectUrl = url;
          audio.addEventListener('ended', () => { isPlaying = false; playBtn.classList.remove('note-card__play-btn--playing'); playIcon.innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor"/>'; });
          audio.addEventListener('error', () => { isPlaying = false; playBtn.classList.remove('note-card__play-btn--playing'); playIcon.innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor"/>'; });
        }
        if (audio) {
          if (isPlaying) { audio.pause(); isPlaying = false; playBtn.classList.remove('note-card__play-btn--playing'); playIcon.innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor"/>'; }
          else { audio.play(); isPlaying = true; playBtn.classList.add('note-card__play-btn--playing'); playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>'; }
        }
      });
      const infoDiv = document.createElement('div');
      infoDiv.className = 'note-card__voice-info';
      const durEl = document.createElement('div');
      durEl.className = 'note-card__voice-duration';
      durEl.textContent = `语音 ${App.formatDuration(note.voiceDuration || 0)}`;
      const transEl = document.createElement('div');
      transEl.className = 'note-card__voice-transcript';
      transEl.textContent = note.voiceTranscript || '(转写中...)';
      infoDiv.appendChild(durEl); infoDiv.appendChild(transEl);
      vc.appendChild(playBtn); vc.appendChild(infoDiv);
      card.appendChild(vc);
      if (note.voiceTranscript) {
        const tf = document.createElement('div');
        tf.className = 'note-card__body';
        tf.style.cssText = 'margin-top:8px;font-size:13px;color:#8E8E93;';
        tf.textContent = note.voiceTranscript;
        card.appendChild(tf);
      }
    } else if (note.type === 'text' || note.textContent) {
      const body = document.createElement('div');
      body.className = 'note-card__body';
      body.textContent = note.textContent || '';
      card.appendChild(body);
    }

    // Tags
    if (note.aiTags && note.aiTags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'note-card__tags';
      note.aiTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'note-card__tag';
        tagEl.textContent = tag;
        tagsDiv.appendChild(tagEl);
      });
      card.appendChild(tagsDiv);
    }

    return card;
  };

})();
