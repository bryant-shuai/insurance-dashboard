<template>
    <div class="chat-page">
        <div class="ambient-layer" aria-hidden="true">
            <span class="ambient-orb orb-left"></span>
            <span class="ambient-orb orb-right"></span>
            <span class="ambient-line line-left"></span>
            <span class="ambient-line line-right"></span>
        </div>
        <div class="chat-container">
            <!-- Header -->
            <div class="chat-header">
                <div class="header-left">
                    <div class="header-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                        </svg>
                    </div>
                    <div class="header-info">
                        <span class="header-title">智能助手</span>
                        <span class="header-desc">保险数据洞察与问答中枢</span>
                        <span class="header-status">
                            <span class="status-dot"></span>
                            在线
                        </span>
                    </div>
                </div>
                <div class="header-right">
                    <button
                        v-if="lastFailedQuestion && !loading"
                        class="retry-btn"
                        @click="retryLastMessage"
                        title="重试上一条失败消息"
                    >
                        重试
                    </button>
                    <button class="clear-btn" @click="clearMessages" :disabled="messages.length === 0" title="清空对话">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        清空
                    </button>
                </div>
            </div>

            <!-- Suggested Questions -->
            <div v-if="messages.length === 0" class="suggestions-bar">
                <span class="suggestions-label">快速提问</span>
                <div class="suggestions-list">
                    <button
                        v-for="q in suggestedQuestions"
                        :key="q"
                        class="suggestion-chip"
                        @click="useSuggestion(q)"
                    >{{ q }}</button>
                </div>
            </div>

            <!-- Messages -->
            <div class="chat-messages" ref="messagesContainer">
                <div v-if="messages.length === 0" class="empty-state">
                    <div class="empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <p class="empty-title">向智能助手提问</p>
                    <p class="empty-sub">可询问保险数据分析、行业趋势、公司对比等问题</p>
                    <div class="empty-tags">
                        <span>市场份额</span>
                        <span>增长趋势</span>
                        <span>公司对比</span>
                    </div>
                </div>

                <template v-for="(msg, idx) in messages" :key="idx">
                    <!-- User message -->
                    <div v-if="msg.role === 'user'" class="message-row user-row">
                        <div class="message-bubble user-bubble">
                            <div class="bubble-text" v-html="formatMessage(msg.content)"></div>
                        </div>
                        <div class="message-meta user-meta">{{ msg.time }}</div>
                    </div>

                    <!-- Assistant message -->
                    <div v-else class="message-row assistant-row">
                        <div class="assistant-avatar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                            </svg>
                        </div>
                        <div class="assistant-content">
                            <div class="message-bubble assistant-bubble">
                                <div class="bubble-text" v-html="formatMessage(msg.content)"></div>
                            </div>
                            <div class="message-meta">{{ msg.time }}</div>
                        </div>
                    </div>
                </template>

                <!-- Typing indicator -->
                <div v-if="loading" class="message-row assistant-row">
                    <div class="assistant-avatar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                        </svg>
                    </div>
                    <div class="message-bubble assistant-bubble typing-bubble">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                </div>
            </div>

            <!-- Input Area -->
            <div class="chat-input-area">
                <div class="input-wrapper" :class="{ focused: inputFocused, disabled: loading }">
                    <textarea
                        ref="inputRef"
                        v-model="inputMessage"
                        placeholder="输入问题，按 Enter 发送，Shift+Enter 换行..."
                        rows="1"
                        :disabled="loading"
                        @keydown.enter.exact.prevent="sendMessage"
                        @focus="inputFocused = true"
                        @blur="inputFocused = false"
                        @input="autoResize"
                    ></textarea>
                    <button
                        class="send-btn"
                        @click="sendMessage"
                        :disabled="loading || !inputMessage.trim()"
                        :class="{ active: inputMessage.trim() && !loading }"
                    >
                        <svg v-if="!loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                    </button>
                </div>
                <div class="input-hint">
                    <span v-if="loading">助手思考中...</span>
                    <span v-else>Enter 发送 · Shift+Enter 换行</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const inputFocused = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)
const lastFailedQuestion = ref('')

const suggestedQuestions = [
    '各险种保费收入排名如何？',
    '哪家公司综合赔付率最高？',
    '近年行业整体增长趋势？',
    '市场集中度分析',
]

const formatMessage = (content) => {
    if (!content) return ''
    return content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}

