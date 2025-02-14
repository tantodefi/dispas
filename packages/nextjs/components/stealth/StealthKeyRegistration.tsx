import { useStealthAddress } from "~~/hooks/useStealthAddress";
import { useToast } from "~~/hooks/useToast";
import { useUniversalProfile } from "~~/contexts/UniversalProfileContext";

export const StealthKeyRegistration = () => {
  const { generateKeys, registerStealthKeys } = useStealthAddress();
  const { toast } = useToast();
  const { universalProfile } = useUniversalProfile();

  const handleRegistration = async () => {
    try {
      if (!universalProfile) {
        toast({
          title: "Error",
          description: "Please connect with a Universal Profile first",
          status: "error",
        });
        return;
      }

      // Generate new stealth keys
      const keys = await generateKeys();
      console.log("Generated stealth keys:", keys);

      // Register the keys
      const tx = await registerStealthKeys({
        spendingPublicKey: keys.spending.public,
        viewingPublicKey: keys.viewing.public
      });

      console.log("Registration tx:", tx);
      await tx.wait();

      // Store keys securely
      localStorage.setItem("stealthKeys", JSON.stringify({
        spendingPrivateKey: keys.spending.private,
        viewingPrivateKey: keys.viewing.private,
        spendingPublicKey: keys.spending.public,
        viewingPublicKey: keys.viewing.public
      }));

      toast({
        title: "Success",
        description: "Successfully registered stealth keys",
        status: "success",
      });
    } catch (error: any) {
      console.error("Error registering stealth keys:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to register stealth keys",
        status: "error",
      });
    }
  };

  return (
    <main className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-2xl font-bold">Register Stealth Keys</h2>
      <button
        onClick={handleRegistration}
        className="btn btn-primary"
        disabled={!universalProfile}
      >
        {universalProfile ? "Register Stealth Keys" : "Connect Universal Profile First"}
      </button>
    </main>
  );
}; 