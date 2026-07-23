# Balaji Heart Center — OPD Operations Design System

**Document:** `DESIGN.md`  
**Version:** 1.0.0  
**Primary use:** OPD Pharmacy desktop module  
**Reusable for:** Front Office, Doctor, Admin, Billing, Queue, Lab and other hospital operations modules

---

## 1. Product Design Direction

The interface should feel:

- Modern, calm and clinical
- Minimal but operationally complete
- Fast to scan during long staff shifts
- Consistent across all hospital modules
- Dense enough for desktop workflows without feeling crowded
- Safe, accessible and predictable

Avoid:

- Marketing-style hero sections
- Glassmorphism
- Heavy gradients
- Large decorative illustrations
- Oversized rounded cards
- Too many colours
- Multiple competing primary actions
- Unnecessary dashboards and analytics
- Different shells or component styles between modules

---

## 2. Core UX Principles

### 2.1 One Shared Application Shell

Every staff-facing module must reuse the same:

- Sidebar
- Header
- Page grid
- Tabs
- Filters
- Tables
- Drawers
- Modals
- Buttons
- Status badges
- Loading, error and empty states
- Sticky action bar

Only the following may change:

- Active navigation item
- Page title and subtitle
- Main page content
- Contextual actions
- Module-specific status values

### 2.2 Workflow First

Each screen should answer:

1. What needs attention now?
2. What is the current status?
3. What is the next valid action?
4. What could block completion?
5. Where can the user verify the source information?

### 2.3 One Dominant Action

Each workflow state should expose one clear primary action.

Examples:

- New prescription → **Review**
- Reviewing → **Start preparation**
- Preparing → **Mark ready**
- Ready → **Confirm handover**
- Completed → **View record**

Secondary actions should never compete visually with the primary action.

### 2.4 Backend Status Is Authoritative

The UI may calculate previews and derived labels, but it must not invent or permanently update workflow status without backend confirmation.

---

## 3. Design Tokens

### 3.1 Colour Palette

```css
:root {
  --color-primary: #0B6875;
  --color-primary-dark: #084F59;
  --color-primary-light: #DFF3F5;

  --color-page: #F4F7F7;
  --color-card: #FFFFFF;

  --color-text-primary: #16343C;
  --color-text-secondary: #708188;
  --color-text-disabled: #9AA8AC;

  --color-border: #DCE6E7;
  --color-border-strong: #C7D5D7;

  --color-success: #23866A;
  --color-success-bg: #E8F5F0;

  --color-warning: #D99121;
  --color-warning-bg: #FFF5E4;

  --color-error: #C94B4B;
  --color-error-bg: #FCECEC;

  --color-info: #3976A8;
  --color-info-bg: #EAF2F8;

  --color-disabled: #BAC6C9;
}
```

### 3.2 Status Colour Usage

Use status colour only for:

- Small badge background
- Icon
- Left border accent
- Small dot
- Inline alert

Do not fill large cards or table rows with saturated status colours.

### 3.3 Typography

Primary font:

