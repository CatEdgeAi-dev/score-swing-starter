import { useSwipeable } from 'react-swipeable';

interface UseSwipeGesturesProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
}

export const useSwipeGestures = ({ 
  onSwipeLeft, 
  onSwipeRight, 
  disabled = false 
}: UseSwipeGesturesProps) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!disabled) {
        onSwipeLeft();
      }
    },
    onSwipedRight: () => {
      if (!disabled) {
        onSwipeRight();
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: true,
    delta: 50, // Minimum distance for swipe
  });

  return handlers;
};