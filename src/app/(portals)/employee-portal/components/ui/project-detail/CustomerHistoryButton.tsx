import React, { useState } from 'react';
import { Button } from '../button';
import { CustomerHistoryView } from '../customer-history/CustomerHistoryView';
import { UserIcon } from 'lucide-react';

interface CustomerHistoryButtonProps {
  customerId: string;
}

export function CustomerHistoryButton({ customerId }: CustomerHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <UserIcon className="w-4 h-4" />
        View Customer History
      </Button>

      <CustomerHistoryView
        customerId={customerId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
} 