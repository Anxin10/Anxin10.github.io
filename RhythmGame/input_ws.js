var socket = null;

// 將從伺服器收到的陣列索引對應到鍵盤按鍵
const wsKeyMap = {
  0: "q", 1: "w", 2: "e",
  3: "a", 4: "s", 5: "d",
  6: "z", 7: "x", 8: "c"
};

// 儲存上一次的控制狀態，用來偵測按鍵是按下還是放開
let previousCtrl = Array(9).fill(0);

/**
 * 模擬鍵盤事件
 * @param {string} key - 要模擬的按鍵，例如 'w', 'a'
 * @param {string} type - 事件類型，'keydown' 或 'keyup'
 */
function simulateKeyEvent(key, type = "keydown") {
  const event = new KeyboardEvent(type, { key: key, bubbles: true });
  document.dispatchEvent(event);
}

/**
 * 設定並初始化 WebSocket 連線
 */
function setupInputWebSocket() {
  try {
    // 建立 WebSocket 連線。注意：路徑結尾需要加上 /ws
    socket = new WebSocket("wss://web-production-07332.up.railway.app/ws");
                           //wss://icdc.onrender.com/ws"
                          //wss://icdc-my-ws-demo-production.up.railway.app/ws
                           //wss://57eb7299198c.ngrok-free.app/ws
    // 設定連線、關閉、錯誤時的處理函式
    socket.onopen = () => console.log("[WS] 成功連線到伺服器");
    socket.onclose = () => console.log("[WS] 與伺服器的連線已中斷");
    socket.onerror = err => console.error("[WS] 連線發生錯誤:", err);

    // 設定收到訊息時的處理函式
    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        // 如果收到的資料中沒有 'ctrl' 欄位，就直接忽略
        if (!("ctrl" in data)) return;

        const ctrl = data.ctrl;
        // 遍歷控制陣列
        for (let i = 0; i < ctrl.length; i++) {
          const key = wsKeyMap[i];
          if (!key) continue; // 如果索引沒有對應的按鍵，就跳過

          // 偵測狀態變化
          // 從 0 -> 1 代表按鍵被按下
          if (ctrl[i] === 1 && previousCtrl[i] === 0) {
            simulateKeyEvent(key, "keydown");
            console.log(`Simulating keydown: ${key}`);
          } 
          // 從 1 -> 0 代表按鍵被放開
          else if (ctrl[i] === 0 && previousCtrl[i] === 1) {
            simulateKeyEvent(key, "keyup");
            console.log(`Simulating keyup: ${key}`);
          }
        }
        // 更新上一次的狀態
        previousCtrl = ctrl;
      } catch (e) {
        console.error("[WS] 解析 JSON 時發生錯誤:", e);
      }
    };
  } catch (e) {
    // 如果 WebSocket 初始化失敗（例如在沒有網路的環境下），在主控台顯示警告
    console.warn("[WS] WebSocket 初始化失敗:", e);
    socket = null;
  }
}

// 當 HTML 文件完全載入並解析完成後，執行 WebSocket 設定
document.addEventListener("DOMContentLoaded", () => {
  setupInputWebSocket();
});


