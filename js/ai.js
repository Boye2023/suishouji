// ============================================================
// ai.js — Simulated AI: title, tags, transcription
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;

  App.simulateDelay = function() {
    return new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));
  };

  App.generateTitle = function(note) {
    if (note.type === 'text' && note.textContent) {
      const cleaned = note.textContent.trim().replace(/^[，,。.！!？?\s\n\r]+/, '').replace(/\s+/g, ' ');
      if (cleaned.length > 0) return cleaned.slice(0, 25) + (cleaned.length > 25 ? '...' : '');
    }
    if (note.type === 'image') {
      if (note.textContent && note.textContent.trim()) {
        const c = note.textContent.trim().slice(0, 25);
        return c + (note.textContent.trim().length > 25 ? '...' : '');
      }
      return `图片笔记 ${App.formatTime(note.createdAt || Date.now())}`;
    }
    if (note.type === 'voice') {
      if (note.voiceTranscript && !note.voiceTranscript.startsWith('语音记录于')) {
        return note.voiceTranscript.slice(0, 20) + (note.voiceTranscript.length > 20 ? '...' : '');
      }
      return `语音记录 ${App.formatTime(note.createdAt || Date.now())}`;
    }
    return '未命名笔记';
  };

  App.generateTags = function(note) {
    const allText = [note.textContent || '', note.voiceTranscript || '', note.aiTitle || ''].join(' ');
    if (!allText.trim()) {
      if (note.type === 'image') return ['图片'];
      if (note.type === 'voice') return ['语音'];
      return ['笔记'];
    }
    const keywords = extractKeywords(allText);
    const baseTags = [];
    if (note.type === 'image') baseTags.push('图片');
    if (note.type === 'voice') baseTags.push('语音');
    const allTags = [...new Set([...keywords, ...baseTags])];
    return allTags.slice(0, 4);
  };

  function extractKeywords(text) {
    const tags = [];
    const categories = [
      { words: ['工作','项目','会议','汇报','计划','总结','方案','需求','进度','报告','老板','同事','客户','提案'], tag: '工作' },
      { words: ['学习','课程','笔记','读书','考试','复习','知识','教程','文章','书籍','论文','研究'], tag: '学习' },
      { words: ['生活','购物','清单','备忘','提醒','日常','家务','整理','清洁','美食','烹饪','食谱'], tag: '生活' },
      { words: ['灵感','创意','想法','点子','设计','写作','创作','构思','思路'], tag: '灵感' },
      { words: ['旅行','旅游','出行','攻略','景点','酒店','机票','行程','打卡'], tag: '旅行' },
      { words: ['健康','运动','健身','跑步','饮食','睡眠','体检','瑜伽','冥想'], tag: '健康' },
      { words: ['技术','代码','编程','开发','bug','API','前端','后端','算法','架构','部署'], tag: '技术' },
      { words: ['阅读','书单','摘抄','读后感','金句','引用','名言'], tag: '阅读' },
      { words: ['电影','音乐','剧集','综艺','播客','演出','展览','艺术'], tag: '娱乐' },
      { words: ['财务','理财','投资','股票','基金','预算','消费','账单','收入'], tag: '财务' },
      { words: ['重要','紧急','必须','截止','优先','关键'], tag: '重要' },
      { words: ['待办','TODO','任务','事项','完成','进行中'], tag: '待办' },
    ];
    for (const cat of categories) {
      for (const word of cat.words) {
        if (text.includes(word)) { tags.push(cat.tag); break; }
      }
    }
    return tags;
  }

  App.mockTranscribe = function(durationSeconds) {
    const d = new Date();
    const hour = d.getHours();
    const tod = hour < 6 ? '凌晨' : hour < 9 ? '早上' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : '晚上';
    const templates = [
      `这是一段${tod}的语音记录，时长约${Math.round(durationSeconds)}秒。内容涉及日常事务的记录和整理。`,
      `${tod}临时记录了一段想法，主要关于近期需要处理的一些事项和安排。`,
      `随手记录了一些${tod}的灵感和待办事项，方便后续回顾和整理。`,
      `${tod}语音备忘：记录了一些零散的想法和需要跟进的事情。`,
      `一段${tod}的语音笔记，包含了一些日常琐事的记录和提醒事项。`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  };

  App.processWithAI = async function(note) {
    await App.simulateDelay();
    const enriched = { ...note };
    if (note.type === 'voice' && !note.voiceTranscript && note.voiceDuration) {
      enriched.voiceTranscript = App.mockTranscribe(note.voiceDuration);
    }
    enriched.aiTitle = App.generateTitle(enriched);
    enriched.aiTags = App.generateTags(enriched);
    return enriched;
  };

})();
