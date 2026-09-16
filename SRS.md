# Software Requirements Specification (SRS)
## PunarJeevAnn — Mobile-First AI Vegetarian Food Waste Reduction App

**App Name:** PunarJeevAnn  
**Document Version:** 2.0.0  
**Date:** August 24, 2026  
**Status:** Approved Technical Architecture & Design Standard  
**Target Scope:** Vegetarian Recipe Generation & Household Food Waste Reduction  
**Deployment Platform:** Mobile-First Web Application (Progressive Web App Architecture on Vercel)

---

## 1. Executive Summary & Product Overview

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the official system architecture, user interface flows, tech stack, data models, API payloads, and design system for **PunarJeevAnn** (punar-jeev-ann: giving new life to leftover food). It serves as an authoritative, machine-parsable contract for human developers and AI code generation models to build, test, and maintain the application with zero functional or visual drift.

### 1.2 Problem Statement & Vision
Household food waste is a major environmental and economic issue. Individuals frequently inspect their refrigerators, find partial or small quantities of leftover ingredients (e.g., half a tomato, some boiled rice, a piece of paneer), assume a meal cannot be prepared, and throw them out.

**PunarJeevAnn** solves this by providing a mobile-first web app where users quickly input ingredients via typed text or an Adobe Scan-style multi-photo camera capture. The application automatically normalizes ingredients, corrects spelling via Fuse.js, generates instant vegetarian recipes using Gemini 1.5 Flash, and calculates real-time ecological impact scores ($\text{CO}_2\text{e}$ prevented, water saved).

### 1.3 Target Dietary Scope
- **100% Vegetarian:** Strictly excludes meat, poultry, fish, seafood, gelatin, and slaughter by-products (with an optional vegan toggle).

---

## 2. Technical Stack Specification

The technology stack is strictly standardized across all layers as shown below:

| Layer | Selected Tool / Library | Role & Function in PunarJeevAnn |
| :--- | :--- | :--- |
| **Full-Stack Framework** | `Next.js 14 (App Router)` | Unified React Mobile UI, SSR, and Serverless API Routes. |
| **Programming Language** | `TypeScript 5.x` | End-to-end type safety for state, API payloads, and JSON schemas. |
| **Styling & UI System** | `Tailwind CSS` + `Framer Motion` | Mobile-first utility styling, dark mode tokens, and fluid micro-animations. |
| **Input Fuzzy Engine** | `Fuse.js 7.0` | Client-side fuzzy spell checking (`tomat` $\rightarrow$ `Tomato`) and category auto-tagging. |
| **State Management** | `Zustand 4.5` | Lightweight client state store for ingredient items, photo buffer, and UI steps. |
| **AI Engine (Text/Vision)** | `Gemini 1.5 Flash` | Vision OCR ingredient extraction and structured JSON vegetarian recipe generation. |
| **Deployment & Hosting** | `Vercel` | Serverless deployment with edge CDN, automatic SSL, and zero-config CI/CD. |

---

## 3. Interactive 5-Step System Pipeline

```
  [STEP 01]             [STEP 02]             [STEP 03]             [STEP 04]             [STEP 05]
 USER INPUT   ──────►   PROCESSING   ──────►   SERVER API   ──────►  AI GENERATOR  ──────►   ECO DISPLAY
 Type text OR           Fuse.js spell         Next.js Gateway &      Gemini 1.5 Flash     Recipe steps +
 Upload photo          check & Gemini         JSON Prompt Builder    Structured Engine    CO2 & Water score
                         Vision OCR
```

1. **STEP 01: USER INPUT** — User manually inputs text or uploads/captures photos of ingredients.
2. **STEP 02: PROCESSING** — Client-side Fuse.js performs spell correction and category matching; Gemini 1.5 Flash processes photo payloads for vision OCR detection.
3. **STEP 03: SERVER API** — Next.js App Router API gateway sanitizes items and constructs the structured JSON prompt.
4. **STEP 04: AI GENERATOR** — Gemini 1.5 Flash Structured Engine generates validated vegetarian recipes.
5. **STEP 05: ECO DISPLAY** — Renders step-by-step cooking cards alongside real-time $\text{CO}_2\text{e}$ and water conservation score badges.

---

## 4. System Workflow & User Journey

### 4.1 Master State Navigation Diagram

