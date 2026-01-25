# SUNDAY BLEED - Landing Page & Login Redesign
  ## ConversionDriven Premium SaaS Transformation

  > **Start Date:** 2026-01-25
  > **Status:** 🔵 PLANNING COMPLETE - READY FOR EXECUTION
  > **Language:** Romanian (UI) | English (Brand Name Only)

  ---

  ## 📊 PROGRESS TRACKER

  ```
  ┌─────────────────────────────────────────────────────────────┐
  │ LAST COMPLETED:  None (Starting fresh)                      │
  │ CURRENTLY WORKING ON:  Awaiting approval to start           │
  │ TOTAL TASKS:  47 tasks across 6 phases                      │
  │ COMPLETED:  0/47 (0%)                                        │
  └─────────────────────────────────────────────────────────────┘
  ```

  ---

  ## 🎯 PROJECT OVERVIEW

  ### What We're Building
  Complete redesign of SmartAnalytics → ConversionDriven with:
  - **New Landing Page:** Dark, premium SaaS aesthetic (inspired by Cometly structure, original design)
  - **Unified Login Page:** Single entry point for agency + client, auto-routing based on user_type
  - **Visual Consistency:** Matching design language across landing and login
  - **Romanian UI:** All text in Romanian except "ConversionDriven" brand name
  - **Modern Stack:** Tailwind CSS migration from inline styles

  ### Critical Files Affected
  **Frontend:**
  - `frontend/src/app/page.tsx` - Landing page (complete rewrite)
  - `frontend/src/app/login/page.tsx` - New unified login (create)
  - `frontend/src/app/agency/login/page.tsx` - Remove
  - `frontend/src/app/client/login/page.tsx` - Remove
  - `frontend/src/app/layout.tsx` - Tailwind integration
  - `frontend/tailwind.config.ts` - Create/update
  - `frontend/src/components/*` - New landing page components

  **Backend:**
  - No changes needed (already supports unified login via user_type)

  **Assets:**
  - `/public/images/1.png` - Primary dashboard screenshot (MUST be most prominent)
  - `/public/images/2.png` - Secondary screenshot
  - `/public/images/3.png` - Tertiary screenshot

  **Documentation:**
  - `MINDMAP.md` - Update to reflect new structure (final step)

  ---

  ## 🏗️ ARCHITECTURE DECISIONS

  ### Design System
  - **Framework:** Tailwind CSS v3+
  - **Color Palette:**
  - Background: Deep navy gradient (`#0a1628` → `#1a2332`)
  - Accent: Electric blue (`#00d4ff`) / Cyan
  - Text: White (`#ffffff`) with opacity variants
  - Secondary: Slate gray for muted text
  - **Typography:**
  - Font family: `Inter` or `Geist Sans` (system font stack fallback)
  - Headlines: Bold, 48-72px desktop, 32-48px mobile
  - Body: 16-18px, line-height 1.6
  - **Spacing:** Tailwind default scale (4px base unit)
  - **Animations:** Tailwind transitions + framer-motion for scroll effects (optional)

  ### Authentication Flow (Unified Login)
  ```
  User enters credentials at /login
  ↓
  POST /api/auth/login/ (backend)
  ↓
  Response: { access, refresh, user: { user_type: "agency" | "client" } }
  ↓
  Frontend checks user_type:
  - If "agency" → redirect to /agency/dashboard
  - If "client" → redirect to /dashboard
  ```

  ### Responsive Strategy
  - **Desktop-first approach** (primary users are desktop)
  - Breakpoints:
  - Mobile: `< 768px` (stack vertically, large touch targets)
  - Tablet: `768px - 1024px`
  - Desktop: `> 1024px`

  ---

  ## 📋 TASK BREAKDOWN

  ---

  ## **PHASE 1: Setup & Preparation**
  **Goal:** Install Tailwind CSS, verify assets, prepare development environment

  ### Tasks:
  - [ ] **Task 1.1:** Install Tailwind CSS dependencies
  - `npm install -D tailwindcss postcss autoprefixer`
  - `npx tailwindcss init -p`
  - **Files:** `package.json`, `tailwind.config.ts`, `postcss.config.js`

  - [ ] **Task 1.2:** Configure Tailwind config
  - Set content paths: `./src/**/*.{js,ts,jsx,tsx,mdx}`
  - Add custom colors (navy gradient, electric blue)
  - Add custom fonts (Inter/Geist)
  - **File:** `frontend/tailwind.config.ts`

  - [ ] **Task 1.3:** Update global styles to import Tailwind
  - Add `@tailwind base; @tailwind components; @tailwind utilities;`
  - Remove old global inline styles
  - **File:** `frontend/src/app/globals.css` (or create if missing)

  - [ ] **Task 1.4:** Update root layout to import globals.css
  - Ensure Tailwind styles are loaded
  - **File:** `frontend/src/app/layout.tsx`

  - [ ] **Task 1.5:** Verify screenshot assets exist
  - Check `/public/images/1.png` (primary - MUST exist)
  - Check `/public/images/2.png` (secondary)
  - Check `/public/images/3.png` (tertiary)
  - **Action:** If missing, notify user immediately

  - [ ] **Task 1.6:** Test Tailwind installation
  - Add test component with Tailwind classes
  - Verify styles render correctly in browser
  - **Verification:** Run `npm run dev`, check for Tailwind classes working

  ### ✅ Phase 1 Verification Checklist:
  - [ ] Tailwind CSS compiles without errors
  - [ ] Custom colors defined in config
  - [ ] All 3 screenshot files present in `/public/images/`
  - [ ] Test page with Tailwind classes renders correctly
  - [ ] No console errors related to CSS

  ---

  ## **PHASE 2: New Landing Page (/)**
  **Goal:** Build ConversionDriven landing page with dark premium SaaS design

  ### Section 2A: Hero Section (Above the Fold)
  - [ ] **Task 2.1:** Create Hero component structure
  - Full viewport height (`min-h-screen`)
  - Centered content (flex/grid)
  - Dark gradient background
  - Subtle noise texture or star dots (optional CSS background)
  - **File:** `frontend/src/components/landing/HeroSection.tsx`

  - [ ] **Task 2.2:** Add hero content elements
  - Small badge/pill: "AI-powered conversion tracking" (Romanian)
  - Main headline: "ConversionDriven" (large, bold, white)
  - Subheadline: "Înțelege exact de unde vin conversiile tale..." (Romanian, 1-2 lines)
  - Primary CTA button: "Începe acum" (electric blue, large)
  - Secondary CTA: "Vezi cum funcționează" (outline button, optional)
  - **Language:** Romanian except brand name

  - [ ] **Task 2.3:** Style hero with Tailwind
  - Responsive typography (`text-5xl md:text-7xl` for headline)
  - Button hover effects (scale, glow)
  - Spacing and padding
  - **Design:** Match ConversionDriven premium aesthetic

  ### Section 2B: Key Capabilities (Horizontal List)
  - [ ] **Task 2.4:** Create KeyCapabilities component
  - Grid layout: 4-6 items, 3 columns desktop, 1-2 columns mobile
  - Each item: icon (SVG or emoji) + title + optional subtitle
  - **File:** `frontend/src/components/landing/KeyCapabilities.tsx`

  - [ ] **Task 2.5:** Add capability items (Romanian text)
  - Examples: "Atribuirea conversiilor", "Tracking multi-canal", "Dashboard-uri client", "Tracking server-side",
  "Analiză în timp real", "Insights AI"
  - Keep text short and scannable
  - **Design:** Simple, clean cards with subtle borders/shadows

  ### Section 2C: Product Screenshots
  - [ ] **Task 2.6:** Create ProductPreview component
  - **Desktop layout:**
  - 1.png = primary (centered, largest, z-index higher)
  - 2.png = secondary (smaller, slightly faded or pushed back)
  - 3.png = tertiary (smallest, background)
  - Optional: overlapping/stacked effect
  - **Mobile layout:**
  - Vertical stack: 1.png → 2.png → 3.png (in order)
  - **File:** `frontend/src/components/landing/ProductPreview.tsx`

  - [ ] **Task 2.7:** Style screenshots
  - Rounded corners (`rounded-xl` or `rounded-2xl`)
  - Subtle shadow or glow (`shadow-2xl` or custom)
  - Hover effect on desktop (slight scale: `hover:scale-105`)
  - Ensure images are responsive (`max-w-full`, `h-auto`)
  - **Critical:** 1.png MUST be most visible

  ### Section 2D: How It Works
  - [ ] **Task 2.8:** Create HowItWorks component
  - 3-4 numbered steps
  - Vertical or horizontal layout (depends on content length)
  - **File:** `frontend/src/components/landing/HowItWorks.tsx`

  - [ ] **Task 2.9:** Add step content (Romanian)
  1. "Devino Client" - "Disponibil momentan pentru clienții agenției"
  2. "Creează-ți Contul" - "Primești acces prin agenția ta"
  3. "Conectează Platformele" - "Anunțuri, tracking, surse de conversii"
  4. "Vizualizează & Optimizează" - "Vezi exact ce generează venituri"
  - Add small note: "Acces public în curând" (optional)

  ### Section 2E: Trust/Positioning (Optional)
  - [ ] **Task 2.10:** Create TrustSection component (if needed)
  - Simple statement: "Construit pentru agenții care pun accent pe performanță reală"
  - OR metrics strip: "Atribuire precisă" | "Raportare clară" | "Decizii mai rapide"
  - **File:** `frontend/src/components/landing/TrustSection.tsx` (create if approved)
  - **Note:** Only if it doesn't clutter the page

  ### Section 2F: Final CTA Section
  - [ ] **Task 2.11:** Create FinalCTA component
  - Dark background (same as hero)
  - Short headline: "Pregătit să generezi conversii mai bune?" (Romanian)
  - Large CTA button: "Începe acum" (same as hero)
  - Small note: "Disponibil momentan pentru clienții agenției"
  - **File:** `frontend/src/components/landing/FinalCTA.tsx`

  ### Section 2G: Footer
  - [ ] **Task 2.12:** Create Footer component
  - Minimal, dark background
  - Content: App name "ConversionDriven" + Copyright "© 2026" + Links (Privacy, Terms - optional)
  - **File:** `frontend/src/components/landing/Footer.tsx`

  ### Section 2H: Assemble Landing Page
  - [ ] **Task 2.13:** Integrate all sections into page.tsx
  - Import all components
  - Stack vertically in correct order
  - Ensure smooth scrolling between sections
  - **File:** `frontend/src/app/page.tsx` (complete rewrite)

  - [ ] **Task 2.14:** Add smooth scroll animations (optional)
  - Fade-in on scroll for each section
  - Can use `framer-motion` or CSS `scroll-behavior: smooth`
  - **Libraries:** `npm install framer-motion` (if approved)

  ### ✅ Phase 2 Verification Checklist:
  - [ ] Landing page loads without errors
  - [ ] All sections render in correct order
  - [ ] Romanian text throughout (except "ConversionDriven")
  - [ ] 1.png is most prominent screenshot
  - [ ] Responsive on mobile (test at 375px width)
  - [ ] CTA buttons functional (link to /login)
  - [ ] Dark premium aesthetic matches specifications
  - [ ] No horizontal scroll on mobile
  - [ ] Typography hierarchy clear (headline → subhead → body)

  ---

  ## **PHASE 3: Unified Login Page (/login)**
  **Goal:** Create single login page that auto-routes based on user_type

  ### Section 3A: Create New Login Page
  - [ ] **Task 3.1:** Create new login page structure
  - **File:** `frontend/src/app/login/page.tsx` (create new)
  - Layout: Centered card on dark background (match landing page)
  - Card: White or dark card with form

  - [ ] **Task 3.2:** Add form elements (Romanian labels)
  - Header: "ConversionDriven" logo/text + "Autentificare" subtitle
  - Email input: Label "Email" (Romanian: "Email" is acceptable, or "Adresă de email")
  - Password input: Label "Parolă"
  - Submit button: "Conectează-te"
  - Loading state: "Se conectează..."
  - Error message display area

  - [ ] **Task 3.3:** Add informational notice
  - Yellow/blue info box: "Conturile trebuie create de către agenție pentru a avea acces. Nu se pot crea conturi
  noi."
  - Position: Below form or above submit button
  - **Design:** Match warning box style from old client login

  - [ ] **Task 3.4:** Add back to landing link
  - Link text: "Înapoi la pagina principală" or just "← Acasă"
  - Position: Bottom of card or below card
  - Links to: `/`

  ### Section 3B: Implement Login Logic
  - [ ] **Task 3.5:** Add form state management
  - useState for email, password, loading, error
  - handleChange to update form data and clear errors
  - **Pattern:** Same as existing login pages

  - [ ] **Task 3.6:** Implement handleSubmit with auto-routing
  ```typescript
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
  const response = await login(email, password);
  // response.user.user_type is "agency" or "client"

  if (response.user.user_type === 'agency') {
  router.push('/agency/dashboard');
  } else if (response.user.user_type === 'client') {
  router.push('/dashboard');
  } else {
  // Fallback
  router.push('/');
  }
  } catch (err) {
  setError('Email sau parolă incorectă');
  } finally {
  setLoading(false);
  }
  };
  ```
  - **File:** `frontend/src/app/login/page.tsx`

  - [ ] **Task 3.7:** Style login page with Tailwind
  - Match landing page visual style (dark background, same colors)
  - Card: rounded corners, shadow, padding
  - Inputs: consistent styling (border, focus states)
  - Button: same electric blue as landing CTA
  - Responsive: mobile-friendly form

  ### Section 3C: Backend Verification (No Changes Needed)
  - [ ] **Task 3.8:** Verify backend login endpoint
  - Confirm `/api/auth/login/` returns user_type in response
  - Test with agency user: check user_type === "agency"
  - Test with client user: check user_type === "client"
  - **File to review:** `backend/users/serializers.py` (line 96-112)
  - **Action:** Read-only verification, no changes expected

  ### ✅ Phase 3 Verification Checklist:
  - [ ] New /login page renders correctly
  - [ ] Form fields in Romanian
  - [ ] Info box displays notice about agency-created accounts
  - [ ] Login with agency account → redirects to /agency/dashboard
  - [ ] Login with client account → redirects to /dashboard
  - [ ] Error messages in Romanian
  - [ ] Visual consistency with landing page (colors, fonts, spacing)
  - [ ] Responsive on mobile
  - [ ] Back link to landing page works

  ---

  ## **PHASE 4: Navigation & Routing Updates**
  **Goal:** Update all links and remove old login pages

  ### Section 4A: Update Landing Page Links
  - [ ] **Task 4.1:** Update hero CTA to link to /login
  - Primary button "Începe acum" → `/login`
  - Secondary button (if exists) → scroll to #how-it-works or /login
  - **File:** `frontend/src/components/landing/HeroSection.tsx`

  - [ ] **Task 4.2:** Update final CTA to link to /login
  - CTA button → `/login`
  - **File:** `frontend/src/components/landing/FinalCTA.tsx`

  ### Section 4B: Remove Old Login Pages
  - [ ] **Task 4.3:** Delete agency login page
  - **File to delete:** `frontend/src/app/agency/login/page.tsx`
  - **Action:** Delete entire file

  - [ ] **Task 4.4:** Delete client login page
  - **File to delete:** `frontend/src/app/client/login/page.tsx`
  - **Action:** Delete entire file

  - [ ] **Task 4.5:** Check for other references to old login routes
  - Search codebase for `/agency/login` and `/client/login`
  - Update any hardcoded links or redirects
  - **Files to check:** Navbar, AuthContext logout redirect, etc.
  - **Tool:** Use grep/search: `grep -r "/agency/login" frontend/src/`

  ### Section 4C: Update Navbar/Header (If Exists)
  - [ ] **Task 4.6:** Review Navbar component
  - Check if Navbar.tsx exists and is used on landing
  - Update any login links to point to `/login`
  - **File:** `frontend/src/components/Navbar.tsx` (if exists)
  - **Note:** May not be on landing page (check Phase 1 exploration results)

  ### Section 4D: Update AuthContext Logout Redirect
  - [ ] **Task 4.7:** Verify logout redirect
  - Ensure logout() redirects to `/` (landing page), not old login pages
  - **File:** `frontend/src/contexts/AuthContext.tsx`
  - **Current state:** Already redirects to `/` (confirmed in exploration)
  - **Action:** Verify only, no changes needed

  ### ✅ Phase 4 Verification Checklist:
  - [ ] Old login pages deleted (/agency/login, /client/login)
  - [ ] Landing page CTAs link to /login
  - [ ] No broken links in codebase
  - [ ] Logout redirects to landing page (/)
  - [ ] No 404 errors when navigating app
  - [ ] Search codebase confirms no references to old login routes

  ---

  ## **PHASE 5: Testing & Verification**
  **Goal:** Comprehensive testing in development and production

  ### Section 5A: Development Environment Testing
  - [ ] **Task 5.1:** Test landing page functionality
  - Visit `http://localhost:3000/`
  - Verify all sections render
  - Check responsive behavior (resize browser to mobile width)
  - Test scroll behavior
  - Click all CTA buttons → should go to /login
  - **Browser:** Test in Chrome, Firefox, Safari (if available)

  - [ ] **Task 5.2:** Test unified login page
  - Visit `http://localhost:3000/login`
  - Test with agency credentials → should redirect to /agency/dashboard
  - Test with client credentials → should redirect to /dashboard
  - Test with invalid credentials → should show error in Romanian
  - Test loading states (slow network simulation)
  - **Tool:** Chrome DevTools Network throttling

  - [ ] **Task 5.3:** Test old login routes (404 expected)
  - Visit `http://localhost:3000/agency/login` → should 404 or redirect
  - Visit `http://localhost:3000/client/login` → should 404 or redirect
  - **Expected:** 404 Not Found page (Next.js default)

  - [ ] **Task 5.4:** Test responsive design
  - Use Chrome DevTools Device Toolbar
  - Test viewports: iPhone SE (375px), iPad (768px), Desktop (1440px)
  - Check for:
  - No horizontal scroll
  - Readable text sizes
  - Touch-friendly button sizes (min 44px height)
  - Proper image scaling
  - **Files to check:** Landing sections, login form

  - [ ] **Task 5.5:** Test accessibility basics
  - Tab through landing page (keyboard navigation)
  - Tab through login form (should focus inputs and button)
  - Check contrast ratios (white text on dark navy)
  - Use Lighthouse audit in Chrome DevTools
  - **Target:** Accessibility score > 90

  - [ ] **Task 5.6:** Test performance
  - Run Lighthouse performance audit
  - Check for:
  - Fast First Contentful Paint (< 2s)
  - No layout shifts (CLS < 0.1)
  - Optimized images (screenshots should be compressed)
  - **Action:** If images too large, compress with tinypng.com or similar

  ### Section 5B: Production Testing (After Deployment)
  - [ ] **Task 5.7:** Deploy to Vercel staging/production
  - Commit all changes to Git
  - Push to GitHub
  - Vercel auto-deploys
  - **Branch:** Deploy to preview branch first if possible

  - [ ] **Task 5.8:** Test production landing page
  - Visit production URL (e.g., https://smartanalytics.vercel.app/)
  - Verify all sections load
  - Check images load from /public/images/
  - Test CTAs link to production /login
  - **Tool:** Test on real mobile device (not just DevTools)

  - [ ] **Task 5.9:** Test production login flow
  - Visit production /login
  - Test agency login → redirects to /agency/dashboard with real data
  - Test client login → redirects to /dashboard with real data
  - Verify backend API connection (check Network tab)
  - **Credentials:** Use test agency and test client accounts

  - [ ] **Task 5.10:** Monitor for errors
  - Check Vercel deployment logs for errors
  - Check browser console for JavaScript errors
  - Check backend logs (Render) for 401/500 errors
  - **Action:** If errors found, document and create fix tasks

  ### Section 5C: Bug Tracking & Fixes
  - [ ] **Task 5.11:** Create bug tracking section
  - Document any issues found during testing
  - Prioritize: Critical (blocking) > High > Medium > Low
  - **Format:**
  ```
  BUG-001: [Critical] Login redirects to wrong dashboard
  - Steps to reproduce: ...
  - Expected: ...
  - Actual: ...
  - Fix: ...
  ```

  - [ ] **Task 5.12:** Fix all critical bugs
  - Address blocking issues before marking phase complete
  - Re-test after each fix
  - **Status:** Update bug status to FIXED when resolved

  ### ✅ Phase 5 Verification Checklist:
  - [ ] Landing page works in dev and production
  - [ ] Unified login works for agency and client
  - [ ] Old login routes return 404
  - [ ] Responsive on mobile (real device tested)
  - [ ] No console errors
  - [ ] No backend API errors
  - [ ] Lighthouse scores acceptable (Performance > 70, Accessibility > 90)
  - [ ] All critical bugs fixed
  - [ ] Real user test passed (agency + client login)

  ---

  ## **PHASE 6: Documentation Update**
  **Goal:** Update MINDMAP.md to reflect new architecture

  ### Section 6A: Update MINDMAP.md
  - [ ] **Task 6.1:** Update Repository Structure section
  - Change `frontend/src/app/page.tsx` description to "Landing page (ConversionDriven)"
  - Add `frontend/src/app/login/page.tsx` - "Unified login page (agency + client)"
  - Remove references to `frontend/src/app/agency/login/` (deleted)
  - Remove references to `frontend/src/app/client/login/` (deleted)
  - Add new components under `frontend/src/components/landing/`
  - **File:** `MINDMAP.md` (lines ~60-76)

  - [ ] **Task 6.2:** Update Authentication Flow section
  - Update "Agency Login Flow" to "Unified Login Flow"
  - Change frontend file reference from `/agency/login/page.tsx` to `/login/page.tsx`
  - Update flow diagram to show single login page with conditional redirect
  - **File:** `MINDMAP.md` (lines ~136-162)

  - [ ] **Task 6.3:** Update Client Login Flow section
  - Merge into unified login flow section
  - Remove separate client login flow
  - Clarify that user_type determines redirect path
  - **File:** `MINDMAP.md` (lines ~170-195)

  - [ ] **Task 6.4:** Update Technologies Overview
  - Add row for Tailwind CSS: `| Tailwind CSS | 3.x | Utility-first styling |`
  - Update styling approach description
  - **File:** `MINDMAP.md` (lines ~8-22)

  - [ ] **Task 6.5:** Update Page Structure in Landing Page section
  - Replace old landing page description with ConversionDriven structure
  - List sections: Hero → Capabilities → Screenshots → How It Works → CTA → Footer
  - Note Romanian language requirement
  - **File:** `MINDMAP.md` (add new section or update existing)

  - [ ] **Task 6.6:** Update Changelog
  - Add entry at top:
  ```markdown
  ### January 25, 2026 - ConversionDriven Landing & Login Redesign
  - **New Landing Page:** Complete redesign with dark premium SaaS aesthetic
  - **Romanian UI:** All interface text in Romanian (except brand name)
  - **Unified Login:** Single login page at /login with auto-routing by user_type
  - **Tailwind CSS Migration:** Replaced inline styles with Tailwind utility classes
  - **Removed Pages:** Deleted separate /agency/login and /client/login pages
  - **Product Screenshots:** Integrated 1.png, 2.png, 3.png into landing page
  ```
  - **File:** `MINDMAP.md` (lines ~1170+)

  ### Section 6B: Create Implementation Notes (Optional)
  - [ ] **Task 6.7:** Add design system documentation
  - Document color palette used
  - Document typography scale
  - Document component structure
  - **File:** Create `docs/DESIGN_SYSTEM.md` (optional, for future reference)

  ### ✅ Phase 6 Verification Checklist:
  - [ ] MINDMAP.md updated with new structure
  - [ ] Old page references removed
  - [ ] Unified login flow documented
  - [ ] Tailwind CSS added to tech stack
  - [ ] Changelog entry added with date
  - [ ] Documentation accurate and matches implementation

  ---

  ## 🐛 BUG TRACKING SECTION

  ### Critical Bugs (Blocking Release)
  _None currently - will be populated during testing_

  ### High Priority Bugs
  _None currently_

  ### Medium Priority Bugs
  _None currently_

  ### Low Priority / Enhancement Requests
  _None currently_

  **Template for New Bugs:**
  ```markdown
  ### BUG-XXX: [Priority] Short Description
  - **Found in:** Phase X, Task Y
  - **Steps to Reproduce:**
  1. ...
  2. ...
  - **Expected Behavior:** ...
  - **Actual Behavior:** ...
  - **Screenshot/Error:** (if applicable)
  - **Proposed Fix:** ...
  - **Status:** OPEN | IN PROGRESS | FIXED | WONTFIX
  ```

  ---

  ## 📝 NOTES & DECISIONS LOG

  ### Design Decisions
  1. **Why Tailwind CSS?**
  - Replaces inline styles for better maintainability
  - Faster development with utility classes
  - Easier to implement responsive design
  - Consistent design system

  2. **Why Unified Login Instead of Separate Pages?**
  - Backend already supports it via user_type
  - Simpler user experience (one URL to remember)
  - Reduces code duplication
  - Easier to maintain

  3. **Why Romanian UI?**
  - Target audience is Romanian-speaking agency clients
  - Professional localization
  - "ConversionDriven" remains English as brand name

  4. **Why Dark Theme?**
  - Premium SaaS aesthetic
  - Stands out from generic landing pages
  - Better for analytics/data-focused products
  - Inspiration: Cometly, Plausible, Mixpanel

  ### Technical Decisions
  1. **Image Priority (1.png > 2.png > 3.png)**
  - User specified 1.png is best screenshot
  - Desktop: 1.png largest and centered
  - Mobile: 1.png appears first in vertical stack

  2. **No Backend Changes**
  - Login endpoint already generic
  - user_type already returned in response
  - Only frontend routing logic changes

  3. **Component Structure**
  - Modular components per landing section
  - Easier to test and maintain
  - Can reuse in future pages if needed

  ### Open Questions
  _To be resolved during implementation:_
  - [ ] Should we add framer-motion for scroll animations or keep it simple?
  - [ ] Do we need a Trust/Positioning section or skip for simplicity?
  - [ ] Should footer have Privacy/Terms links or just copyright?
  - [ ] Do we need a separate 404 page for old login routes or let Next.js handle it?

  ---

  ## 🚀 DEPLOYMENT CHECKLIST

  ### Pre-Deployment
  - [ ] All tests passing in dev
  - [ ] No console errors
  - [ ] No TypeScript errors
  - [ ] Images optimized (< 500KB each)
  - [ ] Environment variables set in Vercel
  - [ ] Git commit with clear message

  ### Deployment Steps
  - [ ] Commit changes: `git add . && git commit -m "feat: ConversionDriven landing + unified login"`
  - [ ] Push to GitHub: `git push origin main`
  - [ ] Verify Vercel auto-deployment triggered
  - [ ] Check Vercel deployment logs for errors
  - [ ] Visit production URL and test

  ### Post-Deployment
  - [ ] Test production landing page
  - [ ] Test production login (agency + client)
  - [ ] Monitor for errors (first 30 minutes)
  - [ ] Update MINDMAP.md
  - [ ] Mark SUNDAY_BLEED.md as COMPLETE

  ---

  ## ✅ FINAL VERIFICATION (Before Marking Complete)

  ### Functional Requirements Met
  - [ ] Landing page is dark premium SaaS design
  - [ ] All UI text in Romanian (except "ConversionDriven")
  - [ ] 1.png is most prominent screenshot
  - [ ] Single login page at /login
  - [ ] Agency users redirect to /agency/dashboard
  - [ ] Client users redirect to /dashboard
  - [ ] Old login pages deleted
  - [ ] Responsive on mobile and desktop
  - [ ] No broken links

  ### Technical Requirements Met
  - [ ] Tailwind CSS integrated
  - [ ] No inline styles remaining (or minimal)
  - [ ] Clean component structure
  - [ ] TypeScript types correct
  - [ ] No console errors or warnings
  - [ ] Images load correctly
  - [ ] Backend API connection working

  ### Documentation Updated
  - [ ] MINDMAP.md reflects new structure
  - [ ] Changelog entry added
  - [ ] Design decisions documented

  ### Performance & Quality
  - [ ] Lighthouse performance > 70
  - [ ] Lighthouse accessibility > 90
  - [ ] Images optimized
  - [ ] Fast page load (< 3s on 3G)

  ---

  ## 📊 SUCCESS METRICS

  After 1 week of deployment, measure:
  - [ ] Landing page bounce rate (target: < 60%)
  - [ ] Login success rate (target: > 95%)
  - [ ] Mobile usability (test on real devices)
  - [ ] User feedback on new design (collect via support channel)

  ---

  ## 🎉 PROJECT COMPLETION

  **When all phases are complete:**
  1. Update progress tracker to 47/47 (100%)
  2. Update status to: `🟢 COMPLETE`
  3. Copy this plan to `SUNDAY_BLEED.md` in project root
  4. Celebrate! 🎊

  ---

  **Document Version:** 1.0
  **Last Updated:** 2026-01-25
  **Prepared By:** Claude (Senior Guide)
  **Approved By:** _Awaiting user approval_

  ---

  ## APPENDIX A: File Checklist

  ### Files to Create
  - [ ] `frontend/tailwind.config.ts`
  - [ ] `frontend/postcss.config.js`
  - [ ] `frontend/src/app/globals.css` (or update existing)
  - [ ] `frontend/src/app/login/page.tsx`
  - [ ] `frontend/src/components/landing/HeroSection.tsx`
  - [ ] `frontend/src/components/landing/KeyCapabilities.tsx`
  - [ ] `frontend/src/components/landing/ProductPreview.tsx`
  - [ ] `frontend/src/components/landing/HowItWorks.tsx`
  - [ ] `frontend/src/components/landing/TrustSection.tsx` (optional)
  - [ ] `frontend/src/components/landing/FinalCTA.tsx`
  - [ ] `frontend/src/components/landing/Footer.tsx`

  ### Files to Modify
  - [ ] `frontend/src/app/page.tsx` (complete rewrite)
  - [ ] `frontend/src/app/layout.tsx` (import globals.css)
  - [ ] `frontend/package.json` (add Tailwind deps)
  - [ ] `MINDMAP.md` (documentation update)

  ### Files to Delete
  - [ ] `frontend/src/app/agency/login/page.tsx`
  - [ ] `frontend/src/app/client/login/page.tsx`

  ### Files to Review (No Changes Expected)
  - [ ] `backend/users/views.py` (verify LoginView)
  - [ ] `backend/users/serializers.py` (verify user_type in response)
  - [ ] `frontend/src/contexts/AuthContext.tsx` (verify login function)
  - [ ] `frontend/src/lib/api.ts` (verify login endpoint)

  ---

  **END OF PLAN**