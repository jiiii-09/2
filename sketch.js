let video;
let hands;
let camera;
let predictions = [];

let stepSize = 11;
let dotMax = 20;

// HEART
let heartParticles = [];
let heartBoost = 0;
let lastHeartTime = 0;

// V gesture
let vBoost = 0;
let lastVTime = 0;

//ThumbsUp
let thumbBoost = 0;
let lastThumbTime = 0;
let thumbParticles = [];

let thumbDownBoost = 0;
let lastThumbDownTime = 0;
let inkDrops = [];

// 👋 인사
let waveHistory = [];        // 최근 x 움직임 기록
let welcomeBoost = 0;
let lastWaveTime = 0;
let waveParticles = [];

let handMotionHistoryA = [];
let handMotionHistoryB = [];

function setup() {
  createCanvas(1194, 834);
  pixelDensity(1);
  frameRate(30);  

  video = createCapture(VIDEO);
  video.size(width / stepSize, height / stepSize);
  video.hide();

  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onResults);

  camera = new Camera(video.elt, {
    onFrame: async () => {
      await hands.send({ image: video.elt });
    },
    width: width,
    height: height
  });

  camera.start();
}

function onResults(results) {
  predictions = results.multiHandLandmarks || [];
}

function draw() {

  // ---------------------------------
  // 🌈 기본 그라데이션 (보라 → 주황)
  // ---------------------------------
  for (let y = 0; y < height; y++) {
    let t = y / height;

    let c5 = color('#431A75');
    let c4 = color('#C13584');
    let c3 = color('#E1306C');
    let c2 = color('#F77737');
    let c1 = color('#FCAF45');

    let col;

    if (t < 0.25) col = lerpColor(c1, c2, t/0.25);
    else if (t < 0.5) col = lerpColor(c2, c3, (t-0.25)/0.25);
    else if (t < 0.75) col = lerpColor(c3, c4, (t-0.5)/0.25);
    else col = lerpColor(c4, c5, (t-0.75)/0.25);

    // ❤️ 하트 Boost
    let heartColor = color('#FF3F7F');
    col = lerpColor(col, heartColor, heartBoost);

    // ✌️ 브이 Boost
    let vBoostColor = color('#FFE066');
    col = lerpColor(col, vBoostColor, vBoost);
    
    //엄지척 Boost
    let thumbBoostColor = color('#FFF6A2');
    col = lerpColor(col, thumbBoostColor, thumbBoost);
    
    // 👍 thumbs-down boost → dark purple
let thumbDownColor = color('#2D0A4A'); 
col = lerpColor(col, thumbDownColor, thumbDownBoost);

    // 👋 Welcome Brightness Boost (전체 밝기 ↑)
let welcomeColor = color(255);  // pure white
col = lerpColor(col, welcomeColor, welcomeBoost * 0.4);

    stroke(col);
    line(0, y, width, y);
  }


  // ------------------------------------------------------
  // 🫶 HEART GESTURE
  // ------------------------------------------------------
  if (predictions.length === 2 && isTwoHandHeart(predictions)) {
    if (millis() - lastHeartTime > 1500) {
      lastHeartTime = millis();
      heartBoost = 1;

      let pos = getTwoHandHeartPos(predictions);

      for (let i = 0; i < 3; i++) {
        heartParticles.push(new HeartParticle(pos.x, pos.y));
      }
    }
  }

  heartBoost = max(0, heartBoost - 0.05);

  for (let i = heartParticles.length - 1; i >= 0; i--) {
    heartParticles[i].update();
    heartParticles[i].draw();
    if (heartParticles[i].isDead()) heartParticles.splice(i, 1);
  }


  // ------------------------------------------------------
  // ✌ V GESTURE
  // ------------------------------------------------------
  if (predictions.length >= 1) {
    let hand = predictions[0];

    if (isVGesture(hand)) {
      if (millis() - lastVTime > 1200) {
        lastVTime = millis();
        vBoost = 1;
      }
    }
  }

  vBoost = max(0, vBoost - 0.04); 

  //---------
  //엄지척
  //-------
  // 👍 엄지척 제스처
if (predictions.length >= 1) {
  let hand = predictions[0];

  if (isThumbsUp(hand)) {
    if (millis() - lastThumbTime > 1200) {
      lastThumbTime = millis();
      thumbBoost = 1;

      let tx = width - hand[4].x * width;
      let ty = hand[4].y * height;

      // ⭐ 파티클 생성 (4개)
      for (let i = 0; i < 4; i++) {
        thumbParticles.push(new StarParticle(tx, ty));
      }
    }
  }
  
    thumbBoost = max(0, thumbBoost - 0.1);
  
  //붐따
  // 👍 엄지 아래 (thumbs down)
if (predictions.length === 1) {
  let hand = predictions[0];

  if (isThumbsDown(hand)) {
    if (millis() - lastThumbDownTime > 1200) {
      lastThumbDownTime = millis();
      thumbDownBoost = 1;

      let tx = width - hand[4].x * width;
      let ty = hand[4].y * height;

      // 잉크 드롭 생성
      for (let i = 0; i < 5; i++) {
        inkDrops.push(new InkDrop(tx, ty));
      }
    }
  }
  
thumbDownBoost = max(0, thumbDownBoost - 0.12);

  //인사제스쳐
  // 👋 인사 제스처 (왼손, 오른손 둘 중 하나라도 인사하면 발동)
if (predictions.length >= 1) {
  for (let hand of predictions) {
    if (isWaving(hand)) {

      if (millis() - lastWaveTime > 1200) {
        lastWaveTime = millis();
        welcomeBoost = 1;

        let wx = width - hand[9].x * width;
        let wy = hand[9].y * height;

        // 반짝 파티클 생성 (6개)
        for (let i = 0; i < 6; i++) {
          waveParticles.push(new WaveSpark(wx, wy));
        }
      }
    }
  }
}

// welcome boost fade-out
welcomeBoost = max(0, welcomeBoost - 0.25);


// wave particles update
for (let i = waveParticles.length - 1; i >= 0; i--) {
  waveParticles[i].update();
  waveParticles[i].draw();
  if (waveParticles[i].isDead()) waveParticles.splice(i, 1);
}
}

// thumb-down boost fade out
thumbDownBoost = max(0, thumbDownBoost - 0.08);

// ink drops update & draw
for (let i = inkDrops.length - 1; i >= 0; i--) {
  inkDrops[i].update();
  inkDrops[i].draw();
  if (inkDrops[i].isDead()) inkDrops.splice(i, 1);
}
}

// 엄지척 fade out
thumbBoost = max(0, thumbBoost - 0.08);

// 파티클 업데이트
for (let i = thumbParticles.length - 1; i >= 0; i--) {
  thumbParticles[i].update();
  thumbParticles[i].draw();
  if (thumbParticles[i].isDead()) thumbParticles.splice(i, 1);
}


  // ------------------------------------------------------
  // ✋ HAND PIXEL MASK
  // ------------------------------------------------------
  if (video.width === 0 || video.height === 0) return;   // ② 안전 체크
  video.loadPixels();
  
  noStroke();
  fill(255);

  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {
      let px = x * stepSize;
      let py = y * stepSize;

      let insideAny = false;

      for (let hand of predictions) {
        let {palm, fingers} = getHandPolygons(hand);

        if (pointInPolygon(px, py, palm)) insideAny = true;
        else {
          for (let finger of fingers) {
            if (pointInPolygon(px, py, finger)) {
              insideAny = true;
              break;
            }
          }
        }

        if (insideAny) break;
      }

      if (insideAny) {
        let i = (y * video.width + x) * 4;
        let r = video.pixels[i];
        let g = video.pixels[i+1];
        let b = video.pixels[i+2];
        let bright = (r + g + b)/3;
        let radius = map(bright, 0, 255, dotMax, 2);

        ellipse(px, py, radius, radius);
      }
    }
  }
}


