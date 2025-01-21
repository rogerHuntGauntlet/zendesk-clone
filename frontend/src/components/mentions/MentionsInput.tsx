import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MentionSuggestion } from '@/types/tickets';

interface MentionsInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  className?: string;
  suggestions: MentionSuggestion[];
}

export function MentionsInput({
  value,
  onChange,
  placeholder,
  className,
  suggestions
}: MentionsInputProps) {
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getCurrentMentionQuery = useCallback((text: string, position: number) => {
    const beforeCursor = text.slice(0, position);
    const match = beforeCursor.match(/@(\w*)$/);
    return match ? match[1] : '';
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newPosition = e.target.selectionStart || 0;
    const query = getCurrentMentionQuery(newValue, newPosition);
    
    setMentionQuery(query);
    setCursorPosition(newPosition);
    setShowMentions(!!query);
    onChange(newValue, mentions);
  };

  const handleMentionSelect = (suggestion: MentionSuggestion) => {
    if (!textareaRef.current) return;

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const mentionStart = beforeCursor.lastIndexOf('@');
    const newValue = `${beforeCursor.slice(0, mentionStart)}@${suggestion.name} ${afterCursor}`;
    
    setShowMentions(false);
    setMentions([...mentions, suggestion.id]);
    onChange(newValue, [...mentions, suggestion.id]);

    // Set cursor position after the mention
    const newPosition = mentionStart + suggestion.name.length + 2;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    suggestion.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        placeholder={placeholder}
        className={className}
      />
      <Popover open={showMentions} onOpenChange={setShowMentions}>
        <PopoverTrigger asChild>
          <div />
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0"
          style={{
            position: 'absolute',
            left: '0',
            top: '100%'
          }}
        >
          <Command>
            <CommandInput placeholder="Search people..." />
            <CommandEmpty>No people found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-64">
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.id}
                    onSelect={() => handleMentionSelect(suggestion)}
                    className="flex items-center gap-2 p-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={suggestion.avatar} />
                      <AvatarFallback>{suggestion.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-sm text-gray-500">{suggestion.role}</div>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 