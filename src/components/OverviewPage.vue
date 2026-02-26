<template>
    <div class="page">
        <div class="chart-grid">
            <EChartsBar 
                title="保费规模 TOP10 (万元)"
                iconSvg="<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><path d='M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8'/><path d='M12 18V6'/></svg>"
                :data="rankingData.byPremium"
                mainType="premium"
            />
            <EChartsBar 
                title="增长速度 TOP10 (%)"
                iconSvg="<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z'/><path d='m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z'/><path d='M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0'/><path d='M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5'/></svg>"
                :data="rankingData.byGrowth"
                mainType="growth"
            />
        </div>
    </div>
</template>

<script setup>
import EChartsBar from './EChartsBar.vue'
import { rankingData } from '../stores/dataStore'
</script>

<style scoped>
/* 移动端适配 */
@media (max-width: 768px) {
    .page {
        gap: 16px;
    }

    .chart-grid {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
    }
}
</style>
