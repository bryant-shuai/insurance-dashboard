<template>
    <div class="page overview-page">
        <div class="chart-grid overview-chart-grid">
            <EChartsBar 
                title="保费规模 TOP10 (万元)"
                icon="💰"
                :data="rankingData.byPremium"
                mainType="premium"
            />
            <EChartsBar 
                title="增长速度 TOP10 (%)"
                icon="📈"
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
.overview-page {
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    padding-bottom: 16px;
    scrollbar-gutter: stable;
}

.overview-chart-grid {
    flex: 1 1 auto;
    min-height: 0;
    align-items: stretch;
}

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
