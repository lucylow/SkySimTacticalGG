# Design System Documentation

## Overview

This design system provides a consistent, accessible, and visually cohesive experience across the AI-Powered Esports Coaching platform. The system follows a "purple-alien BEAM" aesthetic with dark themes, glassmorphism effects, and smooth animations.

## Design Tokens

### Colors

#### Primary Palette

- **Primary (Purple)**: `hsl(262, 83%, 58%)` / `#7C3AED`
  - Used for: Primary actions, highlights, brand elements
  - Foreground: `hsl(210, 40%, 98%)`
- **Secondary (Blue)**: `hsl(217, 91%, 60%)` / `#3B82F6`
  - Used for: Secondary actions, accents
  - Foreground: `hsl(210, 40%, 98%)`

- **Accent (Cyan)**: `hsl(172, 66%, 50%)` / `#14B8A6`
  - Used for: Beam/evidence indicators, success states
  - Foreground: `hsl(222, 47%, 5%)`

#### Semantic Colors

- **Success**: `hsl(160, 84%, 39%)` / `#10B981`
- **Warning**: `hsl(38, 92%, 50%)` / `#F59E0B`
- **Destructive**: `hsl(0, 84%, 60%)` / `#EF4444`
- **Info**: `hsl(199, 89%, 48%)` / `#06B6D4`

#### Neutral Palette

- **Background**: `hsl(222, 47%, 5%)` / Dark base
- **Card**: `hsl(222, 47%, 8%)` / Elevated surfaces
- **Muted**: `hsl(217, 33%, 17%)` / Borders, dividers
- **Foreground**: `hsl(210, 40%, 98%)` / Primary text

### Typography

#### Font Families

- **Display**: `'Space Grotesk'` - Headings, hero text
- **Sans**: `'Inter'` - Body text, UI elements
- **Mono**: `'JetBrains Mono'` - Code, data, timestamps

#### Type Scale

- **H1**: `48-64px` (4xl-7xl) - Hero headings
- **H2**: `28-32px` (3xl-4xl) - Section headings
- **H3**: `24px` (2xl) - Subsection headings
- **Body**: `14-16px` (base) - Default text
- **Small**: `12-14px` (sm) - Captions, labels
- **Tiny**: `10-12px` (xs) - Metadata, timestamps

### Spacing

Consistent 4px base unit:

- `4px` (1) - Tight spacing
- `8px` (2) - Compact spacing
- `12px` (3) - Default spacing
- `16px` (4) - Comfortable spacing
- `24px` (6) - Section spacing
- `32px` (8) - Large section spacing
- `48px` (12) - Hero spacing

### Border Radius

- **Default**: `0.75rem` (12px) - Cards, buttons
- **Small**: `calc(var(--radius) - 4px)` (8px) - Small elements
- **Medium**: `calc(var(--radius) - 2px)` (10px) - Medium elements
- **Large**: `var(--radius)` (12px) - Large cards

### Shadows & Glows

- **Card Shadow**: `0 4px 20px -4px hsla(0, 0%, 0%, 0.3)`
- **Elevated Shadow**: `0 10px 40px -10px hsla(0, 0%, 0%, 0.5)`
- **Primary Glow**: `0 0 40px hsla(262, 83%, 58%, 0.3)`
- **Accent Glow**: `0 0 40px hsla(172, 66%, 50%, 0.3)`

### Gradients

- **Primary Gradient**: `linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(217, 91%, 60%) 100%)`
- **Accent Gradient**: `linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(172, 66%, 50%) 100%)`
- **Success Gradient**: `linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)`

## Components

### Buttons

#### Primary Button

```tsx
<Button className="bg-gradient-primary hover:opacity-90 glow-primary">Primary Action</Button>
```

#### Secondary Button

```tsx
<Button variant="outline" className="border-border/50 hover:bg-muted/50">
  Secondary Action
</Button>
```

#### Destructive Button

```tsx
<Button variant="destructive">Delete</Button>
```

### Cards

#### Glass Card (Default)

```tsx
<Card className="glass-card">
  <CardContent>Content</CardContent>
</Card>
```

Features:

- Backdrop blur effect
- Semi-transparent background
- Border with primary glow on hover
- Smooth transitions

### Form Elements

#### Input

- Background: `bg-background/50`
- Border: `border-border/50`
- Focus: `focus:border-primary/50` with glow
- Placeholder: `text-muted-foreground`

#### Textarea

- Same styling as input
- Minimum height: `120px` for prompt editor
- Resize: `resize-none` for controlled sizing

### Status Indicators

#### Loading Spinner

```tsx
<Loader2 className="w-4 h-4 animate-spin" />
```

#### Status Dot

- Online: `bg-success`
- Offline: `bg-muted-foreground`
- Busy: `bg-warning`
- Error: `bg-destructive`

### Streaming Indicators

For AI responses:

- Use `aria-live="polite"` for announcements
- Show skeleton loaders during initial load
- Display "Analyzing..." with spinner during streaming
- Use `role="status"` for streaming messages

## Layout Patterns

### Section Container

```tsx
<div className="section-container">
  <h2 className="section-heading">Title</h2>
  <p className="section-subheading">Description</p>
</div>
```

### Grid Layouts

- **2-column**: `grid lg:grid-cols-2 gap-6`
- **3-column**: `grid lg:grid-cols-3 gap-6`
- **Responsive**: Breakpoints at `sm:`, `md:`, `lg:`, `xl:`

## Animations

### Keyframes

- `fade-in`: Opacity + translateY
- `scale-in`: Scale + opacity
- `pulse-glow`: Opacity pulse for glows
- `float`: Vertical float animation
- `gradient-shift`: Animated gradient background

### Usage

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

## Accessibility

### Color Contrast

- **Body text**: ≥ 4.5:1 contrast ratio (WCAG AA)
- **Large text**: ≥ 3:1 contrast ratio
- All colors tested against background

### Keyboard Navigation

- All interactive elements focusable
- Visible focus rings: `outline: 2px solid hsl(var(--ring))`
- Logical tab order

### ARIA Labels

- Form controls have labels
- Buttons have descriptive `aria-label`
- Status messages use `aria-live`
- Streaming content uses `role="status"`

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```

## Usage Guidelines

### Do's

✅ Use design tokens from CSS variables
✅ Maintain consistent spacing (4px base)
✅ Use semantic color names (primary, success, etc.)
✅ Include ARIA labels for screen readers
✅ Test keyboard navigation
✅ Use glass-card for elevated content

### Don'ts

❌ Hardcode color values
❌ Use arbitrary spacing values
❌ Skip accessibility attributes
❌ Ignore reduced motion preferences
❌ Mix different border radius values

## File Structure

```
src/
├── index.css          # Design tokens (CSS variables)
├── tailwind.config.ts # Tailwind theme configuration
└── components/
    └── ui/            # Reusable UI components
```

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Framer Motion](https://www.framer.com/motion/)
