# Phase 3C: Remaining Risks & Technical Debt

## 1. Identified Risks & Trade-Offs

### 1.1 Server Flight Payload Dependent on Network Quality

- **Description:** Although intent prefetching on `pointerdown` captures the ~60–120ms mechanical touch delay, users on high-latency mobile networks (3G/slow 4G) will still experience network-bound delay when downloading Next.js RSC flight payloads for complex pages like `/vi/plan`.
- **Mitigation:**
  - Route-level `loading.tsx` skeletons render immediately within ~64ms, ensuring the screen never blanks or freezes.
  - Future improvement: Service Worker caching or React Cache warming for frequently accessed static metadata.

### 1.2 Multi-Locale Translation Width Variations

- **Description:** In languages with longer noun phrases (e.g. German or specialized dialects), bottom navigation tab labels could experience truncation (`truncate` with ellipsis).
- **Current State:** Vietnamese ("Trang chủ", "Tiền", "Ghi chép", "Kế hoạch", "Hộp thư") and English ("Home", "Money", "Capture", "Plan", "Inbox") both fit within 69px columns without noticeable text clipping.
- **Monitoring:** Any future navigation label additions must be validated on 360px viewports to ensure they do not become excessively truncated.

### 1.3 Rapid Tapping Race Conditions in Next.js Router

- **Description:** Extremely rapid switching across tabs within 50ms could in theory trigger concurrent transitions in React 19.
- **Audit Findings:** Tested with Playwright rapid switching (`Home -> Money -> Plan`). The Next.js router cancelled intermediate flight requests and cleanly committed only the final destination (`/vi/plan`) with zero UI ghosting or split states.
