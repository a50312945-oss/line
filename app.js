/**
 * 電流計算工具 - 主程式（新版 UI）
 * 功能：容量/電流雙向計算、線徑與銅排查詢
 * @version 2.1.0
 */

// ========================================
// 資料表定義
// ========================================

const WIRE_TABLE = [
  ["3.5", 30, 27],
  ["5.5", 39, 35],
  ["8", 51, 46],
  ["14", 74, 67],
  ["22", 93, 84],
  ["30", 116, 104],
  ["38", 130, 117],
  ["50", 155, 140],
  ["60", 176, 159],
  ["80", 208, 187],
  ["100", 242, 218],
  ["125", 277, 249],
  ["150", 309, 278],
  ["60*2", 350, 300],
  ["80*2", 400, 400],
  ["125*2", 500, null],
  ["150*2", null, 500],
  ["80*3", 600, null],
  ["100*3", null, 600],
  ["125*3", 800, null],
  ["150*3", null, 800],
  ["125*4", 1000, null],
  ["150*4", null, 1000]
];

const BUSBAR_TABLE = [
  [15, 2, 1, 30, 130],
  [15, 3, 1, 45, 150],
  [20, 2, 1, 40, 155],
  [20, 3, 1, 60, 175],
  [20, 5, 1, 100, 220],
  [25, 2, 1, 50, 200],
  [25, 3, 1, 75, 250],
  [25, 5, 1, 125, 330],
  [30, 3, 1, 90, 305],
  [30, 5, 1, 150, 370],
  [30, 5, 2, 300, 820],
  [40, 3, 1, 120, 420],
  [40, 5, 1, 200, 715],
  [40, 5, 2, 400, 1230],
  [50, 5, 1, 250, 585],
  [50, 10, 1, 500, 875],
  [50, 10, 2, 1000, 1600],
  [60, 5, 1, 300, 700],
  [60, 8, 1, 480, 875],
  [60, 10, 1, 600, 1170],
  [60, 10, 2, 1200, 1790],
  [80, 5, 1, 400, 1230],
  [80, 10, 1, 800, 1300],
  [80, 10, 2, 1600, 1920],
  [80, 10, 3, 2400, 3310],
  [80, 10, 4, 3200, 4250],
  [100, 5, 1, 500, 1650],
  [100, 10, 1, 1000, 2735],
  [100, 10, 2, 2000, 3950],
  [100, 10, 3, 3000, 5010],
  [100, 10, 4, 4000, 5280],
  [120, 10, 2, 2400, 3100],
  [120, 10, 3, 3600, 4200],
  [120, 10, 4, 4800, 5280]
];

// ========================================
// 全域變數
// ========================================

let currentMode = 'fw'; // 'fw' = 容量→電流, 'bw' = 電流→容量

// ========================================
// 工具函數
// ========================================

function formatNumber(x) {
  if (!isFinite(x)) return 'NaN';
  return parseFloat(x.toPrecision(6)).toString();
}

function formatAmperage(x) {
  return formatNumber(x);
}

function formatPower(x) {
  const kW = x / 1000;
  return formatNumber(kW);
}

// ========================================
// 電壓系統解析
// ========================================

function resolveVoltageSystem() {
  const selection = document.getElementById('voltage-select').value;
  
  if (!selection) {
    throw new Error('請選擇「系統電壓」');
  }

  const presets = {
    '4W_380': { V: 380, is3: true, B: 4 },
    '3W_220': { V: 220, is3: true, B: 3 },
    '1P3W_220': { V: 220, is3: false, B: 2 }
  };

  if (presets[selection]) {
    return presets[selection];
  }

  if (selection === 'custom') {
    const customV = parseFloat(document.getElementById('custom-voltage').value);
    if (!isFinite(customV) || customV <= 0) {
      throw new Error('已選擇自訂電壓，但未輸入有效數值');
    }
    const is3Phase = document.getElementById('three-phase').checked;
    return {
      V: customV,
      is3: is3Phase,
      B: is3Phase ? 3 : 2
    };
  }

  throw new Error('未知的電壓系統');
}

// ========================================
// 線徑與銅排選擇
// ========================================

