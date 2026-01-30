# Unified Tabs Component

A reusable tab component with consistent styling across the entire app.

## Usage

### Basic Example (Button Tabs)

```tsx
import { Tabs } from "@/components/ui";

function MyComponent() {
  const [activeTab, setActiveTab] = useState("videos");

  const tabs = [
    { id: "videos", label: "Videos", badge: 42 },
    { id: "analytics", label: "Analytics" }
  ];

  return (
    <Tabs 
      items={tabs} 
      activeId={activeTab}
      onTabChange={setActiveTab}
      ariaLabel="Content tabs"
    />
  );
}
```

### Navigation Tabs (with Links)

```tsx
import { Tabs } from "@/components/ui";

function MyComponent() {
  const pathname = usePathname();

  const tabs = [
    { 
      id: "extractor", 
      label: "Tag Finder", 
      href: "/tags/extractor",
      icon: <SearchIcon />
    },
    { 
      id: "generator", 
      label: "Tag Generator", 
      href: "/tags/generator",
      icon: <SparklesIcon />
    }
  ];

  const activeTab = pathname.includes("generator") ? "generator" : "extractor";

  return (
    <Tabs 
      items={tabs} 
      activeId={activeTab}
      ariaLabel="Tags tools"
    />
  );
}
```

## Global CSS Variables

The component uses these global CSS variables (defined in `globals.css`):

```css
--tab-container-bg: #f1f5f9;         /* Container background */
--tab-bg: transparent;                /* Default tab background */
--tab-bg-hover: #ffffff;              /* Hover tab background */
--tab-bg-active: #ffffff;             /* Active tab background */
--tab-text: #64748b;                  /* Default tab text color */
--tab-text-hover: #6366f1;            /* Hover tab text color (purple) */
--tab-text-active: #0f172a;           /* Active tab text color */
--tab-shadow-active: 0 1px 3px rgba(0, 0, 0, 0.08);
```

## Features

- ✅ Supports both link-based (navigation) and button-based (state) tabs
- ✅ Optional icons and badges
- ✅ Consistent purple hover effect
- ✅ No gaps between tabs
- ✅ Fully accessible (ARIA roles, keyboard navigation)
- ✅ Smooth transitions
- ✅ Global CSS variables for easy theming
