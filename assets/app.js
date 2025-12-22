// assets/app.js
(function () {
  var $ = function(sel, root) {
    root = root || document;
    return root.querySelector(sel);
  };
  var $$ = function(sel, root) {
    root = root || document;
    return Array.from(root.querySelectorAll(sel));
  };

  // NAV active
  function markActiveNav() {
    var path = location.pathname.split("/").pop() || "index.html";
    $$(".nav a").forEach(function(a) {
      var href = (a.getAttribute("href") || "").split("/").pop();
      if (href === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  // Clocks (VN/KR)
  var fmtVN = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "2-digit",
    day: "2-digit"
  });
  var fmtKR = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "2-digit",
    day: "2-digit"
  });

  function tickClocks() {
    var now = new Date();
    var vnEl = $("[data-clock='vn']");
    var krEl = $("[data-clock='kr']");
    if (vnEl) vnEl.textContent = fmtVN.format(now);
    if (krEl) krEl.textContent = fmtKR.format(now);
  }

  // Current schedule
  function parseISO(s) {
    return new Date(s).getTime();
  }

  function getScheduleStatus(events) {
    var now = Date.now();
    var sorted = events.slice().sort(function(a, b) {
      return parseISO(a.start) - parseISO(b.start);
    });

    var current = sorted.find(function(ev) {
      return now >= parseISO(ev.start) && now < parseISO(ev.end);
    });
    if (current) return { type: "current", ev: current };

    var next = sorted.find(function(ev) {
      return now < parseISO(ev.start);
    });
    if (next) return { type: "next", ev: next };

    return { type: "done", ev: sorted[sorted.length - 1] || null };
  }

  function formatTime(iso) {
    var d = new Date(iso);
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(d);
  }

  function formatDateTime(iso) {
    var d = new Date(iso);
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
    var host = $("[data-current-schedule]");
    if (!host || !window.CONEXTT || !window.CONEXTT.scheduleEvents) return;

    var result = getScheduleStatus(window.CONEXTT.scheduleEvents);
    var type = result.type;
    var ev = result.ev;

    if (!ev) {
      host.innerHTML = '<div class="current-event-box"><div class="current-event-title">일정 데이터가 없습니다.</div></div>';
      return;
    }

    var statusBadge = "";
    var statusClass = "";
    if (type === "current") {
      statusBadge = '<span class="current-badge current">진행중</span>';
      statusClass = "active";
    } else if (type === "next") {
      statusBadge = '<span class="current-badge next">다음 일정</span>';
      statusClass = "";
    } else {
      statusBadge = '<span class="current-badge done">마지막 일정</span>';
      statusClass = "";
    }

    var html = "";

    // 분리 일정 (관광조/골프조)
    if (ev.type === "split") {
      html = '<div class="current-event-box ' + statusClass + '">' +
        '<div class="current-event-header">' + statusBadge + '</div>' +
        '<div class="current-split-schedule">' +
          // 관광조
          '<div class="current-split-col">' +
            '<div class="current-split-header">🎢 관광조</div>' +
            '<div class="current-split-body">' +
              '<div class="current-split-time">' + ev.tour.times + '</div>' +
              '<div class="current-split-title">' + ev.tour.title + '</div>' +
              '<div class="current-split-place">' + ev.tour.place + '</div>' +
            '</div>' +
          '</div>' +
          // 골프조
          '<div class="current-split-col">' +
            '<div class="current-split-header">🏌️ 골프조</div>' +
            '<div class="current-split-body">' +
              '<div class="current-split-time">' + ev.golf.times + '</div>' +
              '<div class="current-split-title">' + ev.golf.title + '</div>' +
              '<div class="current-split-place">' + ev.golf.place + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<a class="btn primary" href="schedule.html#tab=itinerary" style="margin-top:12px;">일정표 바로가기</a>' +
      '</div>';
    } 
    // 공통 일정
    else {
      var noteHtml = ev.note ? '<div class="current-event-note">* ' + ev.note + '</div>' : '';
      
      html = '<div class="current-event-box ' + statusClass + '">' +
        '<div class="current-event-header">' + statusBadge + '</div>' +
        '<div class="current-event-content">' +
          '<div class="current-event-time">' + formatDateTime(ev.start) + ' ~ ' + formatDateTime(ev.end) + '</div>' +
          '<div class="current-event-title">' + ev.title + '</div>' +
          '<div class="current-event-place">' + (ev.place || '') + '</div>' +
          noteHtml +
        '</div>' +
        '<a class="btn primary" href="schedule.html#tab=itinerary" style="margin-top:12px;">일정표 바로가기</a>' +
      '</div>';
    }

    host.innerHTML = html;
  }

  // Highlight timeline items (schedule page)
  function highlightTimeline() {
    var items = $$("[data-ev-start][data-ev-end]");
    if (!items.length) return;

    var now = Date.now();
    items.forEach(function(el) {
      var s = parseISO(el.getAttribute("data-ev-start"));
      var e = parseISO(el.getAttribute("data-ev-end"));
      if (now >= s && now < e) el.classList.add("current");
      else el.classList.remove("current");
    });
  }

  // Tabs
  function initTabs() {
    var root = $("[data-tabs]");
    if (!root) return;

    var tablist = $("[role='tablist']", root);
    var tabs = $$("[role='tab']", tablist);
    var panels = $$("[role='tabpanel']", root);

    function activate(id) {
      tabs.forEach(function(t) {
        t.setAttribute("aria-selected", t.dataset.tab === id ? "true" : "false");
      });
      panels.forEach(function(p) {
        p.classList.toggle("active", p.dataset.panel === id);
      });
      location.hash = "#tab=" + encodeURIComponent(id);
    }

    tabs.forEach(function(t) {
      t.addEventListener("click", function() {
        activate(t.dataset.tab);
      });
    });

    // hash restore
    var m = location.hash.match(/tab=([^&]+)/);
    if (m) {
      activate(decodeURIComponent(m[1]));
    } else {
      activate(tabs[0] ? tabs[0].dataset.tab : "prep");
    }
  }

  // Checklist persistence
  function initChecklist() {
    var inputs = $$("input[type='checkbox'][data-store]");
    if (!inputs.length) return;

    inputs.forEach(function(chk) {
      var key = chk.getAttribute("data-store");
      var saved = localStorage.getItem(key);
      if (saved === "1") chk.checked = true;

      chk.addEventListener("change", function() {
        localStorage.setItem(key, chk.checked ? "1" : "0");
      });
    });
  }

  // Vietnamese phrases (fixed data)
  function initVietnamese() {
    var box = $("#vn-phrases");
    if (!box) return;

    var phrases = [
      // 기본 인사 (10)
      { cat: "기본 인사", ko: "안녕하세요", vi: "Xin chào", pr: "신 짜오", note: "가장 기본적인 인사" },
      { cat: "기본 인사", ko: "감사합니다", vi: "Cảm ơn", pr: "깜 언", note: "더 정중: Cảm ơn bạn" },
      { cat: "기본 인사", ko: "천만에요", vi: "Không có gì", pr: "콤 꺼 지", note: "감사에 대한 답" },
      { cat: "기본 인사", ko: "죄송합니다 / 실례합니다", vi: "Xin lỗi", pr: "신 로이", note: "사과/실례 모두 사용" },
      { cat: "기본 인사", ko: "네 / 아니요", vi: "Vâng / Không", pr: "벙 / 콤", note: "기본 응답" },
      { cat: "기본 인사", ko: "안녕히 가세요", vi: "Tạm biệt", pr: "땀 비엣", note: "작별 인사" },
      { cat: "기본 인사", ko: "만나서 반갑습니다", vi: "Rất vui được gặp bạn", pr: "럿 부이 드억 갑 반", note: "처음 만날 때" },
      { cat: "기본 인사", ko: "저는 한국 사람입니다", vi: "Tôi là người Hàn Quốc", pr: "또이 라 응어이 한 꾸억", note: "국적 소개" },
      { cat: "기본 인사", ko: "이름이 뭐예요?", vi: "Bạn tên là gì?", pr: "반 뗀 라 지?", note: "이름 묻기" },
      { cat: "기본 인사", ko: "잠시만요", vi: "Chờ một chút", pr: "쩌 못 쭛", note: "기다려 달라고 할 때" },

      // 가게/주문 (10)
      { cat: "가게/주문", ko: "이거 얼마예요?", vi: "Cái này bao nhiêu tiền?", pr: "까이 나이 바오 니에우 띠엔?", note: "가격 물어볼 때" },
      { cat: "가게/주문", ko: "너무 비싸요", vi: "Đắt quá", pr: "닷 꽈", note: "가격 흥정할 때" },
      { cat: "가게/주문", ko: "깎아주세요", vi: "Giảm giá đi", pr: "잠 자 디", note: "할인 요청" },
      { cat: "가게/주문", ko: "계산해 주세요", vi: "Tính tiền", pr: "띤 띠엔", note: "계산할 때" },
      { cat: "가게/주문", ko: "메뉴판 주세요", vi: "Cho tôi xem menu", pr: "쪼 또이 쎔 메뉴", note: "식당에서" },
      { cat: "가게/주문", ko: "이거 주세요", vi: "Cho tôi cái này", pr: "쪼 또이 까이 나이", note: "주문할 때" },
      { cat: "가게/주문", ko: "물 주세요", vi: "Cho tôi nước", pr: "쪼 또이 느억", note: "물 요청" },
      { cat: "가게/주문", ko: "안 맵게 해주세요", vi: "Không cay", pr: "콤 까이", note: "맵지 않게" },
      { cat: "가게/주문", ko: "조금만 맵게 해주세요", vi: "Ít cay thôi", pr: "잇 까이 토이", note: "약간 맵게" },
      { cat: "가게/주문", ko: "맛있어요!", vi: "Ngon quá!", pr: "응온 꽈!", note: "맛있다고 할 때" },

      // 교통/이동 (10)
      { cat: "교통/이동", ko: "여기로 가주세요", vi: "Cho tôi đến đây", pr: "쪼 또이 덴 다이", note: "지도/주소 보여주며 (자연스러움)" },
      { cat: "교통/이동", ko: "공항으로 가주세요", vi: "Đi sân bay", pr: "디 선 바이", note: "공항 이동" },
      { cat: "교통/이동", ko: "호텔로 가주세요", vi: "Đi khách sạn", pr: "디 칵 산", note: "호텔 이동" },
      { cat: "교통/이동", ko: "여기서 내려주세요", vi: "Dừng ở đây", pr: "증 어 다이", note: "택시/그랩 하차" },
      { cat: "교통/이동", ko: "얼마나 걸려요?", vi: "Mất bao lâu?", pr: "멋 바오 라우?", note: "소요시간 질문" },
      { cat: "교통/이동", ko: "여기가 어디예요?", vi: "Đây là đâu?", pr: "다이 라 더우?", note: "현재 위치 질문" },
      { cat: "교통/이동", ko: "지도 좀 보여주세요", vi: "Cho tôi xem bản đồ", pr: "쪼 또이 쎔 반 도", note: "지도 요청" },
      { cat: "교통/이동", ko: "직진해 주세요", vi: "Đi thẳng", pr: "디 탕", note: "방향 지시" },
      { cat: "교통/이동", ko: "좌회전 / 우회전", vi: "Rẽ trái / Rẽ phải", pr: "쩨 짜이 / 쩨 파이", note: "방향 지시" },
      { cat: "교통/이동", ko: "천천히 가주세요", vi: "Đi chậm thôi", pr: "디 쩜 토이", note: "속도 늦춰달라고" },

      // 숙소/응급 (10)
      { cat: "숙소/응급", ko: "체크인 하고 싶어요", vi: "Tôi muốn nhận phòng", pr: "또이 무온 년 퐁", note: "호텔 체크인" },
      { cat: "숙소/응급", ko: "체크아웃 하고 싶어요", vi: "Tôi muốn trả phòng", pr: "또이 무온 짜 퐁", note: "호텔 체크아웃" },
      { cat: "숙소/응급", ko: "방 열쇠 주세요", vi: "Cho tôi chìa khóa phòng", pr: "쪼 또이 찌아 코아 퐁", note: "열쇠 요청" },
      { cat: "숙소/응급", ko: "와이파이 비밀번호가 뭐예요?", vi: "Mật khẩu Wi-Fi là gì?", pr: "멋 커우 와이파이 라 지?", note: "Wi-Fi 비번" },
      { cat: "숙소/응급", ko: "에어컨이 안 돼요", vi: "Máy lạnh bị hỏng", pr: "마이 라인 비 홍", note: "에어컨 고장" },
      { cat: "숙소/응급", ko: "도와주세요!", vi: "Giúp tôi với!", pr: "줍 또이 버이!", note: "긴급 도움 요청" },
      { cat: "숙소/응급", ko: "의사가 필요해요", vi: "Tôi cần bác sĩ", pr: "또이 껀 박 씨", note: "의사 호출" },
      { cat: "숙소/응급", ko: "병원에 가고 싶어요", vi: "Tôi muốn đi bệnh viện", pr: "또이 무온 디 벤 비엔", note: "병원 이동" },
      { cat: "숙소/응급", ko: "경찰을 불러주세요", vi: "Gọi cảnh sát giúp tôi", pr: "고이 깡 삿 줍 또이", note: "긴급 신고" },
      { cat: "숙소/응급", ko: "여권을 잃어버렸어요", vi: "Tôi bị mất hộ chiếu", pr: "또이 비 멋 호 찌에우", note: "여권 분실" }
    ];


    // URL parameter check
    var urlParams = new URLSearchParams(window.location.search);
    var urlCat = urlParams.get("cat");

    function render(filterCat) {
      filterCat = filterCat || "전체";
      var wrap = $("#vn-list");
      var filtered = phrases.filter(function(x) {
        return filterCat === "전체" ? true : x.cat === filterCat;
      });

      var rows = filtered.map(function(x) {
        return "<tr>" +
          "<td>" + x.cat + "</td>" +
          "<td><b>" + x.ko + "</b></td>" +
          "<td>" + (x.pr || "") + "</td>" +
          "<td>" + x.vi + "</td>" +
          "<td>" + (x.note || "") + "</td>" +
          "</tr>";
      }).join("");

      wrap.innerHTML = rows || '<tr><td colspan="5">표시할 문장이 없습니다.</td></tr>';
    }

    // Category filter
    var catSet = {};
    phrases.forEach(function(x) { catSet[x.cat] = true; });
    var cats = ["전체"].concat(Object.keys(catSet));

    var sel = $("#vn-filter");
    sel.innerHTML = cats.map(function(c) {
      return '<option value="' + c + '">' + c + '</option>';
    }).join("");

    sel.addEventListener("change", function() {
      render(sel.value);
    });

    // URL parameter category
    if (urlCat && cats.indexOf(urlCat) !== -1) {
      sel.value = urlCat;
      render(urlCat);
    } else {
      render("전체");
    }

    // Google translate helper
    var gtBtn = $("#vn-gt-btn");
    var gtInput = $("#vn-gt-input");
    if (gtBtn && gtInput) {
      gtBtn.addEventListener("click", function() {
        var q = gtInput.value.trim();
        if (!q) return;
        var url = "https://translate.google.com/?sl=ko&tl=vi&text=" + encodeURIComponent(q) + "&op=translate";
        window.open(url, "_blank", "noopener,noreferrer");
      });
    }
  }

  // Exchange rate (KRW <-> VND)
  function initFx() {
    var rateEl = $("#fx-rate");
    if (!rateEl) return;

    var updatedEl = $("#fx-updated");
    var noteEl = $("#fx-note");
    var refreshBtn = $("#fx-refresh");
    var amountEl = $("#fx-amount");
    var dirEl = $("#fx-direction");
    var resultEl = $("#fx-result");

    var API = "https://open.er-api.com/v6/latest/USD";
    var CACHE_KEY = "conextt_fx_cache_v1";

    var fmtKRW = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
    var fmtVND = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

    var fx = null;

    function showRate() {
      if (!fx) return;
      rateEl.textContent = "1 KRW = " + fx.vndPerKrw.toFixed(2) + " VND / 1,000 VND = " + fmtKRW.format(Math.round(fx.krwPerVnd * 1000)) + " KRW";

      if (updatedEl) {
        updatedEl.textContent = "업데이트: " + new Date(fx.updatedAtMs).toLocaleString("ko-KR");
      }
      if (noteEl) {
        noteEl.textContent = "출처: open.er-api.com (USD 기준 교차환산)";
      }
    }

    function compute() {
      if (!fx || !amountEl || !dirEl || !resultEl) return;

      var raw = (amountEl.value || "").replace(/,/g, "").trim();
      if (!raw) {
        resultEl.textContent = "-";
        return;
      }

      var amount = Number(raw);
      if (!Number.isFinite(amount)) {
        resultEl.textContent = "숫자를 입력해주세요";
        return;
      }

      var dir = dirEl.value || "KRW_TO_VND";
      if (dir === "KRW_TO_VND") {
        var vnd = amount * fx.vndPerKrw;
        resultEl.textContent = fmtKRW.format(amount) + " KRW = " + fmtVND.format(Math.round(vnd)) + " VND";
      } else {
        var krw = amount * fx.krwPerVnd;
        resultEl.textContent = fmtVND.format(amount) + " VND = " + fmtKRW.format(Math.round(krw)) + " KRW";
      }
    }

    function load() {
      rateEl.textContent = "불러오는 중...";
      if (updatedEl) updatedEl.textContent = "";
      if (noteEl) noteEl.textContent = "";

      fetch(API, { cache: "no-store" })
        .then(function(res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data.result !== "success" || !data.rates) {
            throw new Error("API 응답 형식이 예상과 다릅니다.");
          }

          var usdToKrw = data.rates.KRW;
          var usdToVnd = data.rates.VND;
          if (!usdToKrw || !usdToVnd) {
            throw new Error("KRW/VND 환율 정보를 찾지 못했습니다.");
          }

          fx = {
            vndPerKrw: usdToVnd / usdToKrw,
            krwPerVnd: usdToKrw / usdToVnd,
            updatedAtMs: (data.time_last_update_unix || Date.now() / 1000) * 1000
          };

          localStorage.setItem(CACHE_KEY, JSON.stringify(fx));
          showRate();
          compute();
        })
        .catch(function(e) {
          console.error(e);
          rateEl.textContent = "환율을 불러오지 못했습니다.";
          if (noteEl) noteEl.textContent = "네트워크 상태를 확인하거나, 잠시 후 다시 시도해주세요.";
        });
    }

    // Load cache first
    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && cached.vndPerKrw && cached.krwPerVnd && cached.updatedAtMs) {
        fx = cached;
        showRate();
      }
    } catch (e) {}

    if (refreshBtn) refreshBtn.addEventListener("click", load);
    if (amountEl) amountEl.addEventListener("input", compute);
    if (dirEl) dirEl.addEventListener("change", compute);

    load();
  }

  // Init
  markActiveNav();
  initTabs();
  initChecklist();
  initVietnamese();
  initFx();

  tickClocks();
  renderCurrentSchedule();
  highlightTimeline();

  setInterval(function() {
    tickClocks();
    renderCurrentSchedule();
    highlightTimeline();
  }, 15000);
})();
