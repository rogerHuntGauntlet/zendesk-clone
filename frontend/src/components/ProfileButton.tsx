"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { ProfileModal } from "./ProfileModal";
import { mockProfiles } from "@/lib/mock-data";

export function ProfileButton() {
  const [open, setOpen] = useState(false);
  // Using first mock profile for now - this would be replaced with actual user data
  const profile = mockProfiles[0];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <UserCircle className="h-5 w-5" />
        My Profile
      </Button>
      <ProfileModal
        open={open}
        onOpenChange={setOpen}
        profile={profile}
      />
    </>
  );
} 