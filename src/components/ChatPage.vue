<template>
    <div class="chat-page">
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
                        <span class="header-status">
                            <span class="status-dot"></span>
                            在线
                        </span>
                    </div>
                </div>
                <div class="header-right">
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
                <div class="input-hint">Enter 发送 · Shift+Enter 换行</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const inputFocused = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)

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

    try {
        const response = await fetch('http://localhost:3001/api/chat', {
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
</script>

<style scoped>
.chat-page {
    padding: 20px;
    height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    background: var(--bg-app);
}

.chat-container {
    max-width: 860px;
    margin: 0 auto;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
}

/* Header */
.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-light);
    background: var(--bg-card);
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-avatar {
    width: 36px;
    height: 36px;
    background: var(--primary-light);
    color: var(--primary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.header-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
}

.header-status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-tertiary);
}

.status-dot {
    width: 6px;
    height: 6px;
    background: var(--success);
    border-radius: 50%;
}

.clear-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-fast);
    font-family: var(--font-sans);
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
    gap: 10px;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border-light);
    background: var(--bg-subtle);
    flex-shrink: 0;
    flex-wrap: wrap;
}

.suggestions-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
}

.suggestions-list {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.suggestion-chip {
    padding: 4px 12px;
    border: 1px solid var(--border-light);
    border-radius: 100px;
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-fast);
    font-family: var(--font-sans);
    white-space: nowrap;
}

.suggestion-chip:hover {
    border-color: var(--primary-subtle);
    color: var(--primary);
    background: var(--primary-light);
}

/* Messages */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    gap: 8px;
    color: var(--text-tertiary);
    padding: 40px 0;
}

.empty-icon {
    width: 64px;
    height: 64px;
    background: var(--bg-muted);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
    color: var(--text-tertiary);
}

.empty-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
}

.empty-sub {
    font-size: 13px;
    color: var(--text-tertiary);
    margin: 0;
}

/* Message rows */
.message-row {
    display: flex;
    gap: 10px;
    animation: msgIn 0.2s ease-out;
}

@keyframes msgIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
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
    width: 28px;
    height: 28px;
    background: var(--primary-light);
    color: var(--primary);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
}

.assistant-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 72%;
}

/* Bubbles */
.message-bubble {
    padding: 10px 14px;
    border-radius: var(--radius-md);
    font-size: 14px;
    line-height: 1.65;
    word-break: break-word;
}

.user-bubble {
    background: var(--primary);
    color: #fff;
    border-bottom-right-radius: 4px;
    max-width: 72%;
}

.assistant-bubble {
    background: var(--bg-muted);
    color: var(--text-primary);
    border-bottom-left-radius: 4px;
    border: 1px solid var(--border-light);
}

.message-meta {
    font-size: 11px;
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
    padding: 12px 16px;
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
    padding: 14px 20px 16px;
    border-top: 1px solid var(--border-light);
    background: var(--bg-card);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: var(--bg-subtle);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 8px 8px 8px 14px;
    transition: var(--transition-fast);
}

.input-wrapper.focused {
    border-color: var(--primary);
    background: var(--bg-card);
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
    font-size: 14px;
    color: var(--text-primary);
    line-height: 1.6;
    resize: none;
    min-height: 22px;
    max-height: 120px;
    overflow-y: auto;
}

.input-wrapper textarea::placeholder {
    color: var(--text-tertiary);
}

.send-btn {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-sm);
    border: none;
    background: var(--bg-muted);
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: not-allowed;
    transition: var(--transition-fast);
    flex-shrink: 0;
}

.send-btn.active {
    background: var(--primary);
    color: #fff;
    cursor: pointer;
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
    font-size: 11px;
    color: var(--text-tertiary);
    text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
    .chat-page {
        padding: 12px;
        height: calc(100vh - 120px);
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
