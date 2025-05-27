// 1 평당 m² → 평 비율
const M2_TO_PYEONG = 0.3025;

// 숫자+단위 패턴. 뒤에 '('가 없을 때만 매치하도록 부정형 전방탐색(?!\s*\() 추가
const AREA_REGEX = /(\d+(?:\.\d+)?)\s*(?:m²|㎡)(?!\s*\()/g;

/**
 * 단일 텍스트 노드를 변환해서 대체합니다.
 */
function convertTextNode(textNode) {
  const oldText = textNode.nodeValue;
  const newText = oldText.replace(AREA_REGEX, (_, m2) => {
    const pyeong = (parseFloat(m2) * M2_TO_PYEONG).toFixed(2);
    return `${m2}m² (${pyeong}평)`;
  });
  if (newText !== oldText) {
    textNode.nodeValue = newText;
  }
}

/**
 * 특정 root(기본 document.body) 내부의 텍스트 노드만 스캔 & 변환
 */
function scanAndConvert(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: node =>
        AREA_REGEX.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
    },
    false
  );
  let node;
  while (node = walker.nextNode()) {
    convertTextNode(node);
  }
}

// 1) 초기 로드 시 document 전체 스캔
scanAndConvert();

// 2) 동적으로 추가되는 노드만 처리하도록 Observer 세팅
const observer = new MutationObserver(mutations => {
  for (const { addedNodes } of mutations) {
    addedNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        // 순수 텍스트 노드가 바로 추가된 경우
        convertTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // 새로 추가된 엘리먼트(root) 내부만 스캔
        scanAndConvert(node);
      }
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});