function selectWireSize(current, isFourWire) {
  for (const [size, cap3W, cap4W] of WIRE_TABLE) {
    const capacity = isFourWire ? cap4W : cap3W;
    if (capacity === null) continue;
    if (capacity >= current) return size;
  }
  return null;
}

function selectBusbar(current) {
  const sortedByAC = BUSBAR_TABLE.slice().sort((a, b) => {
    const capA = a[4] ?? 1e9;
    const capB = b[4] ?? 1e9;
    return capA - capB;
  });

  for (const row of sortedByAC) {
    const acCapacity = row[4];
    if (acCapacity === null) continue;
    if (acCapacity >= current) {
      return {
        w: row[0],
        t: row[1],
        p: row[2]
      };
    }
  }
  return null;
}

// ========================================
// UI 模式切換
// ========================================

function switchMode(mode) {
  currentMode = mode;
  
  const panelFw = document.getElementById('panel-fw');
  const panelBw = document.getElementById('panel-bw');
  const tabFw = document.getElementById('tab-fw');
  const tabBw = document.getElementById('tab-bw');
  
  if (mode === 'fw') {
    panelFw.classList.remove('hidden');
    panelBw.classList.add('hidden');
    
    tabFw.classList.add('bg-tech-surface', 'text-tech-heading', 'shadow-sm', 'border', 'border-tech-border/50');
    tabFw.classList.remove('text-tech-text/70');
    
    tabBw.classList.remove('bg-tech-surface', 'text-tech-heading', 'shadow-sm', 'border', 'border-tech-border/50');
    tabBw.classList.add('text-tech-text/70');
  } else {
    panelFw.classList.add('hidden');
    panelBw.classList.remove('hidden');
    
    tabBw.classList.add('bg-tech-surface', 'text-tech-heading', 'shadow-sm', 'border', 'border-tech-border/50');
    tabBw.classList.remove('text-tech-text/70');
    
    tabFw.classList.remove('bg-tech-surface', 'text-tech-heading', 'shadow-sm', 'border', 'border-tech-border/50');
    tabFw.classList.add('text-tech-text/70');
  }
  
  // 重置結果
  resetResults();
}

// ========================================
// 結果顯示
// ========================================

function resetResults() {
  document.getElementById('result-value').textContent = '--';
  document.getElementById('result-unit').textContent = 'AMPS';
  document.getElementById('result-label').textContent = '計算電流';
  document.getElementById('wire-size').textContent = '--';
  document.getElementById('busbar-spec').textContent = '--';
}

function displayResults(data) {
  const { value, unit, label, wireSize, busbar } = data;
  
  document.getElementById('result-value').textContent = value;
  document.getElementById('result-unit').textContent = unit;
  document.getElementById('result-label').textContent = label;
  
  // 線徑顯示
  if (wireSize) {
    document.getElementById('wire-size').textContent = wireSize;
  } else {
    document.getElementById('wire-size').textContent = '--';
    document.getElementById('wire-size').parentElement.querySelector('.text-\\[10px\\]').textContent = '無對應規格';
  }
  
  // 銅排顯示
  if (busbar) {
    document.getElementById('busbar-spec').textContent = `${busbar.w}×${busbar.t}×${busbar.p}`;
  } else {
    document.getElementById('busbar-spec').textContent = '--';
  }
}

function displayError(message) {
  document.getElementById('result-value').textContent = '錯誤';
  document.getElementById('result-unit').textContent = 'ERROR';
  document.getElementById('result-label').textContent = message;
  document.getElementById('wire-size').textContent = '--';
  document.getElementById('busbar-spec').textContent = '--';
}

// ========================================
// 主要計算邏輯
// ========================================