// ------------------------------------------------------
// GESTURE FUNCTIONS
// ------------------------------------------------------
function isTwoHandHeart(predictions) {
  if (predictions.length !== 2) return false;

  let handA = predictions[0];
  let handB = predictions[1];

  // --- 1) 속도 체크 (너무 엄격하지 않게)
  let speedA = handSpeed(handMotionHistoryA, handA[9].x, handA[9].y);
  let speedB = handSpeed(handMotionHistoryB, handB[9].x, handB[9].y);

  if (speedA > 0.05 || speedB > 0.05) return false;
  // 0.05 → 현실적으로 가능한 움직임에서만 감지됨

  // --- 2) 손이 너무 붙어있지 않아야 (좌우 분리)
  if (abs(handA[0].x - handB[0].x) < 0.12) return false;

  // --- 3) 양손 엄지와 검지가 서로 가깝다
  let dIndex = dist(handA[8].x, handA[8].y, handB[8].x, handB[8].y);
  let dThumb = dist(handA[4].x, handA[4].y, handB[4].x, handB[4].y);

  if (dIndex > 0.18) return false;
  if (dThumb > 0.18) return false;
  // 범위 완화 (0.18 정도가 실제 하트에 적절)

  // --- 4) 엄지·검지가 서로 "안쪽을" 향하는지
  // 모든 좌우 반전 상황 고려
  let aThumbX = width - handA[4].x * width;
  let aIndexX = width - handA[8].x * width;

  let bThumbX = width - handB[4].x * width;
  let bIndexX = width - handB[8].x * width;

  // 오른손인지 왼손인지 판단
  let isAOnLeft = aThumbX < bThumbX;

  if (isAOnLeft) {
    // 손A는 왼쪽 → 엄지가 검지보다 오른쪽이어야
    if (aThumbX > aIndexX) return false;

    // 손B는 오른쪽 → 엄지가 검지보다 왼쪽이어야
    if (bThumbX < bIndexX) return false;

  } else {
    // 손A가 오른쪽
    if (aThumbX < aIndexX) return false;
    if (bThumbX > bIndexX) return false;
  }

  return true;
}


