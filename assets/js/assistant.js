// مساعد الأستاذ أحمد: رسائل ذكية للطالب + تحليل نقاط الضعف (بدون سيرفر)
import { db, collection, getDocs, query, where } from "/assets/js/firebase-config.js";
import { escapeHtml, getStudentSession } from "/assets/js/main.js";

const DAY = 24 * 60 * 60 * 1000;

function greeting(name) {
  const h = new Date().getHours();
  const first = (name || "").trim().split(/\s+/)[0] || "يا بطل";
  const hi = h >= 5 && h < 12 ? "صباح الخير" : (h >= 12 && h < 17 ? "أهلاً بيك" : "مساء الخير");
  return `${hi} يا ${first} 👋`;
}

function daysUntil(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today0) / DAY);
}

async function pick(name, field, value) {
  try {
    const snap = await getDocs(query(collection(db, name), where(field, "==", value)));
    const rows = [];
    snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
    return rows;
  } catch (e) {
    console.error(name, e);
    return [];
  }
}

async function fetchAll(session) {
  const g = session.grade;
  const [results, exams, homework, challenges, lessons] = await Promise.all([
    pick("examResults", "studentId", session.id),
    pick("exams", "grade", g),
    pick("homework", "grade", g),
    pick("challenges", "grade", g),
    pick("lessons", "grade", g)
  ]);
  return { results, exams, homework, challenges, lessons };
}

function analyzeTopics(results) {
  const t = {};
  results.forEach(r => {
    (r.answersDetail || []).forEach(a => {
      const topic = (a.topic || "").trim();
      if (!topic) return;
      if (!t[topic]) t[topic] = { topic, total: 0, wrong: 0 };
      t[topic].total += 1;
      if (!a.isCorrect) t[topic].wrong += 1;
    });
  });
  return Object.values(t)
    .filter(x => x.total >= 3)
    .map(x => ({ ...x, rightPct: Math.round(((x.total - x.wrong) / x.total) * 100) }))
    .sort((a, b) => a.rightPct - b.rightPct);
}

function findLesson(lessons, topic) {
  const sorted = lessons.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return sorted.find(l => (l.title || "").includes(topic)) || sorted.find(l => l.branch === topic) || null;
}

function buildMessages(session, data, weak) {
  const msgs = [];
  const { results, exams, homework, challenges, lessons } = data;
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  homework.forEach(h => {
    if ((h.submittedStudentIds || []).includes(session.id)) return;
    if (!h.dueDate) return;
    const d = daysUntil(h.dueDate);
    if (d === null) return;
    if (d < 0) msgs.push({ p: 1, ico: "⏰", text: `واجب «${h.title}» ميعاده عدّى من ${-d} يوم ولسه ما اتسلمش. سلّمه بأسرع وقت.` });
    else if (d === 0) msgs.push({ p: 2, ico: "⏰", text: `النهاردة آخر ميعاد لواجب «${h.title}». لو لسه ما سلمتوش، دلوقتي الوقت.` });
    else if (d === 1) msgs.push({ p: 2, ico: "📚", text: `بكرة آخر ميعاد لواجب «${h.title}». خلّصه النهاردة وريّح دماغك.` });
    else if (d <= 3) msgs.push({ p: 3, ico: "📚", text: `باقي ${d} أيام على تسليم واجب «${h.title}».` });
  });

  const doneIds = new Set(results.map(r => r.examId));
  const pending = exams
    .filter(e => !doneIds.has(e.id))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (pending.length === 1) {
    msgs.push({ p: 3, ico: "✏️", text: `فيه امتحان لسه ما حليتوش: «${pending[0].title}». ادخل حلّه وأنا هتابع نتيجتك.`, href: `/exam.html?id=${pending[0].id}`, cta: "ابدأ الامتحان" });
  } else if (pending.length > 1) {
    msgs.push({ p: 3, ico: "✏️", text: `فيه ${pending.length} امتحانات لسه ما حليتهمش، وأحدثهم «${pending[0].title}».`, href: `/exam.html?id=${pending[0].id}`, cta: "ابدأ بأحدثهم" });
  }

  challenges.forEach(c => {
    if (c.expiresAt && c.expiresAt < today) return;
    if ((c.completedStudentIds || []).includes(session.id)) return;
    msgs.push({ p: 4, ico: "🎯", text: `فيه تحدي «${c.title}» بيدّيك ${c.xpReward || 0} نقطة لو أنجزته.` });
  });

  if (weak.length && weak[0].rightPct < 70) {
    const w = weak[0];
    const lesson = findLesson(lessons, w.topic);
    const m = { p: 4.5, ico: "🔎", text: `أكتر حاجة محتاجة تركّز فيها: «${w.topic}». جاوبت صح ${w.rightPct}% بس (${w.total - w.wrong} من ${w.total}).` };
    if (lesson) { m.href = `/lesson.html?id=${lesson.id}`; m.cta = `راجع «${lesson.title}»`; }
    msgs.push(m);
  }

  const fresh = lessons
    .filter(l => l.createdAt && now - l.createdAt < 3 * DAY)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
  if (fresh) {
    msgs.push({ p: 5, ico: "🔥", text: `نزل درس جديد: «${fresh.title}». شوفه وهو لسه طازة.`, href: `/lesson.html?id=${fresh.id}`, cta: "افتح الدرس" });
  }

  if (results.length === 0) {
    msgs.push({ p: 6, ico: "🚀", text: "لسه ما حليتش أي امتحان. ابدأ بأول واحد وأنا هبدأ أتابع تقدمك." });
  } else {
    const last = results.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
    const pct = last.total ? Math.round((last.score / last.total) * 100) : 0;
    const weekCount = results.filter(r => r.createdAt && now - r.createdAt < 7 * DAY).length;
    let t;
    if (pct >= 90) t = `برافو! آخر امتحان («${last.examTitle}») جبت فيه ${pct}% 👏 كمّل على نفس المستوى.`;
    else if (pct >= 60) t = `آخر امتحان («${last.examTitle}») جبت فيه ${pct}%. كويس، وتقدر توصل لـ 90% لو راجعت أخطاءك.`;
    else t = `آخر امتحان («${last.examTitle}») كان ${pct}%. مفيش مشكلة، المهم نعرف الغلط فين ونصلحه 💪`;
    t += weekCount ? ` وحليت ${weekCount} امتحان الأسبوع ده.` : " ولسه ما حليتش امتحان الأسبوع ده.";
    msgs.push({ p: 6, ico: "📈", text: t });
  }

  if (!msgs.length) {
    msgs.push({ p: 9, ico: "👌", text: "كل حاجة متابعة ومخلصة. لو عايز تتدرب أكتر، راجع دروسك القديمة." });
  }
  return msgs;
}

