<template>
    <div class="auth-container">
        <n-card class="auth-card" :bordered="false" size="huge" role="dialog" aria-modal="true">
            <template #header>
                <div class="auth-header">
                    <n-icon size="48" color="#1E40AF">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M176 176V136a40 40 0 0 1 40-40h80a40 40 0 0 1 40 40v40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                            <path d="M112 176h288v272a32 32 0 0 1-32 32H144a32 32 0 0 1-32-32z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                        </svg>
                    </n-icon>
                    <h2>欢迎登录</h2>
                    <p class="subtitle">请登录以访问保险数据看板</p>
                </div>
            </template>
            
            <n-form
                ref="formRef"
                :model="formValue"
                :rules="rules"
                size="large"
            >
                <n-form-item path="username" label="用户名">
                    <n-input v-model:value="formValue.username" placeholder="请输入用户名" @keydown.enter="handleSubmit">
                        <template #prefix>
                            <n-icon :component="PersonOutline" />
                        </template>
                    </n-input>
                </n-form-item>
                <n-form-item path="password" label="密码">
                    <n-input
                        v-model:value="formValue.password"
                        type="password"
                        show-password-on="click"
                        placeholder="请输入密码"
                        @keydown.enter="handleSubmit"
                    >
                        <template #prefix>
                            <n-icon :component="LockClosedOutline" />
                        </template>
                    </n-input>
                </n-form-item>
                
                <n-button type="primary" block size="large" :loading="loading" @click="handleSubmit">
                    登录
                </n-button>
            </n-form>
        </n-card>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { NCard, NForm, NFormItem, NInput, NButton, NIcon, useMessage } from 'naive-ui'
import { PersonOutline, LockClosedOutline } from '@vicons/ionicons5'
import { state, login } from '../stores/dataStore'

const message = useMessage()
const formRef = ref(null)
const loading = ref(false)

const formValue = reactive({
    username: '',
    password: ''
})

const rules = {
    username: [
        {
            required: true,
            message: '请输入用户名',
            trigger: 'blur'
        },
        {
            pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{4,20}$/,
            message: '4-20位英文、数字或符号',
            trigger: 'blur'
        }
    ],
    password: [
        {
            required: true,
            message: '请输入密码',
            trigger: 'blur'
        },
        {
            pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{4,20}$/,
            message: '4-20位英文、数字或符号',
            trigger: 'blur'
        }
    ]
}

async function handleSubmit(e) {
    e?.preventDefault()
    formRef.value?.validate(async (errors) => {
        if (!errors) {
            loading.value = true
            try {
                await login(formValue.username, formValue.password)
                message.success('登录成功')
            } catch (error) {
                message.error(error.message || '登录失败')
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<style scoped>
.auth-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.auth-card {
    width: 100%;
    max-width: 400px;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.auth-header {
    text-align: center;
    margin-bottom: 24px;
}

.auth-header h2 {
    margin: 16px 0 8px;
    font-size: 24px;
    color: #111827;
}

.subtitle {
    margin: 0;
    color: #6B7280;
    font-size: 14px;
}

.auth-footer {
    display: flex;
    justify-content: center;
    gap: 8px;
    color: #6B7280;
    font-size: 14px;
}

/* 移除输入框聚焦时的默认蓝色阴影 */
:deep(.n-input) {
    --n-box-shadow-focus: none !important;
    --n-border-hover: 1px solid #d1d5db !important;
    --n-border-focus: 1px solid #6b7280 !important;
}

:deep(.n-input .n-input__state-border) {
    box-shadow: none !important;
}

/* 修复浏览器自动填充时的浅蓝色背景 */
:deep(input:-webkit-autofill),
:deep(input:-webkit-autofill:hover),
:deep(input:-webkit-autofill:focus),
:deep(input:-webkit-autofill:active) {
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    box-shadow: 0 0 0 1000px white inset !important;
    -webkit-text-fill-color: #333 !important;
    transition: background-color 5000s ease-in-out 0s;
}

:deep(.n-input:hover .n-input__state-border) {
    border-color: #d1d5db !important;
}

:deep(.n-input--focus .n-input__state-border) {
    border-color: #6b7280 !important; /* 聚焦时改为深灰色边框 */
    box-shadow: none !important;
}

/* 优化表单错误提示样式 */
:deep(.n-form-item-feedback__line) {
    font-size: 12px;
    line-height: 1.4;
    padding-top: 4px;
    color: var(--danger, #d03050); /* 稍微柔和一点的红色 */
}

:deep(.n-form-item-label) {
    font-size: 14px;
    font-weight: 500;
}
</style>
