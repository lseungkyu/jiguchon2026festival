/* ==========================================================================
   2026 SUMMER FESTIVAL DAEJEON CITY TOUR MOBILE MISSION SHEET SCRIPT
   ========================================================================== */

const placeDetails = {
  1: {
    name: "① 대전근현대사전시관",
    desc: "구 충청남도청사 건물. 고풍스러운 근대 건축물 배경 앞에서 인증샷 촬영!",
    img: "./assets/place1_1.png",
    zone: "A",
    lat: 36.325375, lng: 127.420556,
    kakao: "https://map.kakao.com/link/search/대전근현대사전시관",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전근현대사전시관"
  },
  2: {
    name: "② 정영복 미술공간",
    desc: "대전근현대사전시관 내부 미술공간 전시장 입구 배경 앞에서 찰칵!",
    img: "./assets/place2_1.png",
    zone: "A",
    lat: 36.325600, lng: 127.420800,
    kakao: "https://map.kakao.com/link/search/대전근현대사전시관",
    naver: "https://m.map.naver.com/search2/search.naver?query=대전근현대사전시관"
  },
  3: {
    name: "③ 우리들 공원 + 문화거리",
    desc: "대흥동 야외공연장 및 문화예술의 거리 중심 상징물 앞 배경",
    img: "./assets/place3_1.png",
    zone: "B",
    lat: 36.326200, lng: 127.426500,
    kakao: "https://map.kakao.com/link/search/우리들공원",
    naver: "https://m.map.naver.com/search2/search.naver?query=우리들공원"
  },
  4: {
    name: "④ 대흥동 성당",
    desc: "웅장한 성당 외관 정면 전경 배경 앞에서 단체사진 촬영!",
    img: "./assets/place4_1.png",
    zone: "B",
    lat: 36.325600, lng: 127.427700,
    kakao: "https://map.kakao.com/link/search/대흥동성당",
    naver: "https://m.map.naver.com/search2/search.naver?query=대흥동성당"
  },
  5: {
    name: "⑤ 성심당 본점",
    desc: "대전의 명물 성심당 본점 건물 및 시그니처 튀김소보로 동상 앞!",
    img: "./assets/place5_1.png",
    zone: "B",
    lat: 36.327700, lng: 127.427200,
    kakao: "https://map.kakao.com/link/search/성심당본점",
    naver: "https://m.map.naver.com/search2/search.naver?query=성심당본점"
  },
  6: {
    name: "⑥ 으능정이 문화의거리",
    desc: "거대한 스카이로드 LED 전광판 기둥 및 으능정이 거리 입구 게이트",
    img: "./assets/place6_1.png",
    zone: "BC",
    lat: 36.328700, lng: 127.428500,
    kakao: "https://map.kakao.com/link/search/으능정이문화의거리",
    naver: "https://m.map.naver.com/search2/search.naver?query=으능정이문화의거리"
  },
  7: {
    name: "⑦ 은행교",
    desc: "대전천을 건너는 은행교 교량 조형물 및 다리 위 배경",
    img: "./assets/place7_1.png",
    zone: "C",
    lat: 36.328300, lng: 127.430000,
    kakao: "https://map.kakao.com/link/search/은행교",
    naver: "https://m.map.naver.com/search2/search.naver?query=은행교"
  },
  8: {
    name: "⑧ 목척교",
    desc: "목척교 상징 나무 조형물 및 쉼터 배경",
    img: "./assets/place8_1.png",
    zone: "C",
    lat: 36.330100, lng: 127.430400,
    kakao: "https://map.kakao.com/link/search/목척교",
    naver: "https://m.map.naver.com/search2/search.naver?query=목척교"
  }
};

