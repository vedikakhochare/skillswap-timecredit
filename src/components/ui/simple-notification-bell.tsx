import { useState } from "react";
import { Button } from "./button";
import { Bell } from "lucide-react";

interface SimpleNotificationBellProps {
  className?: string;
}

export const SimpleNotificationBell = ({ className }: SimpleNotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${className}`}
      >
        <Bell className="h-5 w-5" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Simple Notification Panel */}
          <div className="absolute right-0 top-12 w-80 z-50 bg-white border rounded-lg shadow-lg p-4">
            <div className="text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Notifications coming soon</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
