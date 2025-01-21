"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Save, Shield, Users, Building2 } from "lucide-react";
import type { Profile } from '@/types';
import { useRouter } from "next/navigation";

interface ProfileModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  profile: Profile;
}

export function ProfileModal({ open, onOpenChangeAction, profile: initialProfile }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const router = useRouter();

  const handleSave = () => {
    // TODO: Implement save to backend
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Profile Details
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {isEditing ? (
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="text-center"
            />
          ) : (
            <h2 className="text-xl font-semibold">{profile.name}</h2>
          )}
          <p className="text-muted-foreground">
            {profile.title || profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            {isEditing ? (
              <Input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            ) : (
              <p>{profile.email}</p>
            )}
          </div>

          <div>
            <Label>Department</Label>
            {isEditing ? (
              <Input
                value={profile.department || ""}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              />
            ) : (
              profile.department && <p>{profile.department}</p>
            )}
          </div>

          <div>
            <Label>Phone</Label>
            {isEditing ? (
              <Input
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            ) : (
              profile.phone && <p>{profile.phone}</p>
            )}
          </div>

          <div>
            <Label>Timezone</Label>
            {isEditing ? (
              <Input
                value={profile.timezone || ""}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              />
            ) : (
              profile.timezone && <p>{profile.timezone}</p>
            )}
          </div>

          <div>
            <Label>Joined</Label>
            <p>{new Date(profile.joinedDate).toLocaleDateString()}</p>
          </div>

          {profile.lastActive && (
            <div>
              <Label>Last Active</Label>
              <p>{new Date(profile.lastActive).toLocaleString()}</p>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <Label>Switch Portal</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant="outline"
                className="flex flex-col items-center p-4"
                onClick={() => router.push('/admin-login')}
              >
                <Shield className="h-4 w-4 mb-1" />
                Admin
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4"
                onClick={() => router.push('/employee-login')}
              >
                <Users className="h-4 w-4 mb-1" />
                Employee
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4"
                onClick={() => router.push('/client-login')}
              >
                <Building2 className="h-4 w-4 mb-1" />
                Client
              </Button>
            </div>
          </div>
        </div>

        {isEditing && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
} 