// 34 Recommended Food, Cafe & Play Spots Coordinates for Map
const foodSpotsData = [
  { name: "성심당 본점", cat: "식당", addr: "은행동 145-1", lat: 36.3277, lng: 127.4272 },
  { name: "성심당 테라스키친", cat: "식당", addr: "은행동 145-1", lat: 36.3276, lng: 127.4273 },
  { name: "성심당 우동야", cat: "식당", addr: "지하상가 D가-2", lat: 36.3275, lng: 127.4261 },
  { name: "마라천하마라탕", cat: "식당", addr: "은행동 169-10", lat: 36.3283, lng: 127.4275 },
  { name: "아저씨돈까스", cat: "식당", addr: "은행동 33-5", lat: 36.3279, lng: 127.4282 },
  { name: "희락반점", cat: "식당", addr: "선화동 36", lat: 36.3260, lng: 127.4220 },
  { name: "니뽕내뽕", cat: "식당", addr: "은행동 33-2", lat: 36.3278, lng: 127.4283 },
  { name: "멘야네코라멘 본점", cat: "식당", addr: "은행동 76-21", lat: 36.3290, lng: 127.4278 },
  { name: "육첩반상", cat: "식당", addr: "은행동 33-1", lat: 36.3277, lng: 127.4284 },
  { name: "바로그집", cat: "식당", addr: "지하상가 CL 61호", lat: 36.3268, lng: 127.4248 },
  { name: "춘천집무한닭갈비", cat: "식당", addr: "은행동 76-10", lat: 36.3289, lng: 127.4280 },
  { name: "선화면옥", cat: "식당", addr: "선화동 16-3", lat: 36.3268, lng: 127.4215 },
  { name: "두끼떡볶이", cat: "식당", addr: "은행동 33-11", lat: 36.3280, lng: 127.4281 },
  { name: "미도리카레", cat: "식당", addr: "대흥동 205-2", lat: 36.3258, lng: 127.4258 },
  { name: "동그라미즉석떡볶이", cat: "식당", addr: "은행동 138-2", lat: 36.3285, lng: 127.4268 },
  { name: "롤링파스타", cat: "식당", addr: "은행동 48-8", lat: 36.3274, lng: 127.4281 },
  { name: "도쿄돈부리", cat: "식당", addr: "은행동 166-1", lat: 36.3281, lng: 127.4274 },
  { name: "닭갈비제작소", cat: "식당", addr: "은행동 40-4", lat: 36.3272, lng: 127.4279 },
  { name: "설빙", cat: "카페", addr: "은행동 48-9", lat: 36.3273, lng: 127.4280 },
  { name: "성심당 옛맛솜씨", cat: "카페", addr: "은행동 166-2", lat: 36.3280, lng: 127.4273 },
  { name: "모도시", cat: "카페", addr: "선화동 236-3", lat: 36.3262, lng: 127.4211 },
  { name: "커피전도사의 집", cat: "카페", addr: "대흥동 6-1", lat: 36.3264, lng: 127.4242 },
  { name: "카운트 커피", cat: "카페", addr: "선화동 99", lat: 36.3266, lng: 127.4224 },
  { name: "알로하녹", cat: "카페", addr: "선화동 236-8", lat: 36.3264, lng: 127.4209 },
  { name: "포우드", cat: "카페", addr: "선화동 45-2", lat: 36.3261, lng: 127.4218 },
  { name: "오드눅", cat: "카페", addr: "은행동 33-10", lat: 36.3279, lng: 127.4280 },
  { name: "커닝", cat: "카페", addr: "대흥동 203-5", lat: 36.3257, lng: 127.4259 },
  { name: "단위", cat: "카페", addr: "대흥동 479-4", lat: 36.3250, lng: 127.4268 },
  { name: "모디프커피", cat: "카페", addr: "은행동 165-1", lat: 36.3282, lng: 127.4276 },
  { name: "라무킷도", cat: "놀거리", addr: "대흥동 225-5", lat: 36.3255, lng: 127.4262 },
  { name: "레드버튼", cat: "보드게임", addr: "은행동 45-5", lat: 36.3270, lng: 127.4282 },
  { name: "홈즈앤루팡", cat: "보드게임", addr: "은행동 142-4", lat: 36.3282, lng: 127.4270 },
  { name: "나사락볼링장", cat: "액티비티", addr: "대흥동 245-2", lat: 36.3252, lng: 127.4272 },
  { name: "점핑배틀", cat: "액티비티", addr: "은행동 40-3", lat: 36.3271, lng: 127.4278 }
];

