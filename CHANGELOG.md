# RateApp Development History & Changelog

This document tracks every request and modification made to the RateApp workspace.

## [2026-04-08] - UI & Persistence Hardening

### Objectives
- Fix "CALC" button color consistency (Analytics, Profile, Tutorial, Pricing).
- Resolve persistent issues with deleting jobs, clients, and templates.
- Fix UI layout for Materials/Supplies boxes (buttons escaping container).

### Activities & Fixes
- **[Standardized Navigation]**: Updated all "CALC" (back) buttons to use the **Orange (#FFB347)** background and **Black (#000)** text scheme. This unifies the navigation across Jobs, Analytics, Profile, Client/Template Managers, Pricing, and Tutorial pages.
- **[UI Fix - MatChip]**: Adjusted flex layout and padding in `ui.jsx` to keep `+` and `-` buttons inside their boxes.
- **[Persistence - Custom Deletion Modal]**: Replaced unreliable native browser `confirm()` dialogs with a custom, branded arcade modal. This fixed the "cannot delete" issues across Jobs, Clients, and Templates.
- **[Aesthetics - Responsive 8-Bit Deletion]**: Applied "Press Start 2P" font to the deletion modal and implemented "Smart Resize" logic via CSS `clamp()` to ensure perfect legibility across all screen sizes.
- **[Redesign - Professional Invoice]**: Completely overhauled `pdfExport.js` to follow a professional invoice layout (based on user reference) including black metadata bars, zebra-striped tables, and distinct billing blocks, all in 8-bit styling.
- **[UX - Manager Refinement]**: 
    - Updated Template Manager to use Violet (#9C27B0) for "Duplicate" to distinguish it from "Delete".
    - Added high-contrast borders and backgrounds to all delete 'X' icons for better visibility.
- **[Bug Fix - Syntax]**: Resolved internal syntax errors in `App.jsx` and `ClientManager.jsx` that were causing silent failures.

---

### Previous Sessions Summary
- **Dark Tech Branding**: Integrated "Glitch" aesthetics across the main calculator and history pages.
- **ID Normalization**: Standardized all storage IDs to be treated as strings to prevent type-mismatch bugs between LocalStorage and Supabase.
- **Invoice PDF Refinement**: Optimized margins and font sizes for the pixel-art PDF generation.
