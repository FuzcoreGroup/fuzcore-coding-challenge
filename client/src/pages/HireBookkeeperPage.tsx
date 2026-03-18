import { useAuth } from "@/contexts/AuthContext";
import teamImg from "@/assets/images/team-meeting.jpg";

export default function HireBookkeeperPage() {
  const auth = useAuth();

  return (
    <div className="w-full max-w-none sm:max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="rounded-lg overflow-hidden">
        <div className="relative">
          <img src={teamImg} alt="Team meeting" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-4 sm:left-6 bottom-3 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold">Hire Bookkeeper</h1>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mt-4">
        {auth.status === "authenticated" ? `Contact options for ${auth.user.businessName}.` : "Manage your bookkeeping team."}
      </p>

      <div className="mt-4 sm:mt-6 rounded-lg border p-5 sm:p-6">
        <div className="text-sm text-muted-foreground">MVP placeholder</div>
        <div className="mt-2 text-lg font-semibold">Next step: connect to a booking/contact flow.</div>
      </div>
    </div>
  );
}

