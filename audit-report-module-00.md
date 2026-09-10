# CareerAI 2.0 - Complete Repository Audit Report

## 1. Current Architecture
CareerAI 2.0 is a **Client-Side** application built with **Next.js 14 (App Router)**. It appears to have recently undergone a migration from a React/Vite Single Page Application (SPA). 
- **Styling**: Tailwind CSS with a "Glassmorphism" design aesthetic.
- **Components**: `shadcn/ui` (Radix UI primitives).
- **State & Persistence**: Fully client-side leveraging `localStorage`. No backend or database is currently implemented.
- **Visualizations**: `recharts` for academic trends and skill radars.

## 2. Route Inventory
All routes reside within the Next.js `src/app` directory structure:
- `/` - Landing Page (Hero, Tool grid)
- `/predict` - 4-step wizard to input academic and skill data.
- `/result` - Detailed career readiness diagnostic report.
- `/(dashboard)/dashboard` - Main metrics, action items, SGPA chart, Skill Radar.
- `/(dashboard)/academic` - Semester-over-semester SGPA tracker and backlog health index.
- `/(dashboard)/calculators` - CGPA-to-Percentage, SGPA calculator, Attendance/Bunk tracker.
- `/(dashboard)/eligibility` - Company eligibility checker (MAANG, TCS, Startup presets).
- `/(dashboard)/preparation` - Checklist tracker for coding and interview prep.
- `/(dashboard)/projects` - Portfolio strength analyzer (checks for Github/Live links, difficulty).
- `/(dashboard)/resume` - Text-based structural and keyword analyzer.
- `/(dashboard)/settings` - Data management (Demo loader, JSON export, LocalStorage wipe).
- `/(dashboard)/skills` - Role-based skill gap matrix (Frontend, Backend, Analyst, Software Dev).
- `/(dashboard)/about` - Methodology disclaimer and tech stack breakdown.

## 3. Feature Inventory
- **Placement Readiness Estimate**: Deterministic scoring based on 6 key pillars.
- **7-Day & 30-Day Roadmaps**: Actionable plans generated based on identified weaknesses.
- **Academic Analytics**: Tracks SGPA trajectories and calculates risk impact of backlogs.
- **Skill Gap Analysis**: Interactive proficiency toggling against predefined industry role requirements.
- **Resume Readiness**: Client-side keyword and structural detection (Note: PDF parsing is missing).
- **Preparation Tracker**: LocalStorage-backed task manager with progress ring.
- **Import / Export**: JSON-based data portability for `localStorage`.

## 4. Component Inventory
- **Layouts**: `Navbar` (Responsive top-nav), `Sidebar` (Desktop side-nav for dashboard).
- **Active UI Primitives (`shadcn/ui`)**: `button`, `card`, `checkbox`, `input`, `label`, `progress`, `select`, `slider`, `tabs`, `toast`, `toaster`.
- **Orphaned / Unrouted UI Components**: `accordion.tsx`, `dialog.tsx`, `radio-group.tsx`.

## 5. Data Model
Defined in `src/types/index.ts`, there are two distinct schemas:
1. **Phase 1 (Legacy / Current)**: Client-state definitions like `AppState`, `UserProfile`, `SemesterData`, `CareerEngineResult`.
2. **Phase 2 (Future / DB Ready)**: Relational entity definitions like `User`, `Profile`, `Education`, `Job`, `Application`, `ReadinessSnapshot`.

## 6. LocalStorage Structures
All data persists directly under the key `"careerai_data"`.
**Direct LocalStorage Usage**: Is strictly isolated to `src/lib/storage.ts` and `src/services/LocalStorageDataService.ts`. The rest of the app imports `dataService` to read/write, demonstrating good abstraction.

## 7. Scoring Architecture
The `CareerIntelligenceEngine.ts` is a purely deterministic calculator:
- **Weights**: Academic (25%), Technical (25%), Project (15%), Aptitude (15%), Resume (10%), Interview (10%).
- **Rules**: Heavy static penalties for backlogs (e.g., >3 backlogs subtracts 20 points).
- **Generation**: Statically generates Strengths, Priority Improvements, and Roadmaps based on hardcoded thresholds (e.g., `< 75` triggers a specific warning).

## 8. Dependency Analysis
**Active & Critical**: `next`, `react`, `react-hook-form`, `zod`, `recharts`, `lucide-react`, `tailwindcss`.
**Unused / Bloat (Can be safely removed)**:
- `pdfjs-dist`: Declared for resume parsing, but actual code uses a plain textarea.
- `jspdf` & `html2canvas`: No PDF report generation is currently implemented.
- `framer-motion`: Not utilized in any active source files.
- Multiple `@radix-ui/*` packages corresponding to orphaned UI components.

## 9. Technical Debt (Critical Issues)
- **Next.js App Router Violations**: Almost all pages (e.g., `export function Dashboard()`) use named exports. Next.js 14 **strictly requires default exports** for `page.tsx`. This codebase will fail production builds.
- **React Router Remnants**: Widespread use of `<Link to="/path">` instead of Next.js's `<Link href="/path">`.
- **Undefined References**: `src/app/result/page.tsx` relies on `[navigate]` in its `useEffect` dependency array, which does not exist (causes runtime crash).
- **Root Clutter**: Migration scripts (`migrate.js`, `app-restructure.js`, `group-routes.js`, etc.) were left in the project root.

## 10. Migration Risks
The application is in an "in-between" state. It was moved to the Next.js `app/` directory physically, but the component code still expects a Vite/React-Router environment. Any attempt to build or run this in a strict Next environment will throw hydration and routing errors.

## 11. Security Risks
- **Client-Side Spoofing**: Because all logic and scoring happen client-side, a user can easily manipulate `localStorage` to give themselves a 100% readiness score.
- **No Real Validation**: Input boundaries (e.g., max CGPA) are only validated on the client.

## 12. Performance Risks
- **Bundle Size**: `pdfjs-dist`, `html2canvas`, and `jspdf` are heavy dependencies. If left in the bundle while unused, they negatively impact initial load times.
- **Client-Side Calculations**: While currently lightweight, running complex text analysis (resume keyword matching) on the main UI thread could cause jank on lower-end devices.

## 13. Recommended Target Architecture
1. **Stabilize Phase 1 (Immediate)**: Fix Next.js routing issues (default exports, `href` attributes, hook dependencies) and remove unused heavy libraries.
2. **Phase 2 (Backend Integration)**: 
   - Migrate from `LocalStorageDataService` to a real DB via Server Actions/API Routes.
   - Utilize PostgreSQL (via Prisma or Drizzle ORM).
   - Implement NextAuth.js for user sessions.
3. **Phase 3 (AI Integration)**: Move Resume Analysis and Career Intelligence logic to the server, leveraging actual LLM APIs (e.g., Gemini) for contextual, dynamic feedback instead of hardcoded rules.