const autoResize = () => {
    const el = inputRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

const clearMessages = () => {
    messages.value = []
    lastFailedQuestion.value = ''
}

const useSuggestion = (q) => {
    inputMessage.value = q
    nextTick(() => inputRef.value?.focus())
}

const sendMessage = async () => {
    const text = inputMessage.value.trim()
    if (!text || loading.value) return

    messages.value.push({
        role: 'user',
        content: text,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
    inputMessage.value = ''
    nextTick(() => {
        if (inputRef.value) {
            inputRef.value.style.height = 'auto'
        }
    })
    scrollToBottom()
    loading.value = true
    lastFailedQuestion.value = ''

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || '请求失败')
        }

        const result = await response.text()
        messages.value.push({
            role: 'assistant',
            content: result || '抱歉，我没有理解您的问题。',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        })
    } catch (error) {
        console.error('聊天请求失败:', error)
        message.error('发送消息失败，请重试')
        lastFailedQuestion.value = text
        messages.value.push({
            role: 'assistant',
            content: '抱歉，服务暂时不可用，请稍后再试。',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        })
    } finally {
        loading.value = false
        scrollToBottom()
    }
}

const retryLastMessage = () => {
    if (!lastFailedQuestion.value || loading.value) return
    inputMessage.value = lastFailedQuestion.value
    nextTick(() => {
        inputRef.value?.focus()
        autoResize()
    })
}
</script>

<style scoped>
.chat-page {
    padding: 16px;
    height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background:
        radial-gradient(circle at 8% 10%, rgba(30, 64, 175, 0.08), transparent 38%),
        radial-gradient(circle at 92% 84%, rgba(16, 185, 129, 0.06), transparent 44%),
        var(--bg-app);
}

.ambient-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.ambient-orb {
    position: absolute;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    filter: blur(6px);
    opacity: 0.55;
    animation: orbFloat 9s ease-in-out infinite alternate;
}

.orb-left {
    left: -120px;
    top: 14%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.02) 70%);
}

.orb-right {
    right: -130px;
    bottom: 10%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.18), rgba(16, 185, 129, 0.02) 70%);
    animation-delay: 1.2s;
}

.ambient-line {
    position: absolute;
    width: 2px;
    height: 160px;
    border-radius: 999px;
    opacity: 0.25;
    animation: lineDrift 6s ease-in-out infinite;
}

.line-left {
    left: 20px;
    top: 28%;
    background: linear-gradient(180deg, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.7), rgba(59, 130, 246, 0));
}

.line-right {
    right: 24px;
    top: 54%;
    background: linear-gradient(180deg, rgba(16, 185, 129, 0), rgba(16, 185, 129, 0.72), rgba(16, 185, 129, 0));
    animation-delay: 1.4s;
}

.chat-container {
    max-width: 980px;
    margin: 0 auto;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
    border: 1px solid var(--border-light);
    border-radius: 18px;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
    overflow: hidden;
    z-index: 1;
}

/* Header */
.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-light);
    background: linear-gradient(90deg, rgba(232, 237, 255, 0.7), rgba(240, 253, 250, 0.52));
    backdrop-filter: blur(6px);
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #dbe8ff, #e7f7f1);
    color: #1d4ed8;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid #c7d2fe;
}

.header-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.header-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-extrabold);
    color: var(--text-primary);
    letter-spacing: -0.015em;
}

.header-desc {
    font-size: var(--text-xs);
    color: #64748b;
}

.header-status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: var(--text-xs);
    color: #475569;
}

.status-dot {
    width: 6px;
    height: 6px;
    background: var(--success);
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
}

.header-right {
    display: flex;
    align-items: center;
}

.clear-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 11px;
    border: 1px solid var(--border-light);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.75);
    color: #64748b;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: var(--transition-fast);
    font-family: var(--font-sans);
}

.retry-btn {
    margin-right: 8px;
    padding: 7px 11px;
    border: 1px solid var(--primary-subtle);
    border-radius: 10px;
    background: linear-gradient(180deg, #eef4ff, #e8edff);
    color: var(--primary);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: var(--transition-fast);
    font-family: var(--font-sans);
}

.retry-btn:hover {
    border-color: var(--primary);
    background: #dfe9ff;
}

.clear-btn:hover:not(:disabled) {
    border-color: var(--danger);
    color: var(--danger);
    background: var(--danger-bg);
}

.clear-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* Suggestions */
.suggestions-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-light);
    background: rgba(248, 250, 252, 0.86);
    flex-shrink: 0;
    flex-wrap: wrap;
}

.suggestions-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
}

.suggestions-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.suggestion-chip {
    padding: 6px 13px;
    border: 1px solid var(--border-light);
    border-radius: 999px;
    background: #fff;
    color: #475569;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: var(--transition-fast);
    font-family: var(--font-sans);
    white-space: nowrap;
}

