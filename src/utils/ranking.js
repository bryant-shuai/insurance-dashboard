export const DEFAULT_RANKING_TARGET_COMPANY = '阳光财险'
export const DEFAULT_RANKING_INSURANCE = '非车险'
export const DEFAULT_RANKING_FLOW_HEAD_COUNT = 8

export function normalizeRankingText(value) {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, '')
}

export function getCompanyShortName(fullName) {
    const normalized = normalizeRankingText(fullName)
    if (!normalized) return ''
    const parts = normalized.split('-')
    return normalizeRankingText(parts[parts.length - 1])
}

function companyMatchesTarget(candidate, target) {
    const normalizedCandidate = normalizeRankingText(candidate)
    const normalizedTarget = normalizeRankingText(target)

    if (!normalizedCandidate || !normalizedTarget) return false
    if (normalizedCandidate === normalizedTarget) return true

    const shortName = getCompanyShortName(normalizedCandidate)
    return shortName === normalizedTarget || shortName.includes(normalizedTarget) || normalizedCandidate.includes(normalizedTarget)
}

function clampFlowHeadCount(value) {
    return Math.min(DEFAULT_RANKING_FLOW_HEAD_COUNT, Math.max(Number(value) || DEFAULT_RANKING_FLOW_HEAD_COUNT, 1))
}

function sortDatasetsByCreatedAt(datasets = []) {
    return [...(Array.isArray(datasets) ? datasets : [])]
        .filter(Boolean)
        .sort((left, right) => {
            const leftTime = new Date(left.createdAt || 0).getTime()
            const rightTime = new Date(right.createdAt || 0).getTime()

            if (leftTime !== rightTime) {
                return leftTime - rightTime
            }

            return String(left.id || '').localeCompare(String(right.id || ''))
        })
}

