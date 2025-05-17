(function () {
  if (window.__initScraper) return;
  window.__initScraper = true;

  let prevMessages = [];
  let allMessages = [];

  function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value === arr2[index]);
  }

  function scrollSpecificScroller(pixels) {
    const scroller = document.querySelector('[class*="scroller"][class*="customTheme"][class*="auto"][role="group"]');
    if (scroller) {
      if (scroller.scrollTop === 0) {
        downloadJSON();
        clearInterval(scrapeInterval);
        window.__initScraper = false;
      } else {
        scroller.scrollBy({ top: pixels, behavior: "smooth" });
      }
    }
  }

  function scrapeMessages() {
    const messageElements = document.querySelectorAll('div[class*="messageContent"], span[class*="username"]');
    const messages = Array.from(messageElements)
      .map(elem => {
        if (!elem.textContent) return null;
        if (elem.className.includes("username")) {
          return { username: elem.textContent.trim() };
        } else {
          return { message: elem.textContent.trim(), uid: elem.id };
        }
      })
      .filter(Boolean);

    if (!arraysAreEqual(messages, prevMessages)) {
      let currentUsername = "";
      messages.forEach(msg => {
        if ("username" in msg) {
          currentUsername = msg.username;
        } else {
          const messageToAppend = { msg: msg.message, username: currentUsername, uid: msg.uid };
          const isDuplicate = allMessages.some(existing =>
            existing.msg === messageToAppend.msg &&
            existing.username === messageToAppend.username &&
            existing.uid === messageToAppend.uid
          );
          if (!isDuplicate) {
            allMessages.push(messageToAppend);
          }
        }
      });
      prevMessages = [...messages];
    }

    scrollSpecificScroller(-200);
  }

  function downloadJSON() {
    allMessages.sort((a, b) => {
      const getId = uid => parseInt(uid.split('-').pop(), 10);
      return getId(a.uid) - getId(b.uid);
    });

    const blob = new Blob([JSON.stringify(Array.from(allMessages), null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "messages.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  scrapeInterval = setInterval(scrapeMessages, 200);
})();
