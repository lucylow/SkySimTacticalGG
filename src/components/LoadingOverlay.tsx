import { Loader2 } from 'lucide-react';

export default function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center w-full py-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
