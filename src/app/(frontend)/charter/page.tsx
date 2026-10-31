import type { Metadata } from 'next'

import React from 'react'

import { CharterContent, type CharterText } from '@/components/Charter/CharterContent.client'

export const revalidate = 3600

/**
 * NABI Basic Charter of Operation (기본 운영 헌장).
 * The Korean text is authoritative and mirrors the charter in the NABI Notion workspace
 * (Administration page). Amendments require consensus of the members (Principle 4); record
 * each amendment here so the page history doubles as the charter's history.
 */
const CHARTER: CharterText = {
  title: { ko: '기본 운영 헌장', en: 'Basic Charter of Operation' },
  preamble: {
    ko: 'NABI (Natural and Artificial Brain Intelligence)는 의과대학을 기반으로 하며 학문적 개방성과 독립성을 유지하며, 임상의학 내 computational neuroscience와 NeuroAI 학풍 형성에 기여하고자 하는 학술 공동체이다. 이를 위해 NABI는 산하에 각 의과대학 및 병원을 기반으로 한 지역 조직을 두며, 각 조직은 자율성을 유지하는 동시에 아래의 원칙에 따라서 운영을 하도록 한다.',
    en: 'NABI (Natural and Artificial Brain Intelligence) is an academic community rooted in medical education. It upholds academic openness and independence, and endeavors to contribute to the establishment of a school of thought in computational neuroscience and NeuroAI within clinical medicine. To this end, NABI shall comprise local chapters based at medical schools and hospitals. Each chapter shall retain its autonomy while operating in accordance with the following principles.',
  },
  principles: [
    {
      ordinal: { ko: '제 1원칙', en: 'Principle 1' },
      title: { ko: '형평성', en: 'Equity' },
      text: {
        ko: '조직의 각 회원은 학년, 직위, 소속에 따른 위계가 아닌 학문적 기여와 공동체적 책임을 우선하도록 한다.',
        en: 'Every member of a chapter shall place academic contribution and responsibility to the community above any hierarchy of year, rank, or affiliation.',
      },
    },
    {
      ordinal: { ko: '제 2원칙', en: 'Principle 2' },
      title: { ko: '독립성', en: 'Independence' },
      text: {
        ko: '조직은 특정 행사나 프로젝트에 종속되지 않으며, 어떠한 연구실, 지도 교수, 기업 또는 개인에도 귀속되지 않는 독립적 학술 공동체로서 운영하도록 한다.',
        en: 'Each chapter shall operate as a self-governing academic community, independent in its governance and scholarly activities. It shall not be subordinate to any event or project, nor subject to control by any external organization, corporation, or individual.',
      },
    },
    {
      ordinal: { ko: '제 3원칙', en: 'Principle 3' },
      title: { ko: '다학제성', en: 'Interdisciplinarity' },
      text: {
        ko: '조직은 computational neuroscience와 NeuroAI 연구와 학습에 있어 다양한 학문적 관점과 방법론의 공존을 존중하며, 특정 이론, 기술 또는 연구 접근이 공동체를 독점하지 않도록 한다.',
        en: 'A chapter shall respect the coexistence of diverse academic perspectives and methodologies in the research and study of computational neuroscience and NeuroAI, and shall not permit any single theory, technique, or research approach to dominate the community.',
      },
    },
    {
      ordinal: { ko: '제 4원칙', en: 'Principle 4' },
      title: { ko: '지속성', en: 'Continuity' },
      text: {
        ko: '조직은 세대 교체와 환경 변화 속에서도 공동체의 목적과 원칙이 영속될 수 있도록 운영 경험과 규범을 기록, 전승하며, 본 원칙은 구성원의 합의를 통해서 개정될 수 있도록 한다.',
        en: 'A chapter shall document and hand down its operating experience and norms, so that the purpose and principles of the community endure across generations and changing circumstances. These principles may be amended by consensus of the members.',
      },
    },
  ],
  closing: {
    ko: '본 원칙을 확인함으로써 각 조직의 운영위원은 NABI의 학문적 정체성과 공동체적 가치를 보존하는 수탁자로서 행동하고 이에 대한 책임을 지며, 모든 운영 결정은 본 헌장의 원칙에 부합하도록 이루어진다.',
    en: 'In affirming these principles, the executive members of each chapter act as stewards of NABI’s academic identity and communal values, and are accountable for them. All operating decisions shall conform to the principles of this charter.',
  },
  note: {
    ko: '이 헌장은 NABI 운영위원회가 관리하며, 한국어 원문을 기준으로 합니다.',
    en: 'This charter is maintained by the NABI executive committee. The Korean text is authoritative; the English translation is provided for reference.',
  },
}

export default function CharterPage() {
  return (
    <main className="page-shell">
      <CharterContent charter={CHARTER} />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Basic Charter of Operation',
  description:
    'The NABI Basic Charter of Operation (기본 운영 헌장): equity, independence, interdisciplinarity, and continuity.',
}