const gatheringSpot = {
  name: "🚩 14:55 집결지 (중앙로역 4번출구)",
  lat: 36.327600, lng: 127.425100
};

// Tight bounding box enclosing Places 1 through 8 exactly
const allPlacesBounds = [
  [36.3248, 127.4198], // SW (South-West)
  [36.3306, 127.4308]  // NE (North-East)
];

let leafletMap = null;
let leafletMarkers = {};
let userGpsMarker = null;
let zonePolygons = {};

document.addEventListener("DOMContentLoaded", () => {
  startGatheringTimer();
  initLeafletMap();
});

// Initialize Leaflet Real GIS Map
function initLeafletMap() {
  const mapDiv = document.getElementById("realMap");
  if (!mapDiv || typeof L === 'undefined') return;

  leafletMap = L.map('realMap', {
    zoomControl: true,
    tap: true
  });

  // Fit bounds tightly around places 1 to 8 on load
  leafletMap.fitBounds(allPlacesBounds, { padding: [16, 16] });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors | 지구촌교회 중등부'
  }).addTo(leafletMap);

  // DRAW 3 VISUAL ZONE POLYGONS WITH CLICK TO ZOOM
  // Zone A Polygon (①, ②)
  const zoneAPoly = L.polygon([
    [36.3246, 127.4196],
    [36.3263, 127.4199],
    [36.3262, 127.4216],
    [36.3245, 127.4213]
  ], {
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.22,
    weight: 2.5,
    dashArray: '5, 5'
  }).addTo(leafletMap);
  zoneAPoly.bindTooltip("<b>🔴 동일구역 A (①, ②)</b><br>터치 시 확대", { permanent: false, direction: "center" });
  zoneAPoly.on('click', () => zoomToZone('A'));
  zonePolygons['A'] = zoneAPoly;

  // Zone B Polygon (③, ④, ⑤, ⑥)
  const zoneBPoly = L.polygon([
    [36.3250, 127.4255],
    [36.3292, 127.4262],
    [36.3294, 127.4292],
    [36.3250, 127.4285]
  ], {
    color: '#8b5cf6',
    fillColor: '#8b5cf6',
    fillOpacity: 0.20,
    weight: 2.5,
    dashArray: '5, 5'
  }).addTo(leafletMap);
  zoneBPoly.bindTooltip("<b>🟣 동일구역 B (③, ④, ⑤, ⑥)</b><br>터치 시 확대", { permanent: false, direction: "center" });
  zoneBPoly.on('click', () => zoomToZone('B'));
  zonePolygons['B'] = zoneBPoly;

  // Zone C Polygon (⑥, ⑦, ⑧)
  const zoneCPoly = L.polygon([
    [36.3280, 127.4278],
    [36.3308, 127.4288],
    [36.3308, 127.4312],
    [36.3276, 127.4308]
  ], {
    color: '#f59e0b',
    fillColor: '#f59e0b',
    fillOpacity: 0.22,
    weight: 2.5,
    dashArray: '5, 5'
  }).addTo(leafletMap);
  zoneCPoly.bindTooltip("<b>🟠 동일구역 C (⑥, ⑦, ⑧)</b><br>터치 시 확대", { permanent: false, direction: "center" });
  zoneCPoly.on('click', () => zoomToZone('C'));
  zonePolygons['C'] = zoneCPoly;

  // 🔴 ADD 34 SMALL RED DOT MARKERS FOR FOOD / CAFES
  foodSpotsData.forEach(food => {
    const foodDotIcon = L.divIcon({
      className: 'custom-food-dot-wrapper',
      html: `<div class="food-red-dot" title="${food.name}"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const popupHtml = `
      <div class="popup-card" style="padding:2px;">
        <h4 style="margin:0; font-size:13px; color:#ef4444;">📍 ${food.name}</h4>
        <p style="margin:2px 0 6px 0; font-size:11px; color:#cbd5e1;">주소: ${food.addr} (${food.cat})</p>
        <a href="https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(food.name)}" target="_blank" class="popup-nav-btn n" style="display:block; padding:5px; font-size:11px; text-decoration:none;">🧭 네이버 길찾기</a>
      </div>
    `;

    L.marker([food.lat, food.lng], { icon: foodDotIcon })
      .addTo(leafletMap)
      .bindPopup(popupHtml);
  });

  // Gathering Spot Marker (🚩)
  const flagIcon = L.divIcon({
    className: 'custom-leaflet-pin-wrapper',
    html: `<div class="custom-leaflet-pin target-spot">🚩</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
  L.marker([gatheringSpot.lat, gatheringSpot.lng], { icon: flagIcon })
    .addTo(leafletMap)
    .bindPopup(`
      <div class="popup-card">
        <h4>🚩 14:55 최종 집결 장소</h4>
        <p><strong>중앙로역 4번 출구 앞</strong><br>모든 조는 14:55분까지 집결해 주세요!</p>
      </div>
    `);

  // Place Markers 1 to 8
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

    const popupHtml = `
      <div class="popup-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h4 style="margin:0;">${p.name}</h4>
          <span class="z-badge-mini ${zoneClass}">구역 ${zoneBadgeText}</span>
        </div>
        <p>${p.desc}</p>
        <img src="${p.img}" alt="${p.name}">
        <div class="popup-nav-grid">
          <a href="${p.kakao}" target="_blank" class="popup-nav-btn k">카카오맵</a>
          <a href="${p.naver}" target="_blank" class="popup-nav-btn n">네이버지도</a>
        </div>
      </div>
    `;

    const marker = L.marker([p.lat, p.lng], { icon: numIcon })
      .addTo(leafletMap)
      .bindPopup(popupHtml);

    leafletMarkers[id] = marker;
  });
}

// Zoom to Specific Zone (A, B, C)
function zoomToZone(zoneName) {
  if (!leafletMap) return;

  const poly = zonePolygons[zoneName];
  if (poly) {
    leafletMap.flyToBounds(poly.getBounds().pad(0.25), {
      duration: 0.8,
      maxZoom: 18
    });
  }
}

// Focus Map on a specific Place (1..8)
function focusMapPlace(placeId) {
  const p = placeDetails[placeId];
  if (leafletMap && p) {
    leafletMap.flyTo([p.lat, p.lng], 18, { duration: 0.8 });
    const marker = leafletMarkers[placeId];
    if (marker) {
      setTimeout(() => marker.openPopup(), 900);
    }
  }
}

// Reset Map to Center Tightly Enclosing Places 1 through 8
function resetMapCenter() {
  if (leafletMap) {
    leafletMap.flyToBounds(allPlacesBounds, {
      padding: [16, 16],
      duration: 0.8
    });
  }
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

      if (!userGpsMarker && leafletMap) {
        const userIcon = L.divIcon({
          className: 'custom-leaflet-pin-wrapper',
          html: `<div class="custom-leaflet-pin user-spot">📍</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });
        userGpsMarker = L.marker([uLat, uLng], { icon: userIcon }).addTo(leafletMap);
        userGpsMarker.bindPopup("<b>📍 내 현재 위치</b>").openPopup();
      } else if (userGpsMarker) {
        userGpsMarker.setLatLng([uLat, uLng]).openPopup();
      }

      if (leafletMap) {
        leafletMap.flyTo([uLat, uLng], 17, { duration: 0.8 });
      }
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
  
  if (tabId === 'mapTab' && leafletMap) {
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
