import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SimpleMessage } from "@/lib/simpleMessagingService";
import { format } from "date-fns";

interface SimpleMessageBubbleProps {
  message: SimpleMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export const SimpleMessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar = false, 
  senderName,
  senderAvatar 
}: SimpleMessageBubbleProps) => {
  return (
    <div className={cn(
      "flex gap-2 max-w-[80%]",
      isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>
            {senderName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col gap-1",
        isOwn ? "items-end" : "items-start"
      )}>
        {showAvatar && !isOwn && senderName && (
          <span className="text-xs text-muted-foreground px-2">
            {senderName}
          </span>
        )}
        
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm",
          isOwn 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        
        <span className="text-xs text-muted-foreground px-1">
          {format(message.createdAt, "HH:mm")}
        </span>
      </div>
    </div>
  );
};
