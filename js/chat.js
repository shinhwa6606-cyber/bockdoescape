// ═══════════════════════════════════════════════════════════════
//  IN-GAME CHAT & RIVAL AI CHAT REACTION SYSTEM
//  Roblox Rivals 스타일 인게임 채팅창 및 라이벌 반응 엔진
// ═══════════════════════════════════════════════════════════════

class ChatSystem {
    constructor() {
        this.messages = [];
        this.lastReactionTime = 0;
        this.recentReactionTypes = new Set();
        this._setupChatUI();
    }

    _setupChatUI() {
        let container = document.getElementById('chat-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'chat-container';
            container.style.cssText = `
                position: fixed;
                top: 75px;
                left: 20px;
                width: 380px;
                max-height: 220px;
                pointer-events: none;
                z-index: 99990;
                display: flex;
                flex-direction: column;
                gap: 6px;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            `;
            document.body.appendChild(container);
        }
        this.container = container;

        // Chat styles
        const style = document.createElement('style');
        style.textContent = `
            .chat-msg {
                background: rgba(10, 14, 24, 0.78);
                backdrop-filter: blur(8px);
                border-left: 3px solid #00f0ff;
                border-radius: 4px;
                padding: 6px 12px;
                color: #e0e8f0;
                font-size: 13px;
                line-height: 1.4;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                animation: chatSlideIn 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28);
                transition: opacity 0.5s ease;
                word-break: break-word;
            }
            .chat-msg.rival {
                border-left-color: #ff3366;
            }
            .chat-sender-rival {
                color: #ff4d6d;
                font-weight: 700;
                margin-right: 6px;
                text-shadow: 0 0 8px rgba(255, 77, 109, 0.4);
            }
            .chat-sender-system {
                color: #00f0ff;
                font-weight: 700;
                margin-right: 6px;
            }
            .chat-badge {
                display: inline-block;
                background: rgba(255, 77, 109, 0.2);
                border: 1px solid rgba(255, 77, 109, 0.4);
                color: #ff85a1;
                font-size: 10px;
                padding: 1px 5px;
                border-radius: 3px;
                margin-right: 5px;
                font-family: monospace;
            }
            @keyframes chatSlideIn {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
    }

    addMessage(sender, text, isRival = false) {
        if (!this.container) return;

        const msgEl = document.createElement('div');
        msgEl.className = 'chat-msg' + (isRival ? ' rival' : '');

        if (isRival) {
            msgEl.innerHTML = `<span class="chat-badge">RIVAL</span><span class="chat-sender-rival">${sender}:</span><span>${text}</span>`;
        } else {
            msgEl.innerHTML = `<span class="chat-sender-system">${sender}:</span><span>${text}</span>`;
        }

        this.container.appendChild(msgEl);

        // Keep maximum 6 messages visible
        while (this.container.children.length > 6) {
            this.container.removeChild(this.container.firstChild);
        }

        // Auto fade out after 6 seconds
        setTimeout(() => {
            msgEl.style.opacity = '0';
            setTimeout(() => {
                if (msgEl.parentNode) msgEl.parentNode.removeChild(msgEl);
            }, 600);
        }, 6500);
    }

    // ────────────────────────────────────────────────────────────
    //  상대 AI의 실시간 채팅 반응 엔진
    // ────────────────────────────────────────────────────────────
    triggerRivalReaction(type, immediate = false) {
        const now = Date.now();
        // 채팅 쿨다운 (최소 2.0초 간격)
        if (!immediate && now - this.lastReactionTime < 2200) return;

        const reactions = {
            // 🎯 사일런트 유도 에임핵 피격 시
            silent_aim: [
                "??? 어디 보고 쐈는데 머리가 맞냐고 ㅋㅋㅋㅋ",
                "총알 휜 거 내 눈에만 보임?? 실화냐?",
                "시점은 딴 데 보는데 헤드가 터지네 ㅋㅋㅋ",
                "에임봇 티 존나 나네 ㅋㅋㅋㅋ",
                "님 뭐 벽 보고 쏴도 헤드 맞겠네요 ㅡㅡ",
                "유도탄 쏘네 진짜 ㅋㅋㅋㅋㅋ",
                "아니 님 손캠 인증 좀 해보셈 ㅋㅋㅋ"
            ],
            // 🌪️ 스핀봇 목격/피격 시
            spinbot: [
                "와 팽이 도는 거 보소 ㅋㅋㅋㅋㅋㅋ",
                "스핀봇 ㄷㄷㄷㄷ 어지럽지도 않냐?",
                "화면 360도로 돌면서 헤드 맞추네 ㅋㅋㅋ",
                "핵 대놓고 쓰네 ㅋㅋㅋㅋ 신고 넣음 ㅅㄱ",
                "팽이 돌리면서 에임핵까지 미쳤네 ㅋㅋㅋ",
                "스핀봇 핵쟁이 만남 ㅋㅋㅋㅋ 박제한다"
            ],
            // 🛸 플라이/노클립 목격 시
            fly: [
                "하늘에서 날아다니네 어이가 없네 ㅋㅋㅋ",
                "비행기냐? ㅋㅋㅋㅋㅋㅋ",
                "벽 뚫고 날아오네 공중전 RPG 게임임?",
                "공중부양 실화냐고 ㅋㅋㅋㅋ"
            ],
            // 🏃 슬라이딩 목격 시
            slide: [
                "슬라이딩 무빙 뭔데 ㄷㄷ",
                "무빙 쫌 치네?",
                "앉아서 미끄러져 들어오네 ㄲㅂ"
            ],
            // 👑 갓 모드 목격 시
            god: [
                "데미지가 안 들어가는데 버그냐?",
                "왜 안 죽음??? 무적핵임?",
                "피가 안 다는데 실화임?"
            ],
            // 💥 메테오/블랙홀/원샷원킬 등 특수핵
            special: [
                "스킬 뭔데 ㅋㅋㅋ RPG 게임 하냐?",
                "데미지 99999 ㅋㅋㅋ 원샷원킬 레전드",
                "블랙홀은 또 뭔데 억까 오지네 ㅡㅡ"
            ],
            // 🎬 킬캠 리플레이 재생 시작 시
            replay_start: [
                "와 리플레이 보니까 대놓고 핵이네 ㅋㅋㅋ",
                "다시 봐도 총알 휘어서 머리로 빨려들어오네",
                "킬캠 박제 완료 유튜브 올린다 ㅋㅋㅋ",
                "리플레이 다시 보니까 진짜 어이없네 ㅋㅋㅋ",
                "저기서 쏜 게 어떻게 맞은 거임? ㅋㅋㅋ"
            ],
            // 🎬 킬캠 리플레이 피격 순간
            replay_hit: [
                "봐봐 저기서 총알 꺾여서 머리에 박히잖아 ㅋㅋㅋ",
                "각도 1도 안 맞는데 헤드샷 뜨는 거 실화?",
                "핵 작작 쓰셈 진짜 ㅋㅋㅋㅋㅋ"
            ],
            // 🏆 라운드 패배했을 때 (상대가 죽음)
            round_lost: [
                "아 렉 걸렸네 ㅡㅡ",
                "아 ㄲㅂ 다음 라운드 두고 봐라",
                "샷발 레전드네 진짜",
                "이번엔 봐줬다 다음 판은 내가 이김"
            ],
            // 💀 라운드 승리했을 때 (플레이어가 죽음)
            round_won: [
                "EZ~ 컷!",
                "나 쫌 치는 듯? ㅋㅋㅋ",
                "핵 써도 못 이기쥬? ㅋㅋㅋ",
                "이번 판은 내 승리다 ㅅㄱ"
            ]
        };

        const list = reactions[type];
        if (!list || list.length === 0) return;

        const text = list[Math.floor(Math.random() * list.length)];
        this.lastReactionTime = now;

        // 실제 사람이 타이핑하듯 0.4초 ~ 1.0초 랜덤 딜레이 후 발송
        const delay = immediate ? 150 : (400 + Math.random() * 600);
        setTimeout(() => {
            this.addMessage('RIVAL [PRO]', text, true);
        }, delay);
    }

    // ────────────────────────────────────────────────────────────
    //  📢 일반 전투 중 라이벌 자동 채팅 시스템 (일반전 채팅)
    //  라운드가 시작되면 자동으로 실전 느낌의 채팅을 불규칙하게 침
    // ────────────────────────────────────────────────────────────
    startRoundChat() {
        this._stopAmbientChat();
        this._scheduleNextAmbientChat();
    }

    stopRoundChat() {
        this._stopAmbientChat();
    }

    _stopAmbientChat() {
        if (this._ambientChatTimer) {
            clearTimeout(this._ambientChatTimer);
            this._ambientChatTimer = null;
        }
    }

    _scheduleNextAmbientChat() {
        // 8초 ~ 22초 사이 불규칙 간격으로 일반전 채팅 발송
        const delay = 8000 + Math.random() * 14000;
        this._ambientChatTimer = setTimeout(() => {
            // 게임 중일 때만 발송
            if (window.game?.isPlaying) {
                this._fireAmbientChat();
            }
            // 다음 채팅 예약
            if (window.game?.isPlaying) {
                this._scheduleNextAmbientChat();
            }
        }, delay);
    }

    _fireAmbientChat() {
        // 일반전 상황에 따른 채팅 선택
        const player = window.gamePlayer;
        const enemy = window.game?.enemies?.[0];
        const anyHack = window.hackSystem && (
            window.hackSystem.flyHackEnabled || window.hackSystem.aimBotEnabled ||
            window.hackSystem.godFlightEnabled || window.hackSystem.rapidFireEnabled
        );

        // 상황별 일반전 채팅 풀
        const combatChats = [
            "각 좀 보고 쏴라",
            "에이 빗나갔네 ㅋㅋ",
            "야 진짜 맞았냐?",
            "크 헤드샷~",
            "오 무빙 치네?",
            "버스킹 하냐 ㅋㅋ 이리저리 뛰어다니고",
            "야 조준 좀 해라",
            "gg되나?",
            "ㅋㅋ 밀리네",
            "집중해야겠다",
            "지금 내가 유리한 듯",
            "샷 좀 맞춰봐",
            "크 나 실력 늘었나? ㅋㅋ",
            "좀만 더 밀면 끝나겠는데",
            "앞만 보고 뛰지 말고 옆으로도 봐",
        ];

        // 핵 감지 시 의심 채팅 풀
        const suspiciousChats = [
            "어? 방금 그게 뭐야",
            "잠깐 그 샷 이상하지 않음?",
            "뭔가 이상한데... 기분 탓인가",
            "에임 뭔가 짜증나네 ㅋㅋ",
            "이 게임 렉 있나? 총알이 이상해",
        ];

        let pool = combatChats;
        if (anyHack && Math.random() < 0.5) {
            pool = suspiciousChats;
        }

        const text = pool[Math.floor(Math.random() * pool.length)];
        this.addMessage('RIVAL [PRO]', text, true);
    }
}

window.chatSystem = null;
