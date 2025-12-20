// assets/app.js
(function () {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ----- NAV active -----
  function markActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    $$(".nav a").forEach(a => {
      const href = (a.getAttribute("href") || "").split("/").pop();
      if (href === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  // ----- Clocks (VN/KR) -----
  const fmtVN = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "2-digit",
    day: "2-digit"
  });
  const fmtKR = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "2-digit",
    day: "2-digit"
  });

  function tickClocks() {
    const now = new Date();
    const vnEl = $("[data-clock='vn']");
    const krEl = $("[data-clock='kr']");
    if (vnEl) vnEl.textContent = fmtVN.format(now);
    if (krEl) krEl.textContent = fmtKR.format(now);
  }

  // ----- Current schedule -----
  function parseISO(s){ return new Date(s).getTime(); }

  function getScheduleStatus(events) {
    const now = Date.now();
    const sorted = [...events].sort((a,b)=>parseISO(a.start)-parseISO(b.start));

    const current = sorted.find(ev => now >= parseISO(ev.start) && now < parseISO(ev.end));
    if (current) return { type:"current", ev: current };

    const next = sorted.find(ev => now < parseISO(ev.start));
    if (next) return { type:"next", ev: next };

    return { type:"done", ev: sorted[sorted.length-1] || null };
  }

  function formatInVN(iso) {
    // "VN" 제거하고 시간만 표시
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      month: "2-digit",
      day: "2-digit"
    }).format(d);
  }

  function renderCurrentSchedule() {
    const host = $("[data-current-schedule]");
    if (!host || !window.CONEXTT?.scheduleEvents) return;

    const { type, ev } = getScheduleStatus(window.CONEXTT.scheduleEvents);
    if (!ev) {
      host.innerHTML = `<div class="event"><div class="title">일정 데이터가 없습니다.</div></div>`;
      return;
    }

    // "다음 일정"일 때는 badge 없음
    const badge =
      type === "current" ? `<span class="pill primary">지금 진행중</span>` :
      type === "done"    ? `<span class="pill">마지막 일정</span>` :
                           '';

    // "일정표 바로가기" 버튼 추가 (다음 일정이 있을 때만)
    const scheduleBtn = type === "next" || type === "current"
      ? `<div style="margin-top:12px;"><a class="btn primary" href="schedule.html#tab=itinerary">일정표 바로가기</a></div>`
      : '';

    host.innerHTML = `
      <div class="event ${type==='current' ? 'current':''}">
        <div class="meta">
          ${badge}
          <span class="tag">${formatInVN(ev.start)} ~ ${formatInVN(ev.end)}</span>
        </div>
        <div class="title">${ev.title}</div>
        <div class="desc">${ev.place || ""}${ev.note ? `<br><small>※ ${ev.note}</small>` : ""}</div>
        ${scheduleBtn}
      </div>
    `;
  }

  // ----- Highlight timeline items (schedule page) -----
  function highlightTimeline() {
    const items = $$("[data-ev-start][data-ev-end]");
    if (!items.length) return;

    const now = Date.now();
    items.forEach(el => {
      const s = parseISO(el.getAttribute("data-ev-start"));
      const e = parseISO(el.getAttribute("data-ev-end"));
      if (now >= s && now < e) el.classList.add("current");
      else el.classList.remove("current");
    });
  }

  // ----- Tabs -----
  function initTabs() {
    const root = $("[data-tabs]");
    if (!root) return;

    const tablist = $("[role='tablist']", root);
    const tabs = $$("[role='tab']", tablist);
    const panels = $$("[role='tabpanel']", root);

    function activate(id) {
      tabs.forEach(t => t.setAttribute("aria-selected", t.dataset.tab === id ? "true":"false"));
      panels.forEach(p => p.classList.toggle("active", p.dataset.panel === id));
      location.hash = `#tab=${encodeURIComponent(id)}`;
    }

    tabs.forEach(t => {
      t.addEventListener("click", () => activate(t.dataset.tab));
    });

    // hash restore
    const m = location.hash.match(/tab=([^&]+)/);
    if (m) activate(decodeURIComponent(m[1]));
    else activate(tabs[0]?.dataset.tab || "prep");
  }

  // ----- Checklist persistence -----
  function initChecklist() {
    const inputs = $$("input[type='checkbox'][data-store]");
    if (!inputs.length) return;

    inputs.forEach(chk => {
      const key = chk.getAttribute("data-store");
      const saved = localStorage.getItem(key);
      if (saved === "1") chk.checked = true;

      chk.addEventListener("change", () => {
        localStorage.setItem(key, chk.checked ? "1":"0");
      });
    });
  }

  // ----- Vietnamese phrases (localStorage) -----
  function initVietnamese() {
    const box = $("#vn-phrases");
    if (!box) return;

    const KEY = "conextt_vn_phrases_v1";

    const defaults = [
      { cat:"기본 인사", ko:"안녕하세요", vi:"Xin chào", pr:"신짜오", note:"가장 기본 인사" },
      { cat:"기본 인사", ko:"감사합니다", vi:"Cảm ơn", pr:"깜언", note:"정중하게는 'Cảm ơn bạn'도 사용" },
      { cat:"기본 인사", ko:"죄송합니다", vi:"Xin lỗi", pr:"씬로이", note:"미안/실례 모두 가능" },

      { cat:"가게/주문", ko:"이거 얼마예요?", vi:"Cái này bao nhiêu tiền?", pr:"까이 나이 바오 니에우 띠엔?", note:"가격 물어볼 때" },
      { cat:"가게/주문", ko:"안 맵게 해주세요", vi:"Không cay", pr:"콤 까이", note:"'Ít cay(잇 까이)'=조금 맵게" },
      { cat:"가게/주문", ko:"계산해 주세요", vi:"Tính tiền", pr:"띤 띠엔", note:"" },

      { cat:"교통/이동", ko:"여기서 내려주세요", vi:"Dừng ở đây", pr:"중 어다이", note:"택시/그랩" },
      { cat:"교통/이동", ko:"…로 가주세요", vi:"Cho tôi đi đến …", pr:"쪼 또이 디 덴 …", note:"목적지 말하면 됨" },

      { cat:"숙소/응급", ko:"의사가 필요해요", vi:"Tôi cần bác sĩ", pr:"또이 껀 박씨", note:"" },
      { cat:"숙소/응급", ko:"도와주세요", vi:"Giúp tôi với!", pr:"줍 또이 보이!", note:"긴급/부탁" },
    ];

    function load() {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        localStorage.setItem(KEY, JSON.stringify(defaults));
        return [...defaults];
      }
      try { return JSON.parse(raw); } catch { return [...defaults]; }
    }

    function save(list) {
      localStorage.setItem(KEY, JSON.stringify(list));
    }

    function render(list, filterCat="전체") {
      const wrap = $("#vn-list");
      const rows = list
        .filter(x => filterCat==="전체" ? true : x.cat===filterCat)
        .map((x, idx) => `
          <tr>
            <td>${x.cat}</td>
            <td><b>${x.ko}</b></td>
            <td>${x.vi}</td>
            <td>${x.pr || ""}</td>
            <td>${x.note || ""}</td>
            <td><button class="btn ghost" data-del="${idx}">삭제</button></td>
          </tr>
        `).join("");

      wrap.innerHTML = rows || `<tr><td colspan="6">표시할 문장이 없습니다.</td></tr>`;

      // delete handlers
      $$("[data-del]").forEach(btn => {
        btn.addEventListener("click", () => {
          const i = Number(btn.getAttribute("data-del"));
          const filtered = list
            .filter(x => filterCat==="전체" ? true : x.cat===filterCat);
          const target = filtered[i];
          const newList = list.filter(x => x !== target);
          save(newList);
          render(newList, filterCat);
        });
      });
    }

    const list = load();

    // category filter
    const cats = ["전체", ...Array.from(new Set(list.map(x=>x.cat)))];
    const sel = $("#vn-filter");
    sel.innerHTML = cats.map(c=>`<option value="${c}">${c}</option>`).join("");
    sel.addEventListener("change", ()=>render(load(), sel.value));

    // add form
    $("#vn-add").addEventListener("submit", (e) => {
      e.preventDefault();
      const cat = $("#vn-cat").value.trim() || "기타";
      const ko  = $("#vn-ko").value.trim();
      const vi  = $("#vn-vi").value.trim();
      const pr  = $("#vn-pr").value.trim();
      const note= $("#vn-note").value.trim();
      if (!ko || !vi) return alert("한국어/베트남어는 필수입니다.");

      const cur = load();
      cur.unshift({ cat, ko, vi, pr, note });
      save(cur);

      // reset
      e.target.reset();

      // refresh categories if new
      const curCats = ["전체", ...Array.from(new Set(cur.map(x=>x.cat)))];
      sel.innerHTML = curCats.map(c=>`<option value="${c}">${c}</option>`).join("");
      sel.value = "전체";
      render(cur, "전체");
    });

    // google translate helper
    $("#vn-gt-btn").addEventListener("click", () => {
      const q = $("#vn-gt-input").value.trim();
      if (!q) return;
      const url = `https://translate.google.com/?sl=ko&tl=vi&text=${encodeURIComponent(q)}&op=translate`;
      window.open(url, "_blank", "noopener,noreferrer");
    });

    render(list, "전체");
  }
  // ----- Exchange rate (KRW <-> VND) -----
  function initFx() {
    // index.html 에만 존재 (없으면 조용히 return)
    const rateEl = $("#fx-rate");
    if (!rateEl) return;

    const updatedEl = $("#fx-updated");
    const noteEl = $("#fx-note");
    const refreshBtn = $("#fx-refresh");
    const amountEl = $("#fx-amount");
    const dirEl = $("#fx-direction");
    const resultEl = $("#fx-result");

    // 무료 환율 API (USD 기준) -> KRW/VND 교차환산
    const API = "https://open.er-api.com/v6/latest/USD";
    const CACHE_KEY = "conextt_fx_cache_v1";

    const fmtKRW = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
    const fmtVND = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

    let fx = null; // { vndPerKrw, krwPerVnd, updatedAtMs }

    function showRate() {
      if (!fx) return;
      rateEl.textContent =
        `1 KRW ≈ ${fx.vndPerKrw.toFixed(2)} VND · 1,000 VND ≈ ${fmtKRW.format(Math.round(fx.krwPerVnd * 1000))} KRW`;

      if (updatedEl) {
        updatedEl.textContent = `업데이트: ${new Date(fx.updatedAtMs).toLocaleString("ko-KR")}`;
      }
      if (noteEl) {
        noteEl.textContent = "출처: open.er-api.com (USD 기준 교차환산)";
      }
    }

    function compute() {
      if (!fx || !amountEl || !dirEl || !resultEl) return;

      const raw = (amountEl.value || "").replace(/,/g, "").trim();
      if (!raw) {
        resultEl.textContent = "—";
        return;
      }

      const amount = Number(raw);
      if (!Number.isFinite(amount)) {
        resultEl.textContent = "숫자를 입력해주세요";
        return;
      }

      const dir = dirEl.value || "KRW_TO_VND";
      if (dir === "KRW_TO_VND") {
        const vnd = amount * fx.vndPerKrw;
        resultEl.textContent = `${fmtKRW.format(amount)} KRW ≈ ${fmtVND.format(Math.round(vnd))} VND`;
      } else {
        const krw = amount * fx.krwPerVnd;
        resultEl.textContent = `${fmtVND.format(amount)} VND ≈ ${fmtKRW.format(Math.round(krw))} KRW`;
      }
    }

    async function load() {
      rateEl.textContent = "불러오는 중…";
      if (updatedEl) updatedEl.textContent = "";
      if (noteEl) noteEl.textContent = "";

      try {
        const res = await fetch(API, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.result !== "success" || !data.rates) {
          throw new Error("API 응답 형식이 예상과 다릅니다.");
        }

        const usdToKrw = data.rates.KRW;
        const usdToVnd = data.rates.VND;
        if (!usdToKrw || !usdToVnd) {
          throw new Error("KRW/VND 환율 정보를 찾지 못했습니다.");
        }

        fx = {
          vndPerKrw: usdToVnd / usdToKrw,
          krwPerVnd: usdToKrw / usdToVnd,
          updatedAtMs: (data.time_last_update_unix || Date.now() / 1000) * 1000,
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify(fx));
        showRate();
        compute();
      } catch (e) {
        console.error(e);
        rateEl.textContent = "환율을 불러오지 못했습니다.";
        if (noteEl) noteEl.textContent = "네트워크 상태를 확인하거나, 잠시 후 다시 시도해주세요.";
      }
    }

    // 캐시 먼저 표시 (오프라인/느린 네트워크 대비)
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && cached.vndPerKrw && cached.krwPerVnd && cached.updatedAtMs) {
        fx = cached;
        showRate();
      }
    } catch (_) {}

    if (refreshBtn) refreshBtn.addEventListener("click", load);
    if (amountEl) amountEl.addEventListener("input", compute);
    if (dirEl) dirEl.addEventListener("change", compute);

    // 최초 1회 최신값 갱신 시도
    load();
  }

  // ----- Init -----
  markActiveNav();
  initTabs();
  initChecklist();
  initVietnamese();
  initFx();

  tickClocks();
  renderCurrentSchedule();
  highlightTimeline();

  setInterval(() => {
    tickClocks();
    renderCurrentSchedule();
    highlightTimeline();
  }, 1000 * 15);
})();
