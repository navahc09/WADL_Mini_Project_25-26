# Design System Specification: The Architectural Curator

## 1. Overview & Creative North Star: "The Architectural Curator"
This design system moves away from the utilitarian "dashboard" aesthetic to embrace an **Architectural Editorial** approach. We are not just building a placement portal; we are designing a career-defining gallery. 

The Creative North Star is **The Architectural Curator**. This means every screen should feel like a curated exhibit—spacious, authoritative, and structured. We achieve this by breaking the rigid 12-column grid with intentional asymmetry, using high-contrast typography scales (Manrope for impact, Inter for utility), and replacing crude borders with sophisticated tonal layering. We treat white space not as "empty" space, but as a structural element that guides the user’s eye toward their professional future.

---

## 2. Colors: Tonal Depth & The "No-Line" Philosophy
The palette utilizes Material Design 3 logic to create a system of "Nested Surfaces." 

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. Traditional "boxes" make a platform feel like a spreadsheet. Instead, define boundaries through:
*   **Background Shifts:** Place a `surface-container-low` card on a `surface` background.
*   **Negative Space:** Use the spacing scale to create "invisible" gutters that separate information.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of frosted glass and fine paper.
*   **Base:** `surface` (#f7f9fb)
*   **Level 1 (Sub-sections):** `surface-container-low` (#f2f4f6)
*   **Level 2 (Interactive Cards):** `surface-container-lowest` (#ffffff)
*   **Level 3 (Floating Elements):** `surface-bright` with Glassmorphism.

### The "Glass & Gradient" Rule
To elevate the "Deep Blue" (`primary: #004ac6`) from a standard corporate color to a premium signature, use **Atmospheric Gradients**. 
*   **Hero Areas:** Transition from `primary` (#004ac6) to `primary_container` (#2563eb) at a 135-degree angle.
*   **Glassmorphism:** For floating navigation or modal overlays, use `surface_container_lowest` at 80% opacity with a `24px` backdrop-blur.

---

## 3. Typography: Editorial Authority
We use a dual-font strategy to balance character with readability.

*   **Display & Headlines (Manrope):** Use `display-lg` to `headline-sm` for high-impact moments—like "Placed" announcements or "Welcome" headers. Manrope’s geometric rhythm feels modern and curated.
*   **UI & Body (Inter):** Use `title-lg` down to `label-sm` for all functional data. Inter’s high x-height ensures readability in dense placement tables.
*   **The Contrast Rule:** Always pair a large `display-md` headline with a `body-md` description. The extreme size delta creates an "Editorial" look that feels premium.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to create "pop"; we use them to simulate **Ambient Light**.

*   **The Layering Principle:** Depth is achieved by "stacking." A placement card (`surface-container-lowest`) sits on a track background (`surface-container-low`). This provides a soft, natural lift without the "dirty" look of heavy shadows.
*   **Ambient Shadows:** If an element must float (e.g., a "Apply Now" FAB), use:
    *   `blur: 32px`, `offset-y: 8px`, `color: rgba(0, 74, 198, 0.06)`. Note the blue tint—never use pure black for shadows.
*   **The "Ghost Border" Fallback:** If a container absolutely requires a border (e.g., high-density data inputs), use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Precision & Soul

### Buttons
*   **Primary:** Uses the "Signature Gradient" (Primary to Primary Container). Radius: `md` (0.75rem).
*   **Secondary:** `surface-container-high` background with `on-surface` text. No border.
*   **Tertiary:** Ghost style. `on-primary-fixed-variant` text with no background until hover.

### Cards & Lists (Placement Feeds)
*   **Forbid Dividers:** Do not use horizontal lines between list items. Use 16px of vertical padding and a subtle background hover state (`surface-container-high`) to define rows.
*   **Asymmetric Cards:** For "Featured Jobs," use an asymmetric layout where the company logo overlaps the card’s top-left boundary to break the "boxed-in" feel.

### Input Fields
*   **Style:** Minimalist. Background: `surface-container-low`. 
*   **Active State:** Transition background to `surface-container-lowest` and add a `2px` "Ghost Border" of the `primary` color.

### Progress Indicators (The Placement Tracker)
*   Use a "Soft Glow" effect. Instead of a flat green bar for success, use `tertiary` (#943700) with a subtle outer glow of the same color at 20% opacity to indicate "active" status.

---

## 6. Do's and Don'ts

### Do:
*   **DO** use extreme whitespace (e.g., 80px-120px) between major landing page sections.
*   **DO** use "Deep Blue" sparingly as an accent or a primary action, letting the neutrals do the heavy lifting.
*   **DO** utilize the `full` (9999px) roundedness for status chips (e.g., "Placed") to create a friendly contrast against `md` (0.75rem) cards.

### Don't:
*   **DON'T** use 1px #EEEEEE borders. They are the enemy of premium design.
*   **DON'T** use pure black (#000000) for text. Use `on-surface` (#191c1e) for better optical comfort.
*   **DON'T** clutter the user’s cognitive load. If a piece of data isn't vital for the current "Placement Phase," hide it in a "Details" disclosure.