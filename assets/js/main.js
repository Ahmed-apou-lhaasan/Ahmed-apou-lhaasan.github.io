// عناصر مشتركة بين كل الصفحات: الهيدر، الفوتر، أسماء المراحل
export const GRADE_LABELS = {
  "1": "الأول الإعدادي",
  "2": "الثاني الإعدادي",
  "3": "الثالث الإعدادي",
  "sec1": "الأول الثانوي",
  "sec2": "الثاني الثانوي",
  "grammar": "النحو والبلاغة"
};

export const RANK_TIERS = [
  { min: 0, name: "مكتشف", icon: "🔍" },
  { min: 15, name: "فارس الكلمة", icon: "⚔️" },
  { min: 40, name: "حارس البلاغة", icon: "🛡️" },
  { min: 80, name: "أسطورة الضاد", icon: "👑" }
];

/* ============== خطوط الهوية العربية ============== */
(function loadNeoFonts() {
  if (document.getElementById("neo-fonts")) return;
  const l = document.createElement("link");
  l.id = "neo-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Reem+Kufi:wght@500;700&display=swap";
  document.head.appendChild(l);
})();

/* ============== تأثير الموجة عند الضغط على الأزرار ============== */
if (!window.__rippleBound) {
  window.__rippleBound = true;
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".btn");
    if (!b) return;
    const rect = b.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const r = document.createElement("span");
    r.className = "btn-ripple";
    r.style.width = r.style.height = size + "px";
    r.style.left = (e.clientX - rect.left - size / 2) + "px";
    r.style.top = (e.clientY - rect.top - size / 2) + "px";
    b.appendChild(r);
    setTimeout(() => r.remove(), 650);
  });
}

export function renderHeader(activeGrade = "") {
  const student = getStudentSession();
  const navLinks = student
    ? `<a href="/grade.html?grade=${student.grade}" class="nav-link">${GRADE_LABELS[student.grade] || "قسمي"}</a>`
    : `        <a href="/grade.html?grade=1" class="nav-link">الأول الإعدادي</a>
        <a href="/grade.html?grade=2" class="nav-link">الثاني الإعدادي</a>
        <a href="/grade.html?grade=3" class="nav-link">الثالث الإعدادي</a>
        <a href="/grade.html?grade=sec1" class="nav-link">الأول الثانوي</a>
        <a href="/grade.html?grade=sec2" class="nav-link">الثاني الثانوي</a>
        <a href="/grade.html?grade=grammar" class="nav-link">النحو والبلاغة</a>`;
  return `
  <header class="site-header">
    <div class="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
      <a href="/index.html" class="flex items-center gap-3 text-inherit no-underline">
        <span class="brand-mark">أ</span>
        <div>
          <div class="font-bold leading-tight">الأستاذ أحمد</div>
          <div class="text-xs opacity-70 leading-tight">منصة اللغة العربية</div>
        </div>
      </a>
      <nav class="hidden sm:flex items-center gap-1">
        ${navLinks}
      </nav>
      <button id="menuBtn" class="sm:hidden nav-link" aria-label="القائمة">☰</button>
    </div>
    <nav id="mobileMenu" class="sm:hidden hidden flex-col px-4 pb-3 gap-1">
      ${navLinks.replace(/nav-link"/g, 'nav-link block"')}
    </nav>
    <div class="ornament-divider"></div>
  </header>`;
}

export function renderFooter() {
  const year = new Date().getFullYear();
  const student = getStudentSession();
  const studentLinks = student
    ? `<div class="text-xs mt-2">
         مرحباً <span class="font-bold">${escapeHtml(student.name)}</span> ·
         <a href="/results.html" class="opacity-70 hover:opacity-100">نتائجي</a> ·
         <a href="#" id="studentLogoutLink" class="opacity-70 hover:opacity-100">خروج</a>
       </div>`
    : `<a href="/student-login.html" class="opacity-40 hover:opacity-80 text-xs">دخول الطالب</a>`;
  return `
  <footer class="mt-16 border-t" style="border-color:var(--line)">
    <div class="max-w-6xl mx-auto px-4 py-8 text-center text-sm" style="color:var(--ink-2)">
      <div class="font-bold mb-1">أ / أحمد أبوالحسن — معلم لغة عربية</div>
      <div class="opacity-70 mb-1">للتواصل: 01029307604</div>
      <div class="opacity-70">جميع الحقوق محفوظة © ${year}</div>
      <a href="/admin/login.html" class="opacity-40 hover:opacity-80 text-xs">لوحة التحكم</a>
      <div class="text-xs mt-1">
        <a href="/leaderboard.html" class="opacity-70 hover:opacity-100">🏆 ترتيب الطلاب</a>
      </div>
      ${studentLinks}
    </div>
  </footer>`;
}

