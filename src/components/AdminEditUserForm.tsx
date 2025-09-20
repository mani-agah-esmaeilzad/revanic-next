
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';


interface User {
    id: number;
    name: string | null;
    email: string;
    bio: string | null;
    role: string;
}

interface AdminEditUserFormProps {
    user: User;
    onFinished: () => void; 
}

export const AdminEditUserForm = ({ user, onFinished }: AdminEditUserFormProps) => {
    const [name, setName] = useState(user.name || '');
    const [email, setEmail] = useState(user.email);
    const [bio, setBio] = useState(user.bio || '');
    const [role, setRole] = useState(user.role);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    name,
                    email,
                    bio,
                    role,
                }),
            });

            if (response.ok) {
                onFinished(); 
            } else {
                const result = await response.text();
                setError(result || 'خطا در ویرایش کاربر.');
            }
        } catch (err) {
            setError('خطای شبکه. لطفاً دوباره تلاش کنید.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}

            <div>
                <Label htmlFor="name">نام</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
                <Label htmlFor="email">ایمیل</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
                <Label htmlFor="bio">بیوگرافی</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="بیوگرافی کاربر..." />
            </div>

            <div>
                <Label htmlFor="role">نقش</Label>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    ذخیره تغییرات
                </Button>
            </div>
        </form>
    );
};