.suggestion-chip:hover {
    border-color: var(--primary-subtle);
    color: var(--primary);
    background: #edf2ff;
    transform: translateY(-1px);
}

/* Messages */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 18px 20px 12px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
    width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
    background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
    background: var(--border-light);
    border-radius: 100px;
}

/* Empty state */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 9px;
    color: var(--text-tertiary);
    padding: 40px 0;
}

.empty-icon {
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #eef2ff, #e6f8f1);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
    color: #2563eb;
    border: 1px solid #dbeafe;
}

.empty-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-secondary);
    margin: 0;
}

.empty-sub {
    font-size: var(--text-md);
    color: var(--text-tertiary);
    margin: 0;
}

.empty-tags {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
}

.empty-tags span {
    font-size: var(--text-xs);
    color: #64748b;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 4px 10px;
}

/* Message rows */
.message-row {
    display: flex;
    gap: 8px;
    animation: msgIn 0.2s ease-out;
}

@keyframes msgIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}

@keyframes orbFloat {
    0% { transform: translateY(0) scale(1); }
    100% { transform: translateY(-18px) scale(1.05); }
}

@keyframes lineDrift {
    0%, 100% { transform: translateY(0); opacity: 0.2; }
    50% { transform: translateY(-14px); opacity: 0.42; }
}

.user-row {
    flex-direction: column;
    align-items: flex-end;
}

.assistant-row {
    flex-direction: row;
    align-items: flex-start;
}

.assistant-avatar {
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, #dbe8ff, #e7f7f1);
    color: #1d4ed8;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
    border: 1px solid #c7d2fe;
}

.assistant-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 72%;
}

/* Bubbles */
.message-bubble {
    padding: 10px 14px 11px;
    border-radius: 12px;
    font-size: var(--text-md);
    line-height: var(--leading-relaxed);
    word-break: break-word;
}

.user-bubble {
    background: linear-gradient(145deg, #1e40af, #1d4ed8);
    color: #fff;
    border-bottom-right-radius: 4px;
    max-width: 72%;
    box-shadow: 0 8px 16px rgba(30, 64, 175, 0.24);
}

.assistant-bubble {
    background: #f8fafc;
    color: var(--text-primary);
    border-bottom-left-radius: 4px;
    border: 1px solid var(--border-light);
}

.message-meta {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 0 2px;
}

.user-meta {
    text-align: right;
}

/* Typing */
.typing-bubble {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 11px 15px;
}

.dot {
    width: 7px;
    height: 7px;
    background: var(--text-tertiary);
    border-radius: 50%;
    animation: bounce 1.3s infinite ease-in-out;
}

.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-5px); opacity: 1; }
}

/* Input area */
.chat-input-area {
    padding: 12px 20px 14px;
    border-top: 1px solid var(--border-light);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.96));
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(248, 250, 252, 0.95);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 6px 8px 6px 14px;
    transition: var(--transition-fast);
}

.input-wrapper.focused {
    border-color: var(--primary);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.08);
}

.input-wrapper.disabled {
    opacity: 0.6;
}

.input-wrapper textarea {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: var(--text-md);
    color: var(--text-primary);
    line-height: var(--leading-normal);
    resize: none;
    min-height: 24px;
    max-height: 120px;
    overflow-y: auto;
    padding: 6px 0;
    box-sizing: border-box;
}

.input-wrapper textarea::placeholder {
    color: var(--text-tertiary);
}

.send-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: var(--bg-muted);
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: not-allowed;
    transition: var(--transition-fast);
    flex-shrink: 0;
}

.send-btn.active {
    background: linear-gradient(145deg, #1e40af, #1d4ed8);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 8px 14px rgba(30, 64, 175, 0.22);
}

.send-btn.active:hover {
    background: var(--primary-hover);
}

.spin {
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

.input-hint {
    font-size: var(--text-xs);
    color: #64748b;
    text-align: right;
    min-height: 16px;
}

/* Responsive */
@media (max-width: 768px) {
    .chat-page {
        padding: 12px;
        height: calc(100vh - 120px);
    }

    .chat-header {
        padding: 13px 14px;
    }

    .ambient-orb {
        width: 180px;
        height: 180px;
        opacity: 0.45;
    }

    .ambient-line {
        display: none;
    }

    .suggestions-bar {
        padding: 8px 14px;
    }

    .chat-messages {
        padding: 14px;
    }

    .user-bubble,
    .assistant-content {
        max-width: 88%;
    }

    .chat-input-area {
        padding: 10px 14px 12px;
    }

    .input-hint {
        display: none;
    }
}
</style>