function calculate() {
  try {
    const { V, is3, B } = resolveVoltageSystem();
    const sqrtFactor = is3 ? Math.sqrt(3) : 1;
    const safetyFactor = 1.25;

    if (currentMode === 'fw') {
      // 模式 1: 由容量算電流
      const power = parseFloat(document.getElementById('input-watts').value);
      if (!isFinite(power) || power <= 0) {
        throw new Error('請輸入有效的容量值');
      }

      const current = (power / V) / sqrtFactor * safetyFactor;
      const wireSize = selectWireSize(current, B === 4);
      const busbar = selectBusbar(current);

      displayResults({
        value: formatAmperage(current),
        unit: 'AMPS',
        label: '計算電流',
        wireSize: wireSize,
        busbar: busbar
      });

    } else {
      // 模式 2: 由電流算容量
      const current = parseFloat(document.getElementById('input-amps').value);
      if (!isFinite(current) || current <= 0) {
        throw new Error('請輸入有效的電流值');
      }

      const power = (current / safetyFactor) * V * sqrtFactor;
      const powerKW = power / 1000;
      const wireSize = selectWireSize(current, B === 4);
      const busbar = selectBusbar(current);

      displayResults({
        value: formatPower(power),
        unit: 'kW',
        label: '計算容量',
        wireSize: wireSize,
        busbar: busbar
      });
    }

  } catch (error) {
    displayError(error.message);
    console.error('計算錯誤:', error);
  }
}

// ========================================
// PWA 安裝提示
// ========================================

let deferredPrompt;

function setupInstallPrompt() {
  const installPrompt = document.getElementById('install-prompt');
  const installButton = document.getElementById('install-button');
  const dismissButton = document.getElementById('dismiss-button');

  // 監聽 beforeinstallprompt 事件
  window.addEventListener('beforeinstallprompt', (e) => {
    // 防止 Chrome 67 及更早版本自動顯示提示
    e.preventDefault();
    // 儲存事件以便稍後觸發
    deferredPrompt = e;
    // 顯示我們的安裝提示
    installPrompt.classList.remove('hidden');
    
    console.log('💡 PWA 安裝提示已準備好');
  });

  // 安裝按鈕點擊
  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) {
        console.log('❌ 沒有可用的安裝提示');
        return;
      }

      // 顯示安裝提示
      deferredPrompt.prompt();
      
      // 等待用戶回應
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`👉 用戶選擇: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('✅ 用戶接受安裝 PWA');
      } else {
        console.log('❌ 用戶拒絕安裝 PWA');
      }
      
      // 清除 deferredPrompt
      deferredPrompt = null;
      // 隱藏提示
      installPrompt.classList.add('hidden');
    });
  }

  // 關閉按鈕點擊
  if (dismissButton) {
    dismissButton.addEventListener('click', () => {
      installPrompt.classList.add('hidden');
      // 7 天後再顯示
      localStorage.setItem('installPromptDismissed', Date.now().toString());
    });
  }

  // 檢查是否已安裝
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA 已成功安裝');
    installPrompt.classList.add('hidden');
    deferredPrompt = null;
    
    // 可選：顯示感謝訊息
    showNotification('✨ 安裝成功！現在可以從主畫面啟動應用程式了');
  });

  // 檢查上次關閉時間
  const dismissedTime = localStorage.getItem('installPromptDismissed');
  if (dismissedTime) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      // 7 天內不顯示
      return;
    }
  }
}

// 顯示通知（輔助函數）
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-soft-secondary text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========================================
// 事件監聽器
// ========================================

function initializeApp() {
  // 設定 PWA 安裝提示
  setupInstallPrompt();

  // 自訂電壓切換
  const voltageSelect = document.getElementById('voltage-select');
  const customContainer = document.getElementById('custom-voltage-container');
  const customInput = document.getElementById('custom-voltage');
  
  voltageSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customContainer.classList.remove('opacity-50', 'pointer-events-none');
      customInput.disabled = false;
      customInput.focus();
    } else {
      customContainer.classList.add('opacity-50', 'pointer-events-none');
      customInput.disabled = true;
    }
  });

  // Enter 鍵觸發計算
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        calculate();
      }
    });
  });

  console.log('✅ 電流計算工具已初始化（新版 UI）');
}

// ========================================
// Service Worker 註冊
// ========================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('✅ Service Worker 註冊成功:', registration.scope);
      } catch (error) {
        console.error('❌ Service Worker 註冊失敗:', error);
      }
    });
  }
}

// ========================================
// 應用程式啟動
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

registerServiceWorker();
