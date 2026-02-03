import { useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Gamepad2, User } from 'lucide-react';

export default function ResponsiveLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center h-14 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-2 mt-6">
                <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link to="/agent" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent">
                  <Gamepad2 className="h-4 w-4" />
                  Agent Console
                </Link>
                <Link to="/new/player/1" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent">
                  <User className="h-4 w-4" />
                  Sample Player
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="ml-3 font-semibold">SkySim Tactical GG</h1>
        </div>
      </header>

      <main className="flex-1 pt-14 p-6">
        {children}
      </main>
    </div>
  );
}
