import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User, ShareTicketData } from "@/types";

interface ShareTicketDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (data: ShareTicketData) => void;
  users: User[];
}

export function ShareTicketDialog({
  isOpen,
  onOpenChange,
  onShare,
  users
}: ShareTicketDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  const handleShare = () => {
    onShare({
      users: selectedUsers.map(u => u.id),
      message: message || undefined,
      expiresAt: expiryDate?.toISOString(),
      includeAttachments: true,
      includeHistory: true
    });
    onOpenChange(false);
    // Reset form
    setSelectedUsers([]);
    setMessage("");
    setExpiryDate(undefined);
  };

  const toggleUser = (user: User) => {
    setSelectedUsers(current =>
      current.some(u => u.id === user.id)
        ? current.filter(u => u.id !== user.id)
        : [...current, user]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Ticket</DialogTitle>
          <DialogDescription>
            Share this ticket with other team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Users */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Selected Users</label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <Badge
                  key={user.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {user.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => toggleUser(user)}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* User Selection */}
          <Popover open={isUserListOpen} onOpenChange={setIsUserListOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isUserListOpen}
                className="w-full justify-between"
              >
                Select users to share with...
                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-64">
                    {users.map(user => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => toggleUser(user)}
                        className="flex items-center gap-2 p-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                        {selectedUsers.some(u => u.id === user.id) && (
                          <Badge>Selected</Badge>
                        )}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message (Optional)</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a message for the recipients..."
              className="min-h-[100px]"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Expires On (Optional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={selectedUsers.length === 0}
            >
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 