import { cn } from '@/lib/utils'
import { VariantProps, cva } from "class-variance-authority";
import { forwardRef, ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
    "relative group border text-foreground mx-auto text-center rounded-full font-medium transition-all duration-300",
    {
        variants: {
            variant: {
                default: "bg-compass-navy/5 hover:bg-compass-navy/0 border-compass-navy/20 text-compass-navy",
                solid: "bg-compass-navy hover:bg-compass-navy/90 text-white border-transparent hover:border-compass-gold/50 transition-all duration-200",
                maroon: "bg-compass-maroon hover:bg-compass-maroon/90 text-white border-transparent hover:border-compass-gold/50 transition-all duration-200",
                gold: "bg-compass-gold hover:bg-compass-gold/90 text-compass-navy border-transparent hover:border-compass-navy/30 transition-all duration-200",
                ghost: "border-transparent bg-transparent hover:border-compass-navy/30 hover:bg-compass-navy/5",
                outline: "border-compass-navy/30 bg-transparent hover:bg-compass-navy/5 text-compass-navy",
            },
            size: {
                default: "px-7 py-2 text-sm",
                sm: "px-4 py-1.5 text-xs",
                lg: "px-10 py-3 text-base",
                xl: "px-12 py-4 text-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface NeonButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { 
    neon?: boolean;
    neonColor?: 'navy' | 'maroon' | 'gold';
}

const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
    ({ className, neon = true, neonColor = 'gold', size, variant, children, ...props }, ref) => {
        const neonColorClasses = {
            navy: 'via-compass-navy',
            maroon: 'via-compass-maroon', 
            gold: 'via-compass-gold',
        };

        return (
            <button
                className={cn(buttonVariants({ variant, size }), className)}
                ref={ref}
                {...props}
            >
                <span className={cn(
                    "absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden",
                    neonColorClasses[neonColor],
                    neon && "block"
                )} />
                {children}
                <span className={cn(
                    "absolute group-hover:opacity-50 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden",
                    neonColorClasses[neonColor],
                    neon && "block"
                )} />
            </button>
        );
    }
)

NeonButton.displayName = 'NeonButton';

export { NeonButton, buttonVariants };
