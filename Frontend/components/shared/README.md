# Shared Components Documentation

This folder contains reusable components organized by category for use across the application.

## Structure

```
shared/
├── animations/    # Animation and visual effect components
└── ui/            # Reusable UI components
```

## Animations (`@/components/shared/animations`)

### CursorEffect
Interactive click ripple effect that follows mouse clicks.

**Usage:**
```tsx
import { CursorEffect } from "@/components/shared/animations";

<CursorEffect />
```

### DynamicBackground
Mouse-following gradient orbs with animated circles. Creates an interactive ambient background.

**Usage:**
```tsx
import { DynamicBackground } from "@/components/shared/animations";

<DynamicBackground />
```

### DataStream
Matrix-like falling data visualization effect.

**Usage:**
```tsx
import { DataStream } from "@/components/shared/animations";

<DataStream />
```

## UI Components (`@/components/shared/ui`)

### GlassCard
Glassmorphism card with hover glow effect and entrance animation.

**Props:**
- `children` - Card content
- `className` - Additional CSS classes
- `delay` - Animation delay in seconds (default: 0)
- `glow` - Whether to show glow effect on hover (default: false)

**Usage:**
```tsx
import { GlassCard } from "@/components/shared/ui";

<GlassCard glow delay={0.2} className="p-8">
  <h3>Card Title</h3>
  <p>Card content</p>
</GlassCard>
```

### MagneticButton
Button with magnetic hover effect using GSAP. The button follows the cursor with elastic movement.

**Props:**
- `children` - Button content
- `className` - Additional CSS classes
- `onClick` - Click handler

**Usage:**
```tsx
import { MagneticButton } from "@/components/shared/ui";

<MagneticButton 
  className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
  onClick={() => console.log('clicked')}
>
  Click Me
</MagneticButton>
```

### CountUp
Animated number counter with cubic easing.

**Props:**
- `value` - Target number to count to
- `prefix` - String to display before the number
- `suffix` - String to display after the number  
- `duration` - Animation duration in seconds (default: 2)

**Usage:**
```tsx
import { CountUp } from "@/components/shared/ui";

<CountUp value={1000} prefix="$" suffix="+" duration={2} />
```

### LiveClock
Displays current system time with live updates every second.

**Usage:**
```tsx
import { LiveClock } from "@/components/shared/ui";

<LiveClock />
```

## Dependencies

- `framer-motion` - Animation library
- `gsap` - GreenSock animation platform (for MagneticButton)

## Adding New Components

1. Create the component file in the appropriate folder
2. Add JSDoc comments explaining the component and its props
3. Export from the folder's `index.ts`
4. Update this README with usage documentation
