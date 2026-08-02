/* ==========================================================================
   2026 SUMMER FESTIVAL DAEJEON CITY TOUR MOBILE MISSION SHEET SCRIPT
   ========================================================================== */

const placeDetails = {
  1: {
    name: "① 대전근현대사전시관",
    desc: "구 충청남도청사 건물. 고풍스러운 근대 건축물 배경!",
    img: "./assets/place1_1.png",
    zone: "A",
    lat: 36.326888, lng: 127.421188, // 구글맵 링크 8CGC+QF2 대전광역시 (대전근현대사전시관 정문 계단 전면)
    kakao: "https://map.kakao.com/link/search/대전근현대사전시관",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전근현대사전시관"
  },
  2: {
    name: "② 정영복 미술공간",
    desc: "전시관 내부 미술공간 전시장 입구 배경!",
    img: "./assets/place2_1.png",
    zone: "A",
    lat: 36.326188, lng: 127.423188, // Plus Code: 8CGF+F7 대전광역시
    kakao: "https://map.kakao.com/link/search/정영복미술공간",
    naver: "https://m.map.naver.com/search2/search.naver?query=정영복미술공간"
  },
  3: {
    name: "③ 우리들 공원 + 문화거리",
    desc: "대흥동 야외공연장 및 문화거리 중심 상징물 앞!",
    img: "./assets/place3_1.png",
    zone: "B",
    lat: 36.327363, lng: 127.425641, // Plus Code: 8CGG+W7R 대전광역시
    kakao: "https://place.map.kakao.com/410607403",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전우리들공원"
  },
  4: {
    name: "④ 대흥동 성당",
    desc: "웅장한 성당 외관 정면 전경 배경!",
    img: "./assets/place4_1.png",
    zone: "B",
    lat: 36.326812, lng: 127.426437, // Plus Code: 8CGG+PH 대전광역시
    kakao: "https://map.kakao.com/link/search/대전 대흥동성당",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전 대흥동성당"
  },
  5: {
    name: "⑤ 성심당 본점",
    desc: "성심당 본점 건물 및 시그니처 튀김소보로 동상 앞!",
    img: "./assets/place5_1.png",
    zone: "B",
    lat: 36.327660, lng: 127.427280,
    kakao: "https://map.kakao.com/link/search/대전 성심당 본점",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전 성심당 본점"
  },
  6: {
    name: "⑥ 으능정이 문화의거리",
    desc: "스카이로드 LED 전광판 기둥 및 거리 입구 게이트!",
    img: "./assets/place6_1.png",
    zone: "BC",
    lat: 36.328450, lng: 127.428350,
    kakao: "https://map.kakao.com/link/search/대전 으능정이문화의거리",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전 으능정이문화의거리"
  },
  7: {
    name: "⑦ 은행교",
    desc: "대전천을 건너는 은행교 교량 조형물 및 다리 위!",
    img: "./assets/place7_1.png",
    zone: "C",
    lat: 36.328563, lng: 127.430188, // Plus Code: 8CHJ+C3 대전광역시
    kakao: "https://map.kakao.com/link/search/대전 은행교",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전 은행교"
  },
  8: {
    name: "⑧ 목척교",
    desc: "목척교 상징 나무 조형물 및 쉼터 배경!",
    img: "./assets/place8_1.png",
    zone: "C",
    lat: 36.329938, lng: 127.429313, // Plus Code: 8CHH+XP 대전광역시
    kakao: "https://map.kakao.com/link/search/대전 목척교",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전 목척교"
  }
};