```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Type scale:

| Token | Size | Weight | Use |
|---|---:|---:|---|
| Display | 28–32px | 650–700 | Rare operational metric |
| Page title | 22–24px | 650 | Main screen title |
| Section title | 17–18px | 600 | Card and section headings |
| Body | 14–15px | 400–500 | Main content |
| Label | 13–14px | 500–600 | Form and metadata labels |
| Caption | 12–13px | 400–500 | Secondary metadata |
| Table text | 13–14px | 400–600 | Dense desktop tables |

Rules:

- Keep line height between 1.4 and 1.55 for body content
- Do not use text below 12px
- Use sentence case, not title case everywhere
- Use medium weight instead of excessive bold text

### 3.4 Spacing

Use an 8px base system.

```text
4px  — micro spacing
8px  — icon/text gap
12px — compact control spacing
16px — card and field spacing
24px — section spacing
32px — large layout separation
```

Page defaults:

- Desktop page padding: 24px
- Main section gap: 24px
- Card gap: 16px
- Table cell horizontal padding: 12–16px
- Table row height: 64–72px

### 3.5 Radius

```text
6px   — badges and compact controls
8px   — inputs and dropdowns
10px  — buttons
12px  — standard cards
14px  — large panels and drawers
```

Avoid pill-shaped cards and excessive 20px+ radii in staff modules.

### 3.6 Shadows

Use borders first. Shadows should remain subtle.

```css
--shadow-card: 0 1px 2px rgba(15, 44, 50, 0.04);
--shadow-drawer: -8px 0 24px rgba(15, 44, 50, 0.10);
--shadow-modal: 0 16px 48px rgba(15, 44, 50, 0.16);
```

---

## 4. Global Desktop Application Shell

### 4.1 Desktop Canvas

Primary reference:

```text
1440 × 1024px
```

Supported:

- 1280px laptop
- 1366px desktop
- 1600px large desktop
- Minimum operational width: 1100px

### 4.2 Sidebar

Expanded width:

```text
224px
```

Collapsed width:

```text
72px
```

Properties:

- Fixed left
- Full viewport height
- White background
- 1px right border
- Independent from main page scrolling

Structure:

1. Hospital logo and name
2. Module label
3. Main navigation
4. Flexible spacer
5. Pharmacy or department identity
6. Staff profile
7. Help, logout and collapse control

OPD Pharmacy navigation:

1. Dashboard
2. Preparation
3. Ready for Pickup
4. Stock
5. History

Active item:

- `#DFF3F5` background
- `#0B6875` icon and text
- Medium weight
- Clear selected indicator

### 4.3 Header

Height:

```text
72px
```

Properties:

- Sticky at top
- White background
- 1px bottom border
- Same dimensions across all modules

Layout:

**Left**

- Back button on internal pages
- Page title
- Short subtitle or breadcrumb

**Centre**

- Global search
- Suggested width: 380–440px

**Right**

- Live connection status
- Notifications
- Clinic date
- Staff profile menu

### 4.4 Main Content

```css
main {
  background: var(--color-page);
  padding: 24px;
}
```

Rules:

- Align every panel to the same grid
- Do not create random full-width sections
- Use controlled vertical scrolling
- Keep tables inside bounded white panels

### 4.5 Sticky Workflow Action Bar

Use on review, preparation and handover screens.

Structure:

**Left**

- Progress
- Unsaved state
- Warning count
- Last saved time

**Right**

- Return or cancel
- Save
- Primary workflow action

Rules:

- Same height and border across screens
- Do not overlap content
- Respect responsive width
- Explain why the primary action is disabled

---

## 5. Shared Component Specifications

### 5.1 Buttons

Variants:

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Text

Sizes:

- Small: 32px
- Medium: 40px
- Large: 44–48px

Every button must include:

- Default
- Hover
- Focus-visible
- Pressed
- Loading
- Disabled

Rules:

- Minimum 40px height on desktop
- Loading spinner must not change width
- Prevent double submission
- Use one primary button per action region

### 5.2 Inputs

Use:

- Label above input
- Optional helper text below
- Inline validation
- 40px minimum height
- 8–10px radius
- Teal focus ring
- Clear disabled state

Do not rely only on placeholders.

### 5.3 Status Badges

Standard structure:

```text
Icon or dot + status text
```

Use consistent status labels:

- New
- Reviewing
- Preparing
- Ready
- Completed
- Partial
- Unavailable
- Cancelled
- In stock
- Low stock
- Out of stock
- Expiring soon

Do not use colour alone.

### 5.4 Tabs

Shared tab height:

```text
44px
```

Rules:

- Keep directly below page or section header
- Same active style everywhere
- Use count badges consistently
- Support keyboard navigation
- Do not redesign tabs per module

Preferred style:

- Darker active text
- Teal underline
- Subtle hover background

### 5.5 Filters

Use one compact row.

Common controls:

- Date
- Doctor
- Status
- Assigned staff
- Availability

Rules:

- 40px control height
- Same radius and border
- Active filters become removable chips
- Include Clear filters
- Move secondary filters into a drawer on narrow desktop widths

### 5.6 Tables

Rules:

- Sticky header
- Semantic table markup
- 64–72px row height
- Strong but subtle row hover
- Visible keyboard focus
- Clear selected row
- Server-side filtering and pagination
- Horizontal scroll only within table container
- One main action per row