/* ============== جلسة تسجيل دخول الطالب (بدون Firebase Auth) ============== */
const STUDENT_SESSION_KEY = "studentSession";

export function getStudentSession() {
  try {
    const raw = localStorage.getItem(STUDENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStudentSession(data) {
  localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(data));
}

export function clearStudentSession() {
  localStorage.removeItem(STUDENT_SESSION_KEY);
}

/* ============== الشريط السفلي العائم ============== */
function renderBottomNav() {
  if (document.getElementById("bottomNav")) return;
  const s = getStudentSession();
  const path = location.pathname;
  let items;
  if (s) {
    items = [
      { href: "/index.html", ico: "🏠", label: "الرئيسية", active: path === "/" || path.endsWith("/index.html") },
      { href: `/grade.html?grade=${s.grade}#sec-lessons`, ico: "📘", label: "الدروس", active: path.endsWith("/grade.html") },
      { href: `/grade.html?grade=${s.grade}#sec-exams`, ico: "📝", label: "الامتحانات", active: path.endsWith("/exam.html") },
      { href: "/results.html", ico: "👤", label: "ملفي", active: path.endsWith("/results.html") }
    ];
  } else {
    items = [
      { href: "/index.html", ico: "🏠", label: "الرئيسية", active: path === "/" || path.endsWith("/index.html") },
      { href: "/student-login.html", ico: "🔑", label: "دخول الطالب", active: path.endsWith("/student-login.html") },
      { href: "/leaderboard.html", ico: "🏆", label: "الأوائل", active: path.endsWith("/leaderboard.html") }
    ];
  }
  const html = `
  <nav id="bottomNav" class="bottom-nav" aria-label="التنقل السريع">
    ${items.map(i => `
      <a href="${i.href}" class="${i.active ? "active" : ""}">
        <span class="bn-ico">${i.ico}</span>
        <span>${i.label}</span>
      </a>`).join("")}
  </nav>`;
  document.body.insertAdjacentHTML("beforeend", html);
}

/* ============== تعريف أقسام صفحة المرحلة (لروابط الشريط السفلي) ============== */
function tagSections() {
  const map = { "الدروس": "lessons", "الواجبات": "homework", "الامتحانات": "exams", "تحدي": "challenge" };
  document.querySelectorAll("main section h2").forEach(h => {
    Object.keys(map).forEach(k => {
      if (h.textContent.includes(k) && h.parentElement) h.parentElement.id = "sec-" + map[k];
    });
  });
  if (location.hash.startsWith("#sec-")) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 500);
  }
}

/* ============== كارت البروفايل (صفحة المرحلة للطالب) ============== */
function applyProfileXp(xp) {
  let idx = 0;
  RANK_TIERS.forEach((t, i) => { if (xp >= t.min) idx = i; });
  const cur = RANK_TIERS[idx];
  const next = RANK_TIERS[idx + 1];
  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  set("pcAvatar", cur.icon);
  set("pcRank", cur.name);
  set("pcXp", String(xp));
  const pct = next ? Math.min(100, Math.round(((xp - cur.min) / (next.min - cur.min)) * 100)) : 100;
  set("pcNext", next ? `باقي ${next.min - xp} نقطة لرتبة "${next.name}" ${next.icon}` : "وصلت لأعلى رتبة 👑");
  const fill = document.getElementById("pcFill");
  if (fill) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = Math.max(pct, 3) + "%"; }));
}