function render(session, msgs, weak) {
  const main = document.querySelector("main");
  if (!main || document.getElementById("assistantCard")) return;

  const bubbles = msgs.map((m, i) => `
    <div class="bubble" style="animation-delay:${(0.3 + i * 0.45).toFixed(2)}s">
      <span class="bubble-ico">${m.ico}</span>
      <div class="flex-1">
        <div>${escapeHtml(m.text)}</div>
        ${m.href ? `<a class="bubble-cta" href="${escapeHtml(m.href)}">${escapeHtml(m.cta || "افتح")} ←</a>` : ""}
      </div>
    </div>`).join("");

  const weakRows = weak.slice(0, 3).map(w => `
    <div class="weak-row">
      <div class="flex justify-between text-xs mb-1"><span>${escapeHtml(w.topic)}</span><span>${w.rightPct}% صح (${w.total - w.wrong}/${w.total})</span></div>
      <div class="weak-track"><div class="weak-fill ${w.rightPct < 50 ? "low" : (w.rightPct < 75 ? "mid" : "")}" style="width:${w.rightPct}%"></div></div>
    </div>`).join("");
  const weakBlock = weakRows
    ? `<div class="weak-box"><div class="text-sm font-bold mb-2">🔎 أضعف نقاطك حتى الآن</div>${weakRows}</div>`
    : "";

  const html = `
  <div id="assistantCard" class="assistant-card">
    <div class="assistant-head">
      <div class="assistant-avatar">🦉</div>
      <div>
        <div class="font-bold">مساعد الأستاذ أحمد</div>
        <div class="text-xs" style="color:var(--ink-2)">${escapeHtml(greeting(session.name))}</div>
      </div>
    </div>
    ${bubbles}
    ${weakBlock}
  </div>`;

  const pc = document.getElementById("profileCard");
  if (pc) pc.insertAdjacentHTML("afterend", html);
  else main.insertAdjacentHTML("afterbegin", html);
}

export async function mountAssistant() {
  const session = getStudentSession();
  if (!session) return;
  try {
    const data = await fetchAll(session);
    const weak = analyzeTopics(data.results);
    const msgs = buildMessages(session, data, weak).sort((a, b) => a.p - b.p).slice(0, 4);
    render(session, msgs, weak);
  } catch (e) {
    console.error(e);
  }
}
