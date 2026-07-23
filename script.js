const CONFIG_FILE = "groups.json";
const STORAGE_KEY = "experimentAssignedGroup";

const statusElement = document.getElementById("status");
const loaderElement = document.getElementById("loader");
const retryButton = document.getElementById("retryButton");

function showError(message) {
  loaderElement.hidden = true;
  statusElement.classList.add("error");
  statusElement.textContent = message;
  retryButton.hidden = false;
}

function redirectToGroup(group) {
  statusElement.classList.remove("error");
  statusElement.textContent = "分配完成，正在前往問卷……";

  window.setTimeout(() => {
    window.location.replace(group.url);
  }, 600);
}

function selectRandomGroup(groups) {
  const randomIndex = Math.floor(Math.random() * groups.length);
  return groups[randomIndex];
}

async function assignParticipant() {
  loaderElement.hidden = false;
  retryButton.hidden = true;
  statusElement.classList.remove("error");
  statusElement.textContent =
    "系統正在為您隨機分配問卷，請勿關閉此頁面。";

  try {
    const response = await fetch(
      `${CONFIG_FILE}?timestamp=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`設定檔讀取失敗：${response.status}`);
    }

    const data = await response.json();

    if (!data.groups || !Array.isArray(data.groups)) {
      throw new Error("groups.json 格式不正確。");
    }

    const activeGroups = data.groups.filter((group) => {
      return (
        group.enabled === true &&
        typeof group.url === "string" &&
        group.url.startsWith("https://")
      );
    });

    if (activeGroups.length === 0) {
      showError(
        "目前所有問卷組別皆已關閉，請聯絡研究人員。"
      );
      return;
    }

    const previousGroupId =
      window.localStorage.getItem(STORAGE_KEY);

    if (previousGroupId) {
      const previousGroup = activeGroups.find(
        (group) => group.id === previousGroupId
      );

      if (previousGroup) {
        redirectToGroup(previousGroup);
        return;
      }

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
      "目前無法載入問卷分配設定，請重新整理頁面後再試。"
    );
  }
}

retryButton.addEventListener("click", assignParticipant);

assignParticipant();
