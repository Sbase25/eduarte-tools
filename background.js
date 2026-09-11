const EDUARTE_PAGES = [
  "https://*.educus.nl/*",
  "https://*.eduarte.nl/*",
];

const MENU_OPEN = "eduarte-tools-open";

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_OPEN,
      title: "Eduarte Tools openen",
      contexts: ["page"],
      documentUrlPatterns: EDUARTE_PAGES,
    });
  });
}

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === MENU_OPEN) {
    chrome.action.openPopup();
  }
});
