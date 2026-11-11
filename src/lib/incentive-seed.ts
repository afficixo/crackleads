import type { IncentiveWidgetOffer } from '@/lib/incentive-tools'

/** No hardcoded incentive catalog — locker/offerwall use manager-added offers only. */
export const seedIncentiveOffersForWidget: Array<IncentiveWidgetOffer & { placement: 'INCENTIVE'; status: 'ACTIVE'; isHot?: boolean }> = []
