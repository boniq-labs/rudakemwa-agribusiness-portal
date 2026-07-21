# AGENTS.md – Anchored Summary

## Project: EFMS (Enterprise Farm Management System)

### Current Work State

**Session Focus:** UI/UX redesign of Splash Screen and Login Page

**Completed:**
- **SplashScreen.tsx** — Dark farm-tech background with `farm_background.png` overlay (screen blend, 8% opacity), radial gradient glow layers; logo in circular container with green ring border, inner highlight, pulsing outer glow; smooth fade-in + scale-up; brand text with decorative divider; gradient loading bar with shimmer sweep

- **LoginPage.tsx** — Centered card layout (90%×85% viewport, max 1280×820px, rounded-2xl lg:rounded-[24px]); left panel 40% with farm image overlay + dark gradient + brand logo/circular container at original position + RUDAKEMWA branding + decorative divider + tagline + farm illustration icons (Tractor/Trees/Sprout/Leaf) with floating animations; right panel 60% with dark mode toggle (Sun/Moon), green Leaf avatar, "Welcome Back!" heading, `h-[50px]` inputs with `border-2` + focus glow, icons via `group-focus-within`, forgot password underline animation, 3-stop gradient button with shimmer + lift, "Secure Access" divider, data protection badge with ShieldCheck; dark mode support via state toggle; `react-hot-toast` for success/error notifications; responsive mobile stacking

### Logo Processing
- **Background removed** — JPEG-to-PNG conversion, lossless, 0% pixel deviation
- All `mixBlendMode: 'screen'` workarounds removed
- Logo position preserved in left panel (same circular container, same location)

### Design Principles
- Dark green / farm aesthetic (green-900→green-400 palette)
- Circular logo presentation with overflow-hidden + transparent PNG
- Glassmorphism with accent bars and inner highlights
- Framer Motion for entrance animations and micro-interactions
- Premium typography with tight tracking, extrabold weights, uppercase tags

### Tech Stack
- React + TypeScript + Vite
- Tailwind CSS v4
- Framer Motion
- React Hook Form + Zod
- Lucide React icons
- React Router v7
- Axios
- Context API for auth

### Pending
- No pending items; client approved design direction