const foodSpotsData = [
  { name: "성심당 본점", cat: "식당", addr: "은행동 145-1", lat: 36.327744, lng: 127.427245 },
  { name: "성심당 테라스키친", cat: "식당", addr: "은행동 145-1", lat: 36.327744, lng: 127.427245 },
  { name: "성심당 우동야", cat: "식당", addr: "지하상가 D가-2", lat: 36.32750, lng: 127.42610 },
  { name: "마라천하마라탕", cat: "식당", addr: "은행동 169-10", lat: 36.327412, lng: 127.427911 },
  { name: "아저씨돈까스", cat: "식당", addr: "은행동 33-5", lat: 36.328173, lng: 127.427955 },
  { name: "희락반점", cat: "식당", addr: "선화동 36", lat: 36.328982, lng: 127.423513 },
  { name: "니뽕내뽕", cat: "식당", addr: "은행동 33-2", lat: 36.328051, lng: 127.428274 },
  { name: "멘야네코라멘 본점", cat: "식당", addr: "은행동 76-21", lat: 36.327311, lng: 127.429006 },
  { name: "육첩반상", cat: "식당", addr: "은행동 33-1", lat: 36.328201, lng: 127.428129 },
  { name: "바로그집", cat: "식당", addr: "지하상가 CL 61호", lat: 36.32680, lng: 127.42480 },
  { name: "춘천집무한닭갈비", cat: "식당", addr: "은행동 76-10", lat: 36.327818, lng: 127.428759 },
  { name: "선화면옥", cat: "식당", addr: "선화동 16-3", lat: 36.330706, lng: 127.422558 },
  { name: "두끼떡볶이", cat: "식당", addr: "은행동 33-11", lat: 36.327991, lng: 127.427544 },
  { name: "미도리카레", cat: "식당", addr: "대흥동 205-2", lat: 36.327535, lng: 127.423777 },
  { name: "동그라미즉석떡볶이", cat: "식당", addr: "은행동 138-2", lat: 36.329187, lng: 127.425518 },
  { name: "롤링파스타", cat: "식당", addr: "은행동 48-8", lat: 36.328565, lng: 127.427290 },
  { name: "도쿄돈부리", cat: "식당", addr: "은행동 166-1", lat: 36.327537, lng: 127.427567 },
  { name: "닭갈비제작소", cat: "식당", addr: "은행동 40-4", lat: 36.328340, lng: 127.427562 },
  { name: "설빙", cat: "카페", addr: "은행동 48-9", lat: 36.328790, lng: 127.427811 },
  { name: "성심당 옛맛솜씨", cat: "카페", addr: "은행동 166-2", lat: 36.327477, lng: 127.427410 },
  { name: "모도시", cat: "카페", addr: "선화동 236-3", lat: 36.329356, lng: 127.422154 },
  { name: "커피전도사의 집", cat: "카페", addr: "대흥동 6-1", lat: 36.327182, lng: 127.429424 },
  { name: "카운트 커피", cat: "카페", addr: "선화동 99", lat: 36.328137, lng: 127.423466 },
  { name: "알로하녹", cat: "카페", addr: "선화동 236-8", lat: 36.329141, lng: 127.422077 },
  { name: "포우드", cat: "카페", addr: "선화동 45-2", lat: 36.328334, lng: 127.423348 },
  { name: "오드눅", cat: "카페", addr: "은행동 33-10", lat: 36.327859, lng: 127.427684 },
  { name: "커닝", cat: "카페", addr: "대흥동 203-5", lat: 36.327979, lng: 127.424555 },
  { name: "단위", cat: "카페", addr: "대흥동 479-4", lat: 36.326529, lng: 127.423411 },
  { name: "모디프커피", cat: "카페", addr: "은행동 165-1", lat: 36.327367, lng: 127.427639 },
  { name: "라무킷도", cat: "놀거리", addr: "대흥동 225-5", lat: 36.326813, lng: 127.425431 },
  { name: "레드버튼", cat: "보드게임", addr: "은행동 45-5", lat: 36.329041, lng: 127.428113 },
  { name: "홈즈앤루팡", cat: "보드게임", addr: "은행동 142-4", lat: 36.328525, lng: 127.426892 },
  { name: "나사락볼링장", cat: "액티비티", addr: "대흥동 245-2", lat: 36.326351, lng: 127.424435 },
  { name: "점핑배틀", cat: "액티비티", addr: "은행동 40-3", lat: 36.328395, lng: 127.427938 }
];

const gatheringSpot = {
  name: "🚩 14:55 집결지 (중앙로역 4번출구)",
  lat: 36.327600, lng: 127.425300
};

const allPlacesBounds = [
  [36.3248, 127.4198],
  [36.3306, 127.4308]
];

let leafletMap = null;
let leafletMarkers = {};
let zonePolygons = {};
let userGpsMarker = null;
let currentEngineMode = 'pin';

document.addEventListener("DOMContentLoaded", () => {
  startGatheringTimer();
  initLeafletMap();
});

