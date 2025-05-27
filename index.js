document.addEventListener('DOMContentLoaded', function() {
    const manifest = chrome.runtime.getManifest();
    document.querySelector('#version').textContent = `v${manifest.version}`;

    const toggle = document.querySelector('#enableToggle');
    const toggleBtn = document.querySelector('#toggleTag');

    // 1. 초기 상태: 스토리지에서 가져와 토글 반영 & content에 상태 알림
    chrome.storage.local.get(['convertEnabled'], result => {
        const enabled = !!result.convertEnabled;
        toggle.checked = enabled;
        sendConvertStatus(enabled);
    });

    // 2. 토글 버튼 클릭 시
    toggleBtn.addEventListener('click', () => {
        toggle.checked = !toggle.checked;
        if (!toggle.checked) {
            document.querySelector('#toggleActionInfo').textContent = '비활성화 된 부분은 새로고침 이후 적용됩니다.';
        }else{
            document.querySelector('#toggleActionInfo').textContent = '';
        }

        chrome.storage.local.set({ convertEnabled: toggle.checked }, () => {
            sendConvertStatus(toggle.checked);
        });
    });

    function sendConvertStatus(isEnabled) {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: toggle.checked ? "ENABLE_CONVERT" : "DISABLE_CONVERT" }
            );
        });
    }
});