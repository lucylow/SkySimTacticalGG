import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export interface UndoAction {
  id: string;
  message: string;
  undo: () => void;
  timestamp: number;
}

// Hook for managing undo actions
export const useUndoToast = () => {
  const showUndoToast = (message: string, undo: () => void, duration = 5000) => {
    toast(message, {
      description: 'You can undo this action',
      action: {
        label: 'Undo',
        onClick: () => {
          undo();
        },
      },
      duration,
      icon: <RotateCcw className="w-4 h-4" />,
    });
  };

  return { showUndoToast };
};

// Example usage in components:
// const { showUndoToast } = useUndoToast();
//
// const handleAction = () => {
//   const previousState = currentState;
//   performAction();
//   showUndoToast('Action completed', () => {
//     setState(previousState);
//   });
// };