```mermaid
stateDiagram-v2
    [*] --> Screen1_Landing: Launch PunarJeevAnn
    
    state Screen1_Landing {
        [*] --> InputChoice
        InputChoice --> Screen2_ManualInput: Select "Type Ingredients"
        InputChoice --> Screen3_CameraScan: Select "Scan Fridge / Camera"
    }

    state Screen3_CameraScan {
        [*] --> LiveViewfinder: Open Camera Overlay
        LiveViewfinder --> PhotoReviewTray: Capture Photo / Select Gallery
        LiveViewfinder --> Screen4_EditableList: Click "View List / Skip Camera"
        
        PhotoReviewTray --> LiveViewfinder: Click "Add More Photos (+)" (Max 5)
        PhotoReviewTray --> PhotoReviewTray: Click "Remove Photo (Trash)"
        PhotoReviewTray --> Screen4_EditableList: Click "View List (Run Gemini OCR)"
    }

    state Screen2_ManualInput {
        [*] --> TextForm: Type Ingredient Name
        TextForm --> FuseJS_Validation: Field onBlur Event
        FuseJS_Validation --> TextForm: Spell Correction & Default Autofill
        TextForm --> Screen4_EditableList: Click "Add Ingredient"
    }

    state Screen4_EditableList {
        [*] --> RenderCards: Display Item Cards with Stepper & Dropdowns
        RenderCards --> Screen3_CameraScan: Click "Take More Photos"
        RenderCards --> Screen2_ManualInput: Click "Add Manual Item"
        RenderCards --> Screen5_CookingLoading: Click "Generate Recipes"
    }

    state Screen5_CookingLoading {
        [*] --> Gemini15Flash_API: Request Structured JSON
        Gemini15Flash_API --> Screen6_RecipeEcoOutput: Response Received
    }

    Screen6_RecipeEcoOutput --> [*]: Display Recipes & Eco Badges
```

---

## 5. Detailed Functional Specifications

### 5.1 Module A: Adobe Scan-Style Multi-Photo Camera Engine

#### 5.1.1 Continuous Multi-Photo Buffer Workflow
- **Dual Source Ingestion:** Live device camera stream via `navigator.mediaDevices.getUserMedia` or gallery image upload via `<input type="file" accept="image/*" multiple>`.
- **Photo Review Tray:** After capturing or picking a photo, the user is navigated to a photo tray displaying thumbnail cards with individual delete buttons and an **"Add More Photos (+)"** button.
- **Sticky "View List" / Camera Skip Feature:** A persistent **"View List"** button exists on both the live camera viewfinder and the photo tray. If clicked while camera is active without taking new photos, it cleanly skips vision processing and transitions directly to the **Unified Editable Ingredient List Page**.

#### 5.1.2 Server Overload Prevention & Upload Limits
To prevent server overload, API quota exhaustion, and client browser lag:

> [!IMPORTANT]
> **Upload Limits & Compression Pipeline:**
> 1. **Hard Limit:** Maximum **5 images per scanning session**. Attempting to add a 6th image disables capture and shows a toast alert: *"Maximum limit of 5 photos reached per session."*
> 2. **Client Canvas Compression:**
>    - Max Dimensions: Scaled to fit within **1920x1080 pixels** aspect ratio.
>    - Format & Quality: `image/webp` at **0.80 quality factor**.
>    - Per-file target: **$\le$ 1.5 MB**; Total 5-photo payload cap: **$\le$ 8.0 MB**.

---

### 5.2 Module B: Manual Input & Fuse.js Processing Engine

#### 5.2.1 Fuse.js 7.0 Fuzzy Spell Correction Logic
- **Trigger:** Field `onBlur` event or form submit.
- **Dictionary:** Client-side dataset of 300+ vegetarian ingredients.
- **Fuse.js Config:** `threshold: 0.3`, `distance: 100`, `minMatchCharLength: 3`.
- **Behavior:** `tomat` auto-corrects to `Tomato`, `paner` to `Paneer`, `onon` to `Onion`. Displays a 2-second toast badge: *"Corrected to Tomato"*.

