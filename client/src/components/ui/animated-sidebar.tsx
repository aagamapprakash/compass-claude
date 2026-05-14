import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useState, createContext, useContext } from "react";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  return (
    <>
      <DesktopSidebar className={className} {...props}>
        {children}
      </DesktopSidebar>
      <MobileSidebar className={className} {...props}>
        {children}
      </MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <div
      className={cn(
        "h-full px-4 py-6 hidden md:flex md:flex-col bg-compass-navy flex-shrink-0 transition-all duration-300 ease-in-out",
        animate ? (open ? "w-[280px]" : "w-[72px]") : "w-[280px]",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <div className="md:hidden flex flex-col w-full">
      <div
        className="h-16 px-5 py-4 flex flex-row items-center justify-between bg-compass-navy w-full shadow-soft"
      >
        <div className="flex justify-end z-20 w-full">
          <button 
            onClick={() => setOpen(!open)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Menu
              className="text-white h-5 w-5"
              data-testid="button-mobile-menu"
            />
          </button>
        </div>
      </div>
      {open && (
        <div
          className={cn(
            "fixed h-full w-full inset-0 bg-compass-navy p-8 z-[100] flex flex-col justify-between",
            className
          )}
          {...props}
        >
          <button
            className="absolute right-8 top-8 z-50 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5 text-white" data-testid="button-mobile-close" />
          </button>
          {children}
        </div>
      )}
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive,
  onClick,
}: {
  link: Links;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();
  const showLabel = !animate || open;
  
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-3.5 px-4 rounded-2xl transition-all duration-300",
        isActive 
          ? "bg-white/15 text-white shadow-soft" 
          : "text-white/70 hover:bg-white/10 hover:text-white",
        className
      )}
    >
      <span className="flex-shrink-0">{link.icon}</span>
      <span
        className={cn(
          "text-sm font-medium group-hover/sidebar:translate-x-1 transition duration-200 whitespace-pre !p-0 !m-0",
          showLabel ? "inline-block opacity-100" : "hidden opacity-0"
        )}
      >
        {link.label}
      </span>
    </Link>
  );
};