export function formatMonthLabel(dateLike) {
    const date = new Date(dateLike)
    if (Number.isNaN(date.getTime())) return ''
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

export function normalizeReportPeriodInput(value) {
    const normalized = normalizeRankingText(value)
    if (!normalized) return ''

    const match = normalized.match(/^((?:19|20)\d{2})[年.\-_/]?(\d{1,2})月?$/)
    if (!match) return ''

    const month = Number(match[2])
    if (!Number.isInteger(month) || month < 1 || month > 12) return ''

    return `${match[1]}年${month}月`
}

export function formatReportPeriodMonthValue(reportPeriod) {
    const normalized = normalizeReportPeriodInput(reportPeriod)
    if (!normalized) return ''

    const match = normalized.match(/^((?:19|20)\d{2})年(\d{1,2})月$/)
    if (!match) return ''

    return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}`
}

export function ensureCumulativeLabel(label) {
    const normalized = normalizeRankingText(label)
    if (!normalized) return ''
    return normalized.endsWith('累计') ? normalized : `${normalized}累计`
}

export function inferReportPeriod(dataset = {}) {
    if (dataset.reportPeriod) {
        return normalizeRankingText(dataset.reportPeriod).replace(/累计$/, '')
    }

    const candidates = [
        dataset.name,
        dataset.fileName,
        dataset.originalName,
        dataset.title
    ].filter(Boolean)

    const fallbackYear = dataset.createdAt
        ? new Date(dataset.createdAt).getFullYear()
        : new Date().getFullYear()

    for (const candidate of candidates) {
        const normalized = normalizeRankingText(candidate)

        const fullMatch = normalized.match(/((?:19|20)\d{2})[年.\-_/]?(\d{1,2})月?/)
        if (fullMatch) {
            return `${fullMatch[1]}年${Number(fullMatch[2])}月`
        }

        const compactMatch = normalized.match(/((?:19|20)\d{2})[.\-_/](\d{1,2})/)
        if (compactMatch) {
            return `${compactMatch[1]}年${Number(compactMatch[2])}月`
        }

        const monthOnlyMatch = normalized.match(/(^|[^0-9])(\d{1,2})月/)
        if (monthOnlyMatch) {
            return `${fallbackYear}年${Number(monthOnlyMatch[2])}月`
        }
    }

    return dataset.createdAt ? formatMonthLabel(dataset.createdAt) : ''
}

function buildCandidateEntries(companies = {}, insurance = DEFAULT_RANKING_INSURANCE) {
    return Object.entries(companies || {}).map(([fullName, data]) => {
        const premium = Number(data?.[insurance]?.premium ?? 0)
        const growth = Number(data?.[insurance]?.growth ?? 0)

        return {
            fullName,
            companyName: getCompanyShortName(fullName),
            premium: Number.isFinite(premium) ? premium : 0,
            growth: Number.isFinite(growth) ? growth : 0
        }
    })
}

function buildRankingEntries(dataset = {}, insurance = DEFAULT_RANKING_INSURANCE) {
    const entries = buildCandidateEntries(dataset.companies, insurance)
        .filter(entry => entry.premium > 0)
        .sort((a, b) => b.premium - a.premium)

    const totalPremium = entries.reduce((sum, entry) => sum + entry.premium, 0)

    return entries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        share: totalPremium > 0 ? Number(((entry.premium / totalPremium) * 100).toFixed(2)) : 0
    }))
}

function findTargetRankingEntry(entries = [], targetCompany = DEFAULT_RANKING_TARGET_COMPANY) {
    return entries.find(entry =>
        companyMatchesTarget(entry.fullName, targetCompany) ||
        companyMatchesTarget(entry.companyName, targetCompany)
    ) || null
}

function pickHeadCompanies(entries = [], targetCompany = DEFAULT_RANKING_TARGET_COMPANY, headCount = DEFAULT_RANKING_FLOW_HEAD_COUNT) {
    const heads = []

    for (const entry of entries) {
        if (companyMatchesTarget(entry.fullName, targetCompany) || companyMatchesTarget(entry.companyName, targetCompany)) {
            continue
        }

        const duplicate = heads.some(head =>
            companyMatchesTarget(head.fullName, entry.fullName) ||
            companyMatchesTarget(head.companyName, entry.companyName)
        )
        if (duplicate) continue

        heads.push(entry)
        if (heads.length >= headCount) break
    }

    return heads
}

function buildFlowPeriodsFromDatasets(datasets = [], insurance = DEFAULT_RANKING_INSURANCE) {
    return sortDatasetsByCreatedAt(datasets).map(dataset => {
        const reportPeriod = dataset.reportPeriod || inferReportPeriod(dataset)
        const periodLabel = ensureCumulativeLabel(reportPeriod)
        const rankingIndex = getDatasetRankingIndex(dataset, { insurance, reportPeriod })

        return {
            datasetId: dataset.id || '',
            datasetName: dataset.name || '',
            reportPeriod,
            periodLabel,
            createdAt: dataset.createdAt || '',
            entries: rankingIndex.rankings.map(entry => ({
                fullName: entry.companyFullName,
                companyName: entry.companyName,
                premium: entry.premium,
                growth: entry.growth,
                rank: entry.rank,
                share: entry.share
            }))
        }
    })
}

function createEmptyRankingFlow(options = {}) {
    const insurance = options.insurance || DEFAULT_RANKING_INSURANCE
    const targetCompany = options.targetCompany || ''
    const headCount = clampFlowHeadCount(options.headCount)

    return {
        periods: [],
        seriesCompanies: [],
        currentRank: null,
        previousRank: null,
        rankDelta: null,
        maxRank: headCount + 1,
        currentPeriodLabel: '',
        insurance,
        targetCompany,
        headCompanies: []
    }
}

function normalizeFlowCompany(entry) {
    if (!entry) return null

    if (typeof entry === 'string') {
        const normalized = normalizeRankingText(entry)
        if (!normalized) return null

        return {
            fullName: normalized,
            companyName: getCompanyShortName(normalized) || normalized
        }
    }

    const fullName = entry.fullName || entry.companyName || ''
    const companyName = entry.companyName || getCompanyShortName(fullName) || normalizeRankingText(fullName)

    if (!fullName && !companyName) return null

    return {
        ...entry,
        fullName,
        companyName
    }
}

function hasMatchingCompany(entries = [], candidate = null) {
    if (!candidate) return false

    return entries.some(entry =>
        companyMatchesTarget(entry.fullName, candidate.fullName) ||
        companyMatchesTarget(entry.companyName, candidate.companyName) ||
        companyMatchesTarget(candidate.fullName, entry.fullName) ||
        companyMatchesTarget(candidate.companyName, entry.companyName)
    )
}

function buildFlowPoint(entry, period, fallbackCompany) {
    return {
        value: entry.rank,
        companyName: fallbackCompany.companyName || entry.companyName,
        fullName: fallbackCompany.fullName || entry.fullName,
        periodLabel: period.periodLabel,
        premium: entry.premium,
        share: entry.share
    }
}

function buildFlowSeriesCompanies(periods = [], comparisonCompanies = [], targetCompany = '') {
    return comparisonCompanies.map((company, index) => {
        const normalizedCompany = normalizeFlowCompany(company) || {
            fullName: '',
            companyName: `公司${index + 1}`
        }
        const displayName = normalizedCompany.companyName || normalizedCompany.fullName || `公司${index + 1}`

        const data = periods.map(period => {
            const entry =
                findTargetRankingEntry(period.entries, normalizedCompany.fullName || displayName) ||
                findTargetRankingEntry(period.entries, displayName)

            return entry ? buildFlowPoint(entry, period, normalizedCompany) : null
        })

        const lastKnownIndex = data.reduce((lastIndex, point, pointIndex) => (point ? pointIndex : lastIndex), -1)

        return {
            fullName: normalizedCompany.fullName || '',
            companyName: displayName,
            isSelected:
                companyMatchesTarget(normalizedCompany.fullName, targetCompany) ||
                companyMatchesTarget(displayName, targetCompany),
            data,
            lastKnownIndex
        }
    })
}

function buildFlowResultFromPeriods(periods = [], options = {}) {
    const insurance = options.insurance || DEFAULT_RANKING_INSURANCE
    const targetCompany = options.targetCompany || ''
    const headCount = clampFlowHeadCount(options.headCount)

    if (!targetCompany || periods.length === 0) {
        return createEmptyRankingFlow({ insurance, targetCompany, headCount })
    }

    const latestPeriod = periods[periods.length - 1]
    const latestEntries = latestPeriod.entries || []
    const headCompaniesSource = Array.isArray(options.headCompaniesOverride) && options.headCompaniesOverride.length > 0
        ? options.headCompaniesOverride
        : pickHeadCompanies(latestEntries, targetCompany, headCount)
    const headCompanies = headCompaniesSource
        .map(normalizeFlowCompany)
        .filter(Boolean)
        .slice(0, headCount)
    const selectedEntry = findTargetRankingEntry(latestEntries, targetCompany) || {
        fullName: targetCompany,
        companyName: getCompanyShortName(targetCompany) || targetCompany,
        premium: 0,
        growth: 0,
        rank: null,
        share: 0
    }

    const comparisonCompanies = [...headCompanies]
    if (!hasMatchingCompany(comparisonCompanies, selectedEntry)) {
        comparisonCompanies.push(selectedEntry)
    }
    const seriesCompanies = buildFlowSeriesCompanies(
        periods,
        comparisonCompanies.length > headCount + 1
            ? comparisonCompanies.slice(0, headCount + 1)
            : comparisonCompanies,
        targetCompany
    )

    const currentPeriod = periods[periods.length - 1]
    const previousPeriod = periods[periods.length - 2] || null
    const currentEntry = findTargetRankingEntry(currentPeriod.entries, targetCompany) || null
    const previousEntry = previousPeriod ? findTargetRankingEntry(previousPeriod.entries, targetCompany) : null
    const currentRank = Number.isFinite(currentEntry?.rank) ? currentEntry.rank : null
    const previousRank = Number.isFinite(previousEntry?.rank) ? previousEntry.rank : null
    const rankDelta = Number.isFinite(currentRank) && Number.isFinite(previousRank)
        ? previousRank - currentRank
        : null

    const rankValues = seriesCompanies.flatMap(company => company.data
        .map(point => point?.value)
        .filter(value => Number.isFinite(value)))
    const maxRank = Math.max(headCount + 1, ...rankValues, currentRank || 0)

    return {
        periods,
        seriesCompanies,
        currentRank,
        previousRank,
        rankDelta,
        maxRank,
        currentPeriodLabel: currentPeriod.periodLabel || currentPeriod.reportPeriod || '',
        insurance,
        targetCompany,
        headCompanies
    }
}

export function buildCompanyRankingFlow(datasets = [], options = {}) {
    const insurance = options.insurance || DEFAULT_RANKING_INSURANCE
    const headCount = clampFlowHeadCount(options.headCount)
    const hasExplicitCompanyName = Object.prototype.hasOwnProperty.call(options, 'companyName')
    const targetCompany = hasExplicitCompanyName
        ? normalizeRankingText(options.companyName)
        : DEFAULT_RANKING_TARGET_COMPANY

    if (!targetCompany) {
        return createEmptyRankingFlow({ insurance, targetCompany: '', headCount })
    }

    return buildFlowResultFromPeriods(buildFlowPeriodsFromDatasets(datasets, insurance), {
        insurance,
        targetCompany,
        headCount
    })
}

export function computeInsuranceRankingIndex(dataset = {}, options = {}) {
    const insurance = options.insurance || DEFAULT_RANKING_INSURANCE
    const reportPeriod = options.reportPeriod || inferReportPeriod(dataset)
    const periodLabel = ensureCumulativeLabel(reportPeriod)
    const rankings = buildRankingEntries(dataset, insurance)

    return {
        insurance,
        reportPeriod,
        periodLabel,
        companyCount: rankings.length,
        totalPremium: Number(rankings.reduce((sum, entry) => sum + entry.premium, 0).toFixed(2)),
        generatedAt: dataset.createdAt || options.generatedAt || new Date().toISOString(),
        rankings: rankings.map(entry => ({
            companyFullName: entry.fullName,
            companyName: entry.companyName,
            rank: entry.rank,
            share: entry.share,
            premium: entry.premium,
            growth: entry.growth
        }))
    }
}

export function getDatasetRankingIndex(dataset = {}, options = {}) {
    const insurance = options.insurance || DEFAULT_RANKING_INSURANCE
    const reportPeriod = options.reportPeriod || dataset.reportPeriod || inferReportPeriod(dataset)
    const storedIndex = dataset.rankingIndex?.[insurance]
    const indexMatches =
        storedIndex &&
        normalizeRankingText(storedIndex.insurance) === normalizeRankingText(insurance) &&
        normalizeRankingText(storedIndex.reportPeriod) === normalizeRankingText(reportPeriod)

    if (indexMatches) {
        return {
            ...storedIndex,
            insurance,
            reportPeriod,
            periodLabel: storedIndex.periodLabel || ensureCumulativeLabel(reportPeriod),
            rankings: Array.isArray(storedIndex.rankings) ? storedIndex.rankings : []
        }
    }

    return computeInsuranceRankingIndex(dataset, {
        insurance,
        reportPeriod
    })
}

export function computeCompanyRankingSnapshot(dataset = {}, options = {}) {
    const insurance = options.insurance || DEFAULT_RANKING_INSURANCE
    const targetCompany = options.companyName || DEFAULT_RANKING_TARGET_COMPANY
    const reportPeriod = options.reportPeriod || inferReportPeriod(dataset)
    const periodLabel = ensureCumulativeLabel(reportPeriod)
    const rankingIndex = getDatasetRankingIndex(dataset, { insurance, reportPeriod })
    const entries = buildCandidateEntries(dataset.companies, insurance)
    const rankedEntries = rankingIndex.rankings || []
    const rankedIndex = rankedEntries.findIndex(entry =>
        companyMatchesTarget(entry.companyFullName, targetCompany) || companyMatchesTarget(entry.companyName, targetCompany)
    )
    const rankedEntry = rankedIndex >= 0 ? rankedEntries[rankedIndex] : null
    const fallbackEntry = rankedEntry || entries.find(entry => companyMatchesTarget(entry.fullName, targetCompany) || companyMatchesTarget(entry.companyName, targetCompany)) || null
    const hasRank = Boolean(rankedEntry)

    return {
        companyName: targetCompany,
        companyFullName: fallbackEntry?.companyFullName || fallbackEntry?.fullName || '',
        insurance,
        reportPeriod,
        periodLabel,
        rank: hasRank ? rankedIndex + 1 : null,
        share: hasRank ? Number(rankedEntry.share || 0) : 0,
        premium: Number.isFinite(fallbackEntry?.premium) ? fallbackEntry.premium : 0,
        totalPremium: Number(rankingIndex.totalPremium || 0),
        companyCount: rankingIndex.companyCount || rankedEntries.length,
        isRanked: hasRank,
        generatedAt: dataset.createdAt || options.generatedAt || new Date().toISOString()
    }
}

export function buildCompanyRankingHistory(datasets = [], options = {}) {
    const companyName = options.companyName || DEFAULT_RANKING_TARGET_COMPANY
    const insurance = options.insurance || DEFAULT_RANKING_INSURANCE
    const currentDataSetId = options.currentDataSetId || null

    return sortDatasetsByCreatedAt(datasets)
        .map(dataset => {
            const storedSnapshot = dataset.rankingSnapshot
            const snapshotMatches =
                storedSnapshot &&
                companyMatchesTarget(storedSnapshot.companyName, companyName) &&
                normalizeRankingText(storedSnapshot.insurance) === normalizeRankingText(insurance)

            const snapshot = snapshotMatches
                ? storedSnapshot
                : computeCompanyRankingSnapshot(dataset, { companyName, insurance })

            const reportPeriod = dataset.reportPeriod || snapshot.reportPeriod || inferReportPeriod(dataset)

            return {
                datasetId: dataset.id || '',
                datasetName: dataset.name || '',
                reportPeriod,
                periodLabel: snapshot.periodLabel || ensureCumulativeLabel(reportPeriod),
                createdAt: dataset.createdAt || snapshot.generatedAt || '',
                isCurrent: currentDataSetId ? dataset.id === currentDataSetId : false,
                ...snapshot
            }
        })
}
