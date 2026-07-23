"use strict";

const CONFIG_FILE = "groups.json";
const STORAGE_KEY = "pretestAssignedGroup";

/**
 * 從目前開放的組別中隨機抽取一組。
 */
function selectRandomGroup(groups) {
  const randomIndex = Math.floor(Math.random() * groups.length);
  return groups[randomIndex];
}

/**
 * 立即跳轉到指定問卷。
 */
function redirectToGroup(group) {
  window.location.replace(group.url);
}

/**
 * 顯示無法分配時的簡單錯誤訊息。
 * 正常情況下，受試者不會看到這個畫面。
 */
function showError(message) {
  document.body.textContent = message;
}

/**
 * 讀取組別設定並分配問卷。
 */
async function assignParticipant() {
  try {
    const response = await fetch(
      `${CONFIG_FILE}?v=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `Unable to load groups.json: ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.groups || !Array.isArray(data.groups)) {
      throw new Error("Invalid groups.json format.");
    }

    /*
     * 只保留：
     * 1. enabled 為 true
     * 2. 有有效 HTTPS 網址
     */
    const activeGroups = data.groups.filter((group) => {
      return (
        group.enabled === true &&
        typeof group.id === "string" &&
        typeof group.url === "string" &&
        group.url.startsWith("https://")
      );
    });

    if (activeGroups.length === 0) {
      showError("目前問卷尚未開放，請稍後再試。");
      return;
    }

    /*
     * 檢查這個瀏覽器之前是否已分配過組別。
     */
    const previousGroupId =
      window.localStorage.getItem(STORAGE_KEY);

    if (previousGroupId) {
      const previousGroup = activeGroups.find(
        (group) => group.id === previousGroupId
      );

      /*
       * 如果原本的組別仍然開放，
       * 就直接回到同一份問卷，不重新抽組。
       */
      if (previousGroup) {
        redirectToGroup(previousGroup);
        return;
      }

      /*
       * 如果原組別已被研究者關閉，
       * 就清除舊紀錄並重新分配。
       */
      window.localStorage.removeItem(STORAGE_KEY);
    }

    const selectedGroup = selectRandomGroup(activeGroups);

    window.localStorage.setItem(
      STORAGE_KEY,
      selectedGroup.id
    );

    redirectToGroup(selectedGroup);
  } catch (error) {
    console.error(error);

    showError(
      "目前無法開啟問卷，請稍後重新點擊原連結。"
    );
  }
}

assignParticipant();