// Switch Map Engine View Mode
function switchMapEngine(mode) {
  currentEngineMode = mode;

  const btnPin = document.getElementById("btnPinMap");
  const btnNaver = document.getElementById("btnNaverIframe");
  const btnKakao = document.getElementById("btnKakaoIframe");

  const realMapDiv = document.getElementById("realMap");
  const iframeContainer = document.getElementById("iframeMapContainer");
  const iframe = document.getElementById("embeddedMapIframe");
  const iframeTitle = document.getElementById("iframeTitleTag");
  const iframeLink = document.getElementById("iframeExternalLink");
  const mapTools = document.getElementById("mapToolsContainer");
  const zonePills = document.getElementById("zoneGridPills");

  [btnPin, btnNaver, btnKakao].forEach(b => b.classList.remove("active"));

  if (mode === 'pin') {
    btnPin.classList.add("active");
    realMapDiv.style.display = "block";
    iframeContainer.style.display = "none";
    if (mapTools) mapTools.style.display = "flex";
    if (zonePills) zonePills.style.display = "grid";
    
    if (leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 100);
    }
  } else if (mode === 'naver') {
    btnNaver.classList.add("active");
    realMapDiv.style.display = "none";
    iframeContainer.style.display = "block";
    if (mapTools) mapTools.style.display = "none";
    if (zonePills) zonePills.style.display = "none";
    closeBottomSheet();

    const url = "https://m.map.naver.com/search2/search.naver?query=대전+중앙로역";
    iframe.src = url;
    iframeTitle.textContent = "🟢 네이버지도 웹 내장 뷰";
    iframeLink.href = url;
  } else if (mode === 'kakao') {
    btnKakao.classList.add("active");
    realMapDiv.style.display = "none";
    iframeContainer.style.display = "block";
    if (mapTools) mapTools.style.display = "none";
    if (zonePills) zonePills.style.display = "none";
    closeBottomSheet();

    const url = "https://m.map.kakao.com";
    iframe.src = url;
    iframeTitle.textContent = "🟡 카카오맵 웹 내장 뷰";
    iframeLink.href = url;
  }
}

// Initialize Leaflet Map
function initLeafletMap() {
  const mapDiv = document.getElementById("realMap");
  if (!mapDiv || typeof L === 'undefined') return;

  leafletMap = L.map('realMap', {
    zoomControl: true,
    tap: true
  });

  leafletMap.fitBounds(allPlacesBounds, { padding: [16, 16] });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors | 지구촌교회 중등부'
  }).addTo(leafletMap);

  leafletMap.on('click', () => {
    closeBottomSheet();
  });

  // Zone Polygons
  const zoneAPoly = L.polygon([
    [36.3248, 127.4196],
    [36.3275, 127.4199],
    [36.3275, 127.4242],
    [36.3247, 127.4230]
  ], {
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.22,
    weight: 2.5,
    dashArray: '5, 5'
  }).addTo(leafletMap);
  zoneAPoly.on('click', () => zoomToZone('A'));
  zonePolygons['A'] = zoneAPoly;

  const zoneBPoly = L.polygon([
    [36.3250, 127.4248],
    [36.3292, 127.4252],
    [36.3292, 127.4288],
    [36.3250, 127.4283]
  ], {
    color: '#8b5cf6',
    fillColor: '#8b5cf6',
    fillOpacity: 0.20,
    weight: 2.5,
    dashArray: '5, 5'
  }).addTo(leafletMap);
  zoneBPoly.on('click', () => zoomToZone('B'));
  zonePolygons['B'] = zoneBPoly;

  const zoneCPoly = L.polygon([
    [36.3275, 127.4280],
    [36.3305, 127.4285],
    [36.3305, 127.4312],
    [36.3275, 127.4306]
  ], {
    color: '#f59e0b',
    fillColor: '#f59e0b',
    fillOpacity: 0.22,
    weight: 2.5,
    dashArray: '5, 5'
  }).addTo(leafletMap);
  zoneCPoly.on('click', () => zoomToZone('C'));
  zonePolygons['C'] = zoneCPoly;

  // Food Markers
  foodSpotsData.forEach(food => {
    const foodDotIcon = L.divIcon({
      className: 'custom-food-dot-wrapper',
      html: `<div class="food-red-dot" title="${food.name}"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([food.lat, food.lng], { icon: foodDotIcon }).addTo(leafletMap);
    
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      openBottomSheet({
        title: `📍 ${food.name}`,
        badge: food.cat,
        badgeClass: 'zone-a',
        desc: `주소: ${food.addr}`,
        img: '',
        kakao: `https://map.kakao.com/link/search/${encodeURIComponent(food.name)}`,
        naver: `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(food.name)}`
      });
      leafletMap.panTo([food.lat, food.lng]);
    });
  });

  // Flag Marker
  const flagIcon = L.divIcon({
    className: 'custom-leaflet-pin-wrapper',
    html: `<div class="custom-leaflet-pin target-spot">🚩</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
  const flagMarker = L.marker([gatheringSpot.lat, gatheringSpot.lng], { icon: flagIcon }).addTo(leafletMap);
  flagMarker.on('click', (e) => {
    L.DomEvent.stopPropagation(e);
    openBottomSheet({
      title: "🚩 14:55 최종 집결 장소",
      badge: "집결지",
      badgeClass: "zone-a",
      desc: "중앙로역 4번 출구 앞 (모든 조 14:55분까지 집결!)",
      img: "",
      kakao: "https://map.kakao.com/link/search/중앙로역4번출구",
      naver: "https://m.map.naver.com/search2/search.naver?query=중앙로역4번출구"
    });
    leafletMap.panTo([gatheringSpot.lat, gatheringSpot.lng]);
  });

  // 8 Places
  Object.keys(placeDetails).forEach(id => {
    const p = placeDetails[id];

    let zoneClass = "zone-a";
    let zoneBadgeText = "A";
    if (p.zone === "B") { zoneClass = "zone-b"; zoneBadgeText = "B"; }
    else if (p.zone === "C") { zoneClass = "zone-c"; zoneBadgeText = "C"; }
    else if (p.zone === "BC") { zoneClass = "zone-bc"; zoneBadgeText = "B,C"; }

    const numIcon = L.divIcon({
      className: 'custom-leaflet-pin-wrapper',
      html: `<div class="custom-leaflet-pin ${zoneClass}">${id}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([p.lat, p.lng], { icon: numIcon }).addTo(leafletMap);
    leafletMarkers[id] = marker;

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      openBottomSheet({
        title: p.name,
        badge: `구역 ${zoneBadgeText}`,
        badgeClass: zoneClass,
        desc: p.desc,
        img: p.img,
        kakao: p.kakao,
        naver: p.naver
      });
      leafletMap.panTo([p.lat, p.lng]);
    });
  });
}