async function mountProfileCard() {
  const s = getStudentSession();
  if (!s || !location.pathname.endsWith("/grade.html")) return;
  const main = document.querySelector("main");
  if (!main || document.getElementById("profileCard")) return;
  const first = RANK_TIERS[0];
  main.insertAdjacentHTML("afterbegin", `
  <div id="profileCard" class="profile-card">
    <div class="profile-top">
      <div id="pcAvatar" class="profile-avatar">${first.icon}</div>
      <div class="flex-1">
        <div class="text-xs" style="color:var(--ink-2)">أهلاً بيك يا بطل</div>
        <div class="display text-xl">${escapeHtml(s.name)}</div>
        <div id="pcRank" class="text-sm font-bold" style="color:var(--gold-light)">${first.name}</div>
      </div>
      <div class="text-center">
        <div id="pcXp" class="display text-2xl">0</div>
        <div class="text-xs" style="color:var(--ink-2)">نقطة</div>
      </div>
    </div>
    <div class="xp-track"><div id="pcFill" class="xp-fill"></div></div>
    <div id="pcNext" class="text-xs mt-2" style="color:var(--ink-2)">جاري حساب تقدمك...</div>
  </div>`);
  try {
    const { db, collection, getDocs, query, where } = await import("/assets/js/firebase-config.js");
    let xp = 0;
    const rs = await getDocs(query(collection(db, "examResults"), where("studentId", "==", s.id)));
    rs.forEach(d => { xp += Number(d.data().score) || 0; });
    const cs = await getDocs(query(collection(db, "challenges"), where("grade", "==", s.grade)));
    cs.forEach(d => {
      const c = d.data();
      if ((c.completedStudentIds || []).includes(s.id)) xp += Number(c.xpReward) || 0;
    });
    applyProfileXp(xp);
  } catch (e) {
    console.error(e);
    applyProfileXp(0);
  }
}

export function mountLayout() {
  document.getElementById("app-header").innerHTML = renderHeader();
  document.getElementById("app-footer").innerHTML = renderFooter();
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (btn) btn.addEventListener("click", () => menu.classList.toggle("hidden"));
  const logoutLink = document.getElementById("studentLogoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      clearStudentSession();
      location.href = "/index.html";
    });
  }
  if (!document.getElementById("waFab")) {
    document.body.insertAdjacentHTML("beforeend", renderWhatsappButton());
  }
  renderBottomNav();
  tagSections();
  mountProfileCard();
}

export function renderWhatsappButton() {
  const msg = encodeURIComponent("مرحباً أستاذ أحمد، أنا حابب أستفسر عن الاشتراك في المنصة");
  return `
  <a id="waFab" href="https://wa.me/201029307604?text=${msg}" target="_blank" class="whatsapp-fab" aria-label="تواصل عبر واتساب">
    <svg width="28" height="28" viewBox="0 0 32 32" fill="white"><path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.703 4.612 1.909 6.472L4 29l7.727-1.867A11.94 11.94 0 0 0 16.001 27C22.627 27 28 21.627 28 15S22.627 3 16.001 3zm0 21.818a9.77 9.77 0 0 1-4.98-1.363l-.357-.213-4.586 1.108 1.127-4.47-.232-.367A9.78 9.78 0 0 1 6.182 15c0-5.42 4.4-9.818 9.819-9.818 5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818zm5.406-7.354c-.297-.148-1.757-.867-2.03-.966-.272-.099-.47-.148-.669.148-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.148-1.253-.462-2.386-1.472-.882-.786-1.478-1.756-1.65-2.053-.173-.297-.018-.457.13-.605.134-.133.297-.347.446-.52.148-.174.198-.298.297-.496.099-.198.05-.372-.025-.52-.075-.148-.669-1.612-.916-2.208-.242-.58-.487-.502-.669-.512l-.57-.01c-.198 0-.52.075-.792.372-.272.297-1.04 1.017-1.04 2.48 0 1.463 1.065 2.877 1.213 3.075.148.198 2.096 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.757-.718 2.005-1.412.247-.694.247-1.288.173-1.412-.074-.124-.272-.198-.569-.347z"/></svg>
  </a>`;
}

export function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

export function fireConfetti() {
  const colors = ["#E85D75", "#3EC1D3", "#F9C74F", "#9B5DE5", "#43AA8B", "#B8863C"];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = Math.random() * 100 + "vw";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (2 + Math.random() * 1.5) + "s";
    el.style.animationDelay = (Math.random() * 0.3) + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}