function getTwoHandHeartPos(predictions) {
  let handA = predictions[0];
  let handB = predictions[1];

  let ix = (handA[8].x + handB[8].x) / 2;
  let iy = (handA[8].y + handB[8].y) / 2;

  return {
    x: width - ix * width,
    y: iy * height
  };
}

function isVGesture(hand) {

  // --- 손가락 펴짐 판정 ---
  let indexUp  = hand[8].y  < hand[6].y;
  let middleUp = hand[12].y < hand[10].y;

  // --- 손가락 접힘 판정 (꾹 접혀 있어야 함) ---
  let ringBent  = hand[16].y > hand[14].y + 0.03;   // +0.03 여유값
  let pinkyBent = hand[20].y > hand[18].y + 0.03;

  // 반드시 검지·중지는 펴져 있어야 하고
  if (!(indexUp && middleUp)) return false;

  // 반드시 약지·새끼는 "확실하게" 접혀 있어야 함
  if (!ringBent || !pinkyBent) return false;

  // --- V 모양 간격 체크 (중요!) ---
  let dx = abs(hand[8].x - hand[12].x); // 검지 vs 중지 간격
  if (dx < 0.04) return false; // 너무 붙어 있으면 V 아님

  return true;
}

//엄지척
function isThumbsUp(hand) {

  // 엄지는 확실히 위로
  let thumbUp = hand[4].y < hand[3].y;

  // 나머지 손가락은 확실히 접혀 있어야 한다
  let ringBent  = hand[16].y > hand[14].y + 0.04;
let pinkyBent = hand[20].y > hand[18].y + 0.04;
let middleBent = hand[12].y > hand[10].y + 0.04;
let indexBent  = hand[8].y  > hand[6].y  + 0.04;

  if (!(thumbUp && indexBent && middleBent && ringBent && pinkyBent)) {
    return false;
  }

  return true;
}

function isThumbsDown(hand) {
  let thumbDown = hand[4].y > hand[3].y; // 엄지가 아래

  let indexBent  = hand[8].y  > hand[6].y  + 0.04;
  let middleBent = hand[12].y > hand[10].y + 0.04;
  let ringBent   = hand[16].y > hand[14].y + 0.04;
  let pinkyBent  = hand[20].y > hand[18].y + 0.04;

  return thumbDown && indexBent && middleBent && ringBent && pinkyBent;
}

//인사제스쳐
function isWaving(hand) {

  // ❶ 손가락 4개가 확실히 펴져 있어야 함
  let indexUp  = hand[8].y  < hand[6].y - 0.02;
  let middleUp = hand[12].y < hand[10].y - 0.02;
  let ringUp   = hand[16].y < hand[14].y - 0.02;
  let pinkyUp  = hand[20].y < hand[18].y - 0.02;

  if (!(indexUp && middleUp && ringUp && pinkyUp)) return false;

  // ❷ 흔들림 측정 (x좌표)
  let x = hand[9].x;  
  waveHistory.push(x);
  if (waveHistory.length > 14) waveHistory.shift();

  if (waveHistory.length < 14) return false;

  // ❸ 충분한 왕복 움직임
  let changes = 0;
  for (let i = 2; i < waveHistory.length; i++) {
    if (abs(waveHistory[i] - waveHistory[i-2]) > 0.035) {
      changes++;
    }
  }

  return changes >= 4;
}


