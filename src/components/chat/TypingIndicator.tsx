import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  users: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
  }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const displayText =
    users.length === 1
      ? `${users[0].display_name} is typing`
      : users.length === 2
      ? `${users[0].display_name} and ${users[1].display_name} are typing`
      : `${users[0].display_name} and ${users.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <Avatar key={user.user_id} className="w-6 h-6 border-2 border-background">
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback className="text-[10px] bg-secondary">
              {user.display_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>

      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50">
        <span className="text-xs text-muted-foreground">{displayText}</span>
        <div className="flex gap-0.5 ml-1">
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dot" />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dot" />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
}
