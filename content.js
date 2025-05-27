const M2_TO_PYEONG = 0.3025;
const AREA_REGEX = /(\d+(?:\.\d+)?)\s*(?:m²|㎡)(?!\s*\()/g;
const PYEONG_TAGGED = "pyeong-converted";
let observer = null;

// 변환 함수
function convertAll(root = document.body) {
  const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null,
      false
  );
  let node;
  while (node = walker.nextNode()) {
    if (AREA_REGEX.test(node.nodeValue)) {
      // 이미 변환된 곳이면 패스
      if (node.parentNode?.classList?.contains(PYEONG_TAGGED)) continue;
      const oldText = node.nodeValue;
      const newText = oldText.replace(AREA_REGEX, (_, m2) => {
        const pyeong = (parseFloat(m2) * M2_TO_PYEONG).toFixed(2);
        return `${m2}m² (${pyeong}평)`;
      });
      if (newText !== oldText) {
        node.nodeValue = newText;
        if (node.parentNode?.classList) node.parentNode.classList.add(PYEONG_TAGGED);
      }
    }
  }
}

// 복원 함수
function restoreAll(root = document.body) {
  // 1. 옵저버 멈춤
  disableObserver();
  // 2. 변환된 곳만 복원
  document.querySelectorAll('.' + PYEONG_TAGGED).forEach(el => {
    // 해당 노드의 모든 자식 텍스트에서 "(n.nn평)" 패턴만 제거
    el.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.nodeValue = child.nodeValue.replace(/\s*\(\d+(\.\d+)?평\)/g, '');
      }
    });
    el.classList.remove(PYEONG_TAGGED);
  });
}

// 옵저버 핸들러
function enableObserver() {
  if (observer) return;
  observer = new MutationObserver(mutations => {
    for (const { addedNodes } of mutations) {
      addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.parentNode?.classList?.contains(PYEONG_TAGGED)) return;
          if (AREA_REGEX.test(node.nodeValue)) convertAll(node.parentNode);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          convertAll(node);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
function disableObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'ENABLE_CONVERT') {
    convertAll();
    enableObserver();
  } else if (msg.action === 'DISABLE_CONVERT') {
    restoreAll();
    // 옵저버는 restoreAll에서 해제됨
  }
});

// 초기 적용 (스토리지 상태에 따라)
chrome.storage.local.get(['convertEnabled'], result => {
  if (result.convertEnabled) {
    convertAll();
    enableObserver();
  } else {
    restoreAll();
  }
});