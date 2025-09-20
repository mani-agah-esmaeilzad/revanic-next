'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';

interface UserData {
  id: number;
  name: string | null;
  email: string;
  bio: string | null;
}

interface ProfileSettingsProps {
  user: UserData;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoMessage(null);
    try {
      const response = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio }),
      });
      const result = await response.json();
      if (response.ok) {
        setInfoMessage({ type: 'success', text: 'اطلاعات با موفقیت ذخیره شد.' });
      } else {
        setInfoMessage({ type: 'error', text: result.message || 'خطا در ذخیره اطلاعات.' });
      }
    } catch (error) {
      setInfoMessage({ type: 'error', text: 'خطای شبکه.' });
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'رمز عبور جدید و تکرار آن مطابقت ندارند.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      const response = await fetch('/api/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: result.message || 'خطا در تغییر رمز عبور.' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'خطای شبکه.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-soft border-0">
        <CardHeader><CardTitle>اطلاعات شخصی</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {infoMessage && <p className={`text-sm ${infoMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{infoMessage.text}</p>}
            <div>
              <Label htmlFor="name">نام و نام خانوادگی</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">ایمیل</Label>
              <Input id="email" type="email" value={user.email} disabled />
            </div>
            <div>
              <Label htmlFor="bio">بیوگرافی</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="کمی درباره خودتان بنویسید..." rows={4} />
            </div>
            <Button type="submit" disabled={infoLoading}>
              {infoLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ذخیره تغییرات
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0">
        <CardHeader><CardTitle>تنظیمات حساب</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordMessage && <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage.text}</p>}
            <div>
              <Label htmlFor="current-password">رمز عبور فعلی</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="new-password">رمز عبور جدید</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" variant="outline" disabled={passwordLoading}>
              {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              تغییر رمز عبور
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