// Open Bottom Sheet
function openBottomSheet(data) {
  const sheet = document.getElementById("mapBottomSheet");
  const sTitle = document.getElementById("sheetTitle");
  const sBadge = document.getElementById("sheetBadge");
  const sDesc = document.getElementById("sheetDesc");
  const sImgWrap = document.getElementById("sheetImgWrapper");
  const sImg = document.getElementById("sheetImg");
  const sKakaoBtn = document.getElementById("sheetKakaoBtn");
  const sNaverBtn = document.getElementById("sheetNaverBtn");

  if (!sheet) return;

  sTitle.textContent = data.title || "";
  sBadge.textContent = data.badge || "";
  sBadge.className = `z-badge-mini ${data.badgeClass || 'zone-a'}`;
  sDesc.textContent = data.desc || "";

  if (data.img) {
    sImg.src = data.img;
    sImgWrap.style.display = "block";
    sImg.onclick = () => openLightbox(data.img, data.title);
  } else {
    sImgWrap.style.display = "none";
  }

  sKakaoBtn.href = data.kakao || "#";
  sNaverBtn.href = data.naver || "#";

  sheet.style.display = "flex";
  requestAnimationFrame(() => {
    sheet.classList.add("active");
  });
}

function closeBottomSheet() {
  const sheet = document.getElementById("mapBottomSheet");
  if (sheet) {
    sheet.classList.remove("active");
    setTimeout(() => {
      sheet.style.display = "none";
    }, 220);
  }
}

// Zoom to Zone
function zoomToZone(zoneName) {
  if (leafletMap) {
    const poly = zonePolygons[zoneName];
    if (poly) {
      leafletMap.flyToBounds(poly.getBounds().pad(0.25), { duration: 0.8 });
    }
  }
  closeBottomSheet();
}

// Focus Map Place
function focusMapPlace(placeId) {
  const p = placeDetails[placeId];
  if (!p) return;

  if (currentEngineMode !== 'pin') {
    switchMapEngine('pin');
  }

  if (leafletMap) {
    leafletMap.flyTo([p.lat, p.lng], 18, { duration: 0.8 });
  }

  let zoneClass = "zone-a";
  let zoneBadgeText = "A";
  if (p.zone === "B") { zoneClass = "zone-b"; zoneBadgeText = "B"; }
  else if (p.zone === "C") { zoneClass = "zone-c"; zoneBadgeText = "C"; }
  else if (p.zone === "BC") { zoneClass = "zone-bc"; zoneBadgeText = "B,C"; }

  openBottomSheet({
    title: p.name,
    badge: `구역 ${zoneBadgeText}`,
    badgeClass: zoneClass,
    desc: p.desc,
    img: p.img,
    kakao: p.kakao,
    naver: p.naver
  });
}

