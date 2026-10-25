import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // A flat fill reads as "default Bootstrap-blue button"; the gradient token gives
        // the primary action a bit of presence without touching every other `bg-primary`
        // use (badges, active nav state, focus rings) that still wants a single flat color.
        primary:
          'bg-[image:var(--primary-gradient)] text-primary-foreground shadow-sm hover:brightness-110',
        secondary: 'bg-card text-foreground border border-border shadow-sm hover:bg-accent',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. a Next `<Link>`) while keeping button styling. */
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

// `buttonVariants` is deliberately not re-exported. Nothing outside this file needs the
// class string, and exporting it invites styling a plain `<div>` to look like a button.
//
// `asChild` stays despite having no call site yet: it is what lets a navigation control
// render as `<Button asChild><Link …/></Button>`. Without it the tempting shortcut is a
// `<button onClick={router.push}>`, which loses middle-click, right-click and the status
// bar preview a real link gives for free.