// 손 영역 polygon
function getHandPolygons(hand) {
  let pts = hand.map(lm => ({
    x: width - lm.x * width,
    y: lm.y * height
  }));

  let palm = [pts[0], pts[1], pts[5], pts[9], pts[13], pts[17]];

  let fingers = [];
  let fingerIndices = [
    [1,2,3,4],
    [5,6,7,8],
    [9,10,11,12],
    [13,14,15,16],
    [17,18,19,20]
  ];

  for (let idx of fingerIndices) {
    fingers.push(idx.map(i => pts[i]));
  }

  return { palm, fingers };
}

// polygon in
function pointInPolygon(px, py, poly) {
  let inside = false;

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    let xi = poly[i].x, yi = poly[i].y;
    let xj = poly[j].x, yj = poly[j].y;

    let intersect = ((yi > py) != (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}


// ------------------------------------------------------
// PARTICLE CLASS
// ------------------------------------------------------
class HeartParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-3, -1);
    this.alpha = 255;
    this.size = random(10, 20);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.alpha -= 8;
  }

  draw() {
    push();
    translate(this.x, this.y);
    fill(255, 200, 220, this.alpha);
    noStroke();

    beginShape();
    vertex(0, -this.size * 0.3);
    bezierVertex(-this.size, -this.size, -this.size * 1.2, this.size * 0.5, 0, this.size);
    bezierVertex(this.size * 1.2, this.size * 0.5, this.size, -this.size, 0, -this.size * 0.3);
    endShape(CLOSE);

    pop();
  }

  isDead() { return this.alpha <= 0; }
}

//엄지척
class StarParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // 🚀 더 큰 별
    this.size = random(18, 30);

    // 더 강한 퍼짐
    this.vx = random(-2.5, 2.5);
    this.vy = random(-3, -1);

    this.alpha = 255;
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05;        // gravity
    this.rotation += this.rotationSpeed;

    this.alpha -= 10;       // 천천히 사라짐
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);

    // ✨ 밝은 금색 아래쪽
    fill(255, 245, 200, this.alpha);
    noStroke();

    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI * i / 5;
      let rOuter = this.size;
      let rInner = this.size * 0.45; // 2단계 별

      vertex(cos(angle) * rOuter, sin(angle) * rOuter);
      vertex(cos(angle + PI/5) * rInner, sin(angle + PI/5) * rInner);
    }
    endShape(CLOSE);

    pop();
  }

  isDead() {
    return this.alpha <= 0;
  }
}

  //붐따
  class InkDrop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.3, 0.3);  // 잉크는 거의 아래만
    this.vy = random(2, 4);       // 빠르게 아래로 떨어짐
    this.alpha = 255;
    this.size = random(8, 15);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    this.vy += 0.6;      // 강한 중력 (잉크 낙하 느낌)
    this.alpha -= 8;      // 사라짐
  }

  draw() {
    push();
    fill(150, 90, 255, this.alpha); // 잉크색 (보라 계열)
    noStroke();
    ellipse(this.x, this.y, this.size, this.size * 1.2);
    pop();
  }

  isDead() {
    return this.alpha <= 0;
  }
}

//인사제스쳐
class WaveSpark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-3, 3);
    this.vy = random(-3, -1);
    this.alpha = 255;
    this.size = random(10, 20);

    // 화이트~옅은 노랑 random mix
    let c1 = color(255, 255, 255);
    let c2 = color(255, 245, 180);
    let c3 = color(255, 220, 120);

    this.col = lerpColor(c1, c2, random(0.4, 0.8));
    this.col = lerpColor(this.col, c3, random(0.2));
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 10;
  }

  draw() {
    push();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    noStroke();
    ellipse(this.x, this.y, this.size);
    pop();
  }

  isDead() { return this.alpha <= 0; }
}

function handSpeed(handHistory, x, y) {
  handHistory.push({x, y});
  if (handHistory.length > 10) handHistory.shift();

  if (handHistory.length < 10) return 999; // 아직 데이터 부족

  let dx = abs(handHistory[9].x - handHistory[0].x);
  let dy = abs(handHistory[9].y - handHistory[0].y);

  return dx + dy; // speed-like metric
}


