<template>
    <div class="page">
        <div class="chart-grid">
            <EChartsBar 
                title="保费规模 TOP10 (万元)"
                :data="rankingData.byPremium"
                mainType="premium"
            />
            <EChartsBar 
                title="增长速度 TOP10 (%)"
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