// Reset Map
function resetMapCenter() {
  if (leafletMap) {
    leafletMap.flyToBounds(allPlacesBounds, { padding: [16, 16], duration: 0.8 });
  }
  closeBottomSheet();
}

// Locate User's Real-time GPS Location
function locateUserGPS() {
  if (!navigator.geolocation) {
    alert("스마트폰 기기에서 위치 서비스를 지원하지 않습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const uLat = pos.coords.latitude;
      const uLng = pos.coords.longitude;

      if (leafletMap) {
        if (!userGpsMarker) {
          const userIcon = L.divIcon({
            className: 'custom-leaflet-pin-wrapper',
            html: `<div class="custom-leaflet-pin user-spot">📍</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });
          userGpsMarker = L.marker([uLat, uLng], { icon: userIcon }).addTo(leafletMap);
        } else {
          userGpsMarker.setLatLng([uLat, uLng]);
        }
        leafletMap.flyTo([uLat, uLng], 17, { duration: 0.8 });
      }

      openBottomSheet({
        title: "📍 내 현재 위치",
        badge: "GPS",
        badgeClass: "zone-a",
        desc: "실시간 GPS 내 현재 위치입니다.",
        img: "",
        kakao: `https://map.kakao.com/link/map/내위치,${uLat},${uLng}`,
        naver: `https://m.map.naver.com/search2/search.naver?query=${uLat},${uLng}`
      });
    },
    (err) => {
      alert("위치 정보를 불러올 수 없습니다. GPS 설정 및 위치 권한을 확인해 주세요.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Tab Switching
function switchTab(tabId) {
  const panes = document.querySelectorAll(".tab-pane");
  const btns = document.querySelectorAll(".tab-btn");
  
  panes.forEach(pane => pane.classList.remove("active"));
  btns.forEach(btn => btn.classList.remove("active"));
  
  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add("active");
  
  const indexMap = { 'mapTab': 0, 'routesTab': 1, 'placesTab': 2 };
  if (btns[indexMap[tabId]]) {
    btns[indexMap[tabId]].classList.add("active");
  }
  
  if (tabId === 'mapTab' && leafletMap && currentEngineMode === 'pin') {
    setTimeout(() => leafletMap.invalidateSize(), 150);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Gathering Timer (14:55)
function startGatheringTimer() {
  const timerDisplay = document.getElementById("countdownTimer");
  
  function updateTimer() {
    const now = new Date();
    const target = new Date();
    target.setHours(14, 55, 0, 0);

    let diff = target - now;

    if (diff <= 0) {
      timerDisplay.textContent = "14:55 집결 완료!";
      timerDisplay.style.color = "#34d399";
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const hStr = String(hours).padStart(2, '0');
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');

    timerDisplay.textContent = `${hStr}:${mStr}:${sStr}`;

    if (diff < 30 * 60 * 1000) {
      timerDisplay.style.color = "#f87171";
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// Filter Places (Tab 3)
function filterPlaces(zoneCategory) {
  const chips = document.querySelectorAll(".filter-chip");
  const cards = document.querySelectorAll(".place-card[data-zone]");

  chips.forEach(c => c.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");

  cards.forEach(card => {
    if (zoneCategory === "all") {
      card.style.display = "block";
    } else {
      const z = card.getAttribute("data-zone");
      card.style.display = (z === zoneCategory) ? "block" : "none";
    }
  });
}

// Filter Food & Cafe Category (Tab 2)
function filterFoodCategory(cat) {
  const btns = document.querySelectorAll(".f-filter-btn");
  const items = document.querySelectorAll(".food-item[data-cat]");

  btns.forEach(b => b.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");

  items.forEach(item => {
    if (cat === "all") {
      item.style.display = "flex";
    } else {
      const itemCat = item.getAttribute("data-cat");
      item.style.display = (itemCat === cat) ? "flex" : "none";
    }
  });
}

function openEmergencyCall() {
  alert("🚨 긴급 연락처 안내:\n- 수련회 본부 / 진행 선생님 단톡방으로 즉시 메시지 또는 전화 바랍니다!");
}

// Lightbox
function openLightbox(imgSrc, captionText) {
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbCap = document.getElementById("lightboxCaption");

  if (lb && lbImg) {
    lbImg.src = imgSrc;
    lbCap.textContent = captionText || "";
    lb.classList.add("active");
  }
}

function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.remove("active");
}