#### 5.2.2 Optional Field Autofill & Category Correction
If user adds an item without specifying optional fields:
- **Quantity Default:** Automatically set to `1`.
- **Metric Unit Defaults:** Countable produce $\rightarrow$ `pcs`, Leafy greens $\rightarrow$ `bunch`/`g`, Dairy/Liquids $\rightarrow$ `ml`/`cup`, Grains/Spices $\rightarrow$ `g`/`tbsp`.
- **Category Auto-Correction:** If user assigns an invalid category (e.g., `Tomato` tagged as `Dairy`), Fuse.js overrides category to `Vegetables & Greens`.

---

### 5.3 Module C: Unified Editable Ingredient List

- Card layout featuring item name, category badge, quantity stepper (`-` / `+`), metric dropdown `[pcs, g, kg, ml, l, cup, tbsp, tsp, bunch, slice, block]`, and delete icon.
- Global buttons: `Take More Photos`, `Add Manual Item`, `Clear All`, and sticky primary CTA **`Generate Recipes`**.

---

### 5.4 Module D & E: Gemini 1.5 Flash Recipe & Eco Score Engine

#### 5.4.1 Gemini 1.5 Flash JSON Output Schema
```json
{
  "recipes": [
    {
      "recipeId": "rec_01",
      "title": "15-Min Tomato Paneer Bhurji",
      "prepTimeMinutes": 15,
      "ingredientMatchPercentage": 100,
      "usedIngredients": ["Tomato", "Paneer", "Onion"],
      "pantryStaplesNeeded": ["Oil", "Salt", "Turmeric"],
      "instructions": [
        "Chop tomatoes and onions finely.",
        "Crumble paneer and sauté with spices for 5 minutes.",
        "Serve hot with rotis or bread."
      ]
    }
  ],
  "ecoImpact": {
    "co2eSavedKg": 1.84,
    "waterSavedLiters": 1160,
    "wasteDivertedGrams": 450,
    "realWorldAnalogs": {
      "drivingAvoidedKm": 12.2,
      "showerMinutesSaved": 14.5
    }
  }
}
```

---

## 6. Design System, Styling & Color Tokens (Tailwind CSS)

> [!IMPORTANT]
> **Figma-Matched PunarJeevAnn Color Palette & Design Tokens:**
> All components MUST use these exact Tailwind CSS theme variables to preserve styling consistency across AI agents.

### 6.1 Theme Configuration (`tailwind.config.js`)

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981', // Main Eco Green Accent
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        harvest: {
          400: '#fbbf24',
          500: '#f59e0b', // Amber Accent & Eco Badges
          600: '#d97706',
        },
        surface: {
          body:     '#0f172a', // Deep Slate Dark Base
          card:     '#1e293b', // Component Fill
          elevated: '#334155', // Inputs & Modals
          glass:    'rgba(30, 41, 59, 0.82)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.10)',
          card:   'rgba(255, 255, 255, 0.15)',
          active: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'pill': '9999px',
      },
      maxWidth: {
        'mobile-canvas': '480px',
      }
    },
  },
  plugins: [],
}
```

### 6.2 Mobile Layout Boundaries
- **Container Max-Width:** `480px` (centered viewport).
- **Padding:** `px-4` (`16px` horizontal margin).
- **Sticky Bottom Action Height:** `76px` with `backdrop-filter: blur(12px)`.
- **Minimum Touch Target:** `48px x 48px`.

---

## 7. Verification & QA Matrix

| Test ID | Module | Action / Input | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | App Branding | Header & Meta Title check | App displays **PunarJeevAnn** title & logo badge. |
| **TC-02** | Camera Cap | Select/Upload 6 images | Action blocked; toast: *"Maximum limit of 5 photos reached per session."* |
| **TC-03** | Camera Skip | Click "View List" on active live camera overlay | Camera turns off; navigates directly to editable ingredient list page. |
| **TC-04** | Fuse.js Spell | User types `"tomat"` and blurs | Input auto-updates to `"Tomato"`; 2-second toast badge shown. |
| **TC-05** | Category Auto-Correct | User selects `"Dairy"` for `"Cucumber"` | Fuse.js overrides category to `"Vegetables & Greens"`. |
| **TC-06** | AI Generation | Submit `[Tomato, Rice, Paneer]` to Gemini 1.5 Flash | Structured JSON returns vegetarian recipes & eco savings score. |

---
*End of Software Requirements Specification (SRS) Document v2.0.0 — PunarJeevAnn*
