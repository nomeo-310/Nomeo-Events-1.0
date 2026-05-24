// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldPlusIcon, FingerAccessIcon, Clock02Icon, File02Icon, UserMultiple02Icon, Notification02Icon, ArrowRight01Icon, Mail01Icon, LockIcon, Key01Icon, ArrowLeft02Icon, CheckmarkCircle02Icon, ViewIcon, ViewOffSlashIcon, ServerStack02Icon, Database01Icon, Globe02Icon, AlertCircleIcon, Activity04Icon } from '@hugeicons/core-free-icons'
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";

const LoginPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const securityFeatures = [
    { 
      icon: ShieldPlusIcon, 
      title: "Military-Grade Encryption", 
      desc: "All data encrypted with AES-256, ensuring your information remains confidential and secure from unauthorized access." 
    },
    { 
      icon: FingerAccessIcon, 
      title: "Three-Factor Authentication", 
      desc: "Email, password, and seed phrase verification provides enterprise-grade security against unauthorized access." 
    },
    { 
      icon: Clock02Icon, 
      title: "Automatic Session Management", 
      desc: "Sessions automatically expire after inactivity, and you can view all active devices from your security dashboard." 
    },
    { 
      icon: File02Icon, 
      title: "Comprehensive Audit Logging", 
      desc: "Every action, login attempt, and change is recorded with timestamps and IP addresses for complete accountability." 
    },
    { 
      icon: UserMultiple02Icon, 
      title: "Granular Access Control", 
      desc: "Role-based permissions allow fine-tuned control over exactly what each admin can see, edit, and manage." 
    },
    { 
      icon: Notification02Icon, 
      title: "Real-Time Security Alerts", 
      desc: "Instant notifications for suspicious activities, failed login attempts, or unauthorized access attempts." 
    },
  ];

  // Step 1: Validate email and password
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Email and password are requiblue");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    
    try {
      // First, verify if user exists and is admin (optional pre-check)
      const checkResponse = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const checkData = await checkResponse.json();
      
      if (!checkResponse.ok) {
        setError(checkData.error || "Invalid cblueentials");
        setLoading(false);
        return;
      }
      
      // Store email for step 2
      setEmail(email);
      setStep(2);
      
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify seed phrase and complete login
  const handleSeedPhraseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length < 12 || words.length > 16) {
      setError("Seed phrase must contain 12-16 words separated by spaces");
      return;
    }
    
    setLoading(true);
    
    try {
      // Call the three-factor login endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          seedphrase: seedPhrase.trim() 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Invalid seed phrase");
        setLoading(false);
        return;
      }
      
      // Store session info if needed
      if (rememberMe && data.session) {
        localStorage.setItem("adminSession", JSON.stringify({
          userId: data.user.id,
          expiresAt: data.session.expiresAt,
        }));
      }

      toast.success('Login was successful')
      
      // blueirect to admin dashboard
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.push(callbackUrl);
      router.refresh();
      
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Column - Brand & Security - Plain blue-600 */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full overflow-y-auto">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-16 flex gap-2 items-center"
            >
              <div className="border-2 border-white/30 flex items-center justify-center size-12 font-extrabold text-2xl text-white rounded-xl bg-white/10 backdrop-blur-sm">
                N
              </div>
              <span className="text-white text-2xl font-bold tracking-tight">Nomeo Events</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <h1 className="text-4xl font-bold text-white mb-4">
                Admin Dashboard
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed">
                Secure access to manage events, organizers, analytics, and platform operations.
              </p>
            </motion.div>
          </div>

          {/* Security Features with Detailed Descriptions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4 mb-12"
          >
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              Enterprise Security Features
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all group"
                >
                  <HugeiconsIcon icon={feature.icon} className="w-5 h-5 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-white text-sm font-medium mb-1">{feature.title}</div>
                    <div className="text-blue-200 text-xs leading-relaxed">{feature.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Infrastructure Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-4 text-blue-200 text-xs border-t border-blue-500/30 pt-6">
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={ServerStack02Icon} className="w-5 h-5" />
                <span>AWS Cloud</span>
              </div>
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={Database01Icon} className="w-5 h-5" />
                <span>Encrypted Storage</span>
              </div>
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={Globe02Icon} className="w-5 h-5" />
                <span>Global CDN</span>
              </div>
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={Activity04Icon} className="w-5 h-5" />
                <span>Real-time Sync</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-2xl">
          {/* Step Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-all ${
                    step >= 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 1 ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-5 h-5" />: "1"}
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Step 1</div>
                  <div className="text-base font-semibold text-gray-700">Credentials</div>
                </div>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-6" />
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-all ${
                    step >= 2
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 2 ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-5 h-5" /> : "2"}
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Step 2</div>
                  <div className="text-base font-semibold text-gray-700">Verification</div>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Step 1: Email & Password */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Welcome back
                  </h2>
                  <p className="text-gray-500">
                    Enter your email and password to continue
                  </p>
                </div>

                <form onSubmit={handleEmailPasswordSubmit} className="space-y-6">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
                      >
                        <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <HugeiconsIcon icon={Mail01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 py-6 text-base"
                        placeholder="admin@nomeo.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <HugeiconsIcon icon={LockIcon} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 py-6 text-base"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showPassword ? (
                          <HugeiconsIcon icon={ViewOffSlashIcon} className="w-5 h-5" />
                        ) : (
                          <HugeiconsIcon icon={ViewIcon} className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-base rounded-lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <>
                        Continue to Seed Phrase <ChevronRight className="w-5 h-5 ml-1" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Seed Phrase */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Security verification
                  </h2>
                  <p className="text-gray-500">
                    Enter your seed phrase to complete authentication
                  </p>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <strong>Three-Factor Authentication:</strong> Your seed phrase is the final layer of security. 
                      Never share it with anyone.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSeedPhraseSubmit} className="space-y-6">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
                      >
                        <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="seedPhrase" className="text-sm font-medium text-gray-700">
                      Seed Phrase
                    </Label>
                    <div className="relative">
                      <HugeiconsIcon icon={Key01Icon} className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                      <Textarea
                        id="seedPhrase"
                        value={seedPhrase}
                        onChange={(e) => setSeedPhrase(e.target.value)}
                        className="pl-11 font-mono text-sm resize-none h-24 lg:h-28"
                        placeholder="apple mountain ocean star thunder forest crystal phoenix dragon shadow light ember"
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      12-16 words separated by spaces (the phrase provided in your invitation email)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Remember this device</span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setStep(1);
                        setError("");
                        setSeedPhrase("");
                      }}
                      className="flex-1 py-6 text-base rounded-lg"
                    >
                      <HugeiconsIcon icon={ArrowLeft02Icon} className="w-5 h-5 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-6 text-base rounded-lg"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying 3 factors...
                        </span>
                      ) : (
                        <>
                          Access Dashboard
                          <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-gray-400">
              Three-factor authentication enabled • All access is logged and audited
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;