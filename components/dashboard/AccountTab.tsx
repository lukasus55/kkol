'use client';

import ProfilePictureCard from './account/ProfilePictureCard';
import DisplayNameCard from './account/DisplayNameCard';
import PasswordCard from './account/PasswordCard';

export default function AccountTab({ user }: { user: any }) {
  if (!user) return null;

  return (
    <div className="w-full flex justify-center py-12 px-6">
      <div className="flex flex-col gap-6 w-full max-w-[700px]">
        
        <h2 className="text-2xl font-bold text-white mb-2">Moje Konto</h2>
        
        <ProfilePictureCard currentPfpBase64={user.pfp_base64} />
        <DisplayNameCard currentName={user.displayed_name} />
        
        <h2 className="text-2xl font-bold text-white mt-12 mb-2">Bezpieczeństwo i Hasło</h2>
        
        <PasswordCard username={user.id} />
        
      </div>
    </div>
  );
}
