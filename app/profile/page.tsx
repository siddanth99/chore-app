import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/profile");
  }

  const userId = session.user?.id;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>
      
      <div className="grid gap-4">
        {/* Profile Info Card */}
        <div className="p-6 rounded-lg bg-secondary/10 border border-border">
          <div className="flex items-start gap-4">
            {/* Avatar Placeholder */}
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            
            <div className="flex-1">
              <p className="text-lg font-medium">
                {session.user?.name ?? '—'}
              </p>
              <p className="text-muted-foreground">
                {session.user?.email ?? '—'}
              </p>
              
              {userId && (
                <Link 
                  href={`/profile/${userId}`}
                  className="inline-block mt-3 text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  View public profile →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="p-6 rounded-lg bg-secondary/10 border border-border">
          <h2 className="text-lg font-medium mb-3">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/chores" 
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm"
            >
              Browse Chores
            </Link>
            <Link 
              href="/notifications" 
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm"
            >
              Notifications
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