### 5.7 Drawers

Width:

```text
400–440px
```

Use for:

- Request preview
- Medicine review
- Preparation detail
- Stock detail
- Dispensing record

Rules:

- Right-side
- Fixed header and action area
- Independent body scrolling
- Focus management
- Escape closes when safe
- Prevent background interaction

### 5.8 Modals

Use for:

- Accept request
- Start preparation
- Mark ready
- Confirm handover
- Update stock
- Cancel request
- Session expired
- Logout

Rules:

- Clear title
- Short consequence summary
- One primary action
- One secondary action
- Focus trap
- No accidental destructive confirmation

### 5.9 Alerts

Types:

- Information
- Success
- Warning
- Error
- Offline

Use:

- Short title
- One-line explanation
- Optional action
- Small icon
- Soft background

Avoid full-width bright banners unless the workflow is blocked.

### 5.10 Loading, Empty and Error States

Every data-driven screen must support:

- Loading skeleton
- Empty state
- Search empty
- Filter empty
- API error
- Offline
- Reconnecting
- Permission denied
- Session expired
- Concurrent update
- Cancelled
- Read-only completed record

---

## 6. OPD Pharmacy Screen Set

### 6.1 Pharmacy Queue Dashboard

Purpose:

- View new prescriptions
- Continue review and preparation
- View ready requests
- Access completed records

Main sections:

- Page context
- Four summary cards
- Status tabs
- Compact filters
- Queue table
- Request preview drawer

Primary status actions:

| Status | Action |
|---|---|
| New | Review |
| Reviewing | Continue |
| Preparing | Prepare |
| Ready | Hand over |
| Completed | View |
| Partial / Unavailable | Resolve |

### 6.2 Prescription Review

Purpose:

- Verify patient and prescription
- Review medicine quantity and availability
- Move to preparation

Main sections:

- Patient and consultation summary
- Read-only prescription
- Medicine review table
- Medicine drawer
- Request summary
- Sticky action bar

Availability values:

- Available
- Partially Available
- Unavailable

### 6.3 Medicine Preparation

Purpose:

- Confirm medicine, quantity and optional batch or expiry
- Mark every item prepared
- Move request to Ready

Main sections:

- Preparation summary
- Medicine preparation table
- Medicine drawer
- Preparation checklist
- Warnings
- Sticky action bar

### 6.4 Ready for Pickup and Handover

Purpose:

- Verify patient
- Confirm medicine handover
- Complete the request

Main sections:

- Ready queue
- Patient and prescription detail
- Prepared medicine list
- Handover checklist
- Completion confirmation

### 6.5 Simple Medicine Stock

Purpose:

- View stock availability
- Identify low stock and expiry risk
- Make controlled adjustments

Main sections:

- Stock summary
- Search and filters
- Stock table
- Stock detail drawer
- Stock adjustment modal

### 6.6 Dispensing History

Purpose:

- View completed handovers
- Audit staff and completion times
- Open read-only dispensing records

Main sections:

- Date and staff filters
- History table
- Dispensing record drawer

---

## 7. Simplified Pharmacy Workflow

```text
NEW
→ REVIEWING
→ PREPARING
→ READY
→ COMPLETED
```

Exception paths:

```text
REVIEWING
→ PARTIALLY_AVAILABLE

REVIEWING
→ UNAVAILABLE

ANY ACTIVE STATE
→ CANCELLED
```

Rules:

- The frontend never creates arbitrary statuses
- Completed records are read-only
- Handover is required before Completed
- Preparation is required before Ready
- Every medicine must be reviewed before Preparing

---

## 8. Data and State Management Guidance

### 8.1 Server State

Use TanStack Query for:

- Pharmacy requests
- Prescription details
- Medicine review
- Preparation state
- Ready queue
- Inventory
- History
- Hospital settings
- Pharmacy settings
- Staff data

### 8.2 Local Shared UI State

Use Zustand only for:

- Sidebar collapsed state
- Active tab
- Filters
- Selected row
- Drawer state
- Modal state
- Table density
- Visible columns

Do not store:

- Patient records
- Prescriptions
- Inventory quantities
- Pharmacy request records
- Medical data

in Zustand or localStorage.

### 8.3 Form State

Use React Hook Form and Zod for:

- Medicine availability review
- Prepared quantity
- Patient verification
- Stock adjustment
- Notes
- Issue reason

### 8.4 Real-Time Updates

Subscribe to relevant events:

- Request created
- Request updated
- Request ready
- Request completed
- Request cancelled
- Inventory changed

Fallback:

- Poll every 30–60 seconds when disconnected

Do not interrupt active work when a new request arrives.

---

## 9. Hospital-Wide Reuse

This design system can be reused across other modules.

### 9.1 Front Office

Reuse:

- Shell
- Queue table
- Patient drawer
- Appointment status badges
- Sticky action bar
- Search
- Filters

### 9.2 Doctor Module

Reuse:

- Shell
- Patient list
- Consultation tabs
- Record drawers
- Read-only summaries
- Sticky completion actions

### 9.3 Billing

Reuse:

- Table system
- Patient summary
- Status badges
- Confirmation modals
- History drawer

### 9.4 Lab

Reuse:

- Request queue
- Status tabs
- Sample or report workflow
- Activity timeline
- Result drawer

### 9.5 Admin

Reuse:

- Shell
- Settings forms
- Tables
- Role badges
- Drawers
- Confirmation modals

---

## 10. Responsive Desktop Rules

### 1440px and above

- Expanded sidebar
- Full header
- Full table columns
- Persistent contextual panel when required

### 1280–1439px

- Reduce card gaps slightly
- Keep sidebar expanded where possible
- Allow internal table scrolling
- Reduce secondary panel width

### Below 1100px

- Collapse sidebar to 72px
- Move secondary panel into drawer
- Keep desktop table
- Move advanced filters into drawer

Do not transform staff modules into mobile card layouts.

---

## 11. Accessibility

Target WCAG 2.1 AA where practical.

Requirements:

- Semantic HTML
- Keyboard-accessible rows
- Visible focus states
- Accessible drawers and modals
- Text plus icon for statuses
- Minimum 40px desktop controls
- Tooltips for icon-only actions
- Error text linked to fields
- Reduced-motion support
- Screen-reader announcements for live updates
- Do not communicate meaning only through colour

---

## 12. Privacy and Security

Do not:

- Store patient or prescription data in localStorage
- Log patient data in browser console
- Expose permanent public document URLs
- Display full mobile numbers unnecessarily
- Render raw backend error messages
- Allow cross-pharmacy or cross-department access
- Update authoritative medical information from local UI state

Mask:

- Mobile numbers
- Sensitive identifiers where applicable

All workflow changes must record:

- Staff ID
- Department or pharmacy ID
- Entity ID
- Previous status
- New status
- Timestamp
- Reason when applicable

---

## 13. Content Style

Use short, clear, operational language.

Prefer:

- “Review prescription”
- “Start preparation”
- “Mark ready”
- “Confirm handover”
- “Unable to load queue”
- “1 medicine needs attention”

Avoid:

- Long explanations
- Technical backend terminology
- Casual language
- Ambiguous actions such as “Submit” or “Proceed”
- Excessive title casing

---

## 14. Final Consistency Checklist

Before approving any screen, confirm:

- Same sidebar
- Same header
- Same page padding
- Same typography
- Same tab style
- Same button style
- Same card radius
- Same table styling
- Same drawer width
- Same modal structure
- Same status colours
- Same loading state
- Same empty state
- Same error pattern
- One dominant primary action
- No invalid workflow actions
- No unnecessary hospital ERP complexity
- No payment or billing inside pharmacy workflows
- No prescription editing
- No automatic medicine substitution

---

## 15. Stitch / AI Design Instruction

When generating a new hospital screen:

> Reuse the approved Balaji Heart Center application shell and design tokens from this document. Do not redesign the sidebar, header, search, navigation, tabs, buttons, cards, tables, drawers, modals, status badges or spacing system. Only generate the page-specific content and valid workflow actions. Keep the interface modern, minimal, operational and suitable for continuous hospital staff use.
