
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Eye, EyeOff, Loader2, MailQuestion, Send } from "lucide-react"; // Added Send
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const resetSchema = z.object({ // New schema for reset email
  resetEmail: z.string().email({ message: "Invalid email address." }),
});
type ResetFormValues = z.infer<typeof resetSchema>;


export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // For main login
  const [isResettingPassword, setIsResettingPassword] = useState(false); // For password reset operation
  const [showPassword, setShowPassword] = useState(false);
  const [showResetEmailInput, setShowResetEmailInput] = useState(false); // New state
  const { t } = useTranslation();


  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetFormValues>({ // New form instance for reset
    resolver: zodResolver(resetSchema),
    defaultValues: {
      resetEmail: "",
    },
  });


  async function onLoginSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: t('loginSuccessful'),
        description: t('welcomeBack'),
      });
      // router.push('/'); // Navigation should be handled by AuthProvider and page.tsx
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: t('loginFailed'),
        description: error.message || t('genericLoginError'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  const toggleResetForm = () => {
    setShowResetEmailInput(!showResetEmailInput);
    if (showResetEmailInput) { // If we are hiding it (current state is true, about to be false)
        resetForm.reset({ resetEmail: "" });
        resetForm.clearErrors();
    }
  };

  async function onResetSubmit(data: ResetFormValues) {
    if (isLoading) { // Prevent if main login is in progress
        toast({ title: t('loading'), description: "Please wait for login to complete."});
        return;
    }
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, data.resetEmail);
      toast({
        title: t('passwordResetEmailSentTitle'),
        description: t('passwordResetEmailSentDesc', { email: data.resetEmail }),
        duration: 7000,
      });
      setShowResetEmailInput(false); // Hide input on success
      resetForm.reset({ resetEmail: "" });
    } catch (error: any) {
      let errorMessage = t('passwordResetErrorGeneric');
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('passwordResetErrorUserNotFound');
      } else if (error.code === 'auth/invalid-email') {
        // This should be caught by Zod, but good to have a fallback
        errorMessage = t('passwordResetErrorInvalidEmail');
      }
      toast({
        variant: "destructive",
        title: t('passwordResetErrorTitle'),
        description: errorMessage,
      });
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <>
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
          <FormField
            control={loginForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('emailAddressLabel')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    {...field}
                    className="text-base"
                    disabled={isLoading || isResettingPassword}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={loginForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('passwordLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t('passwordPlaceholder')}
                      {...field}
                      className="text-base pr-10"
                      disabled={isLoading || isResettingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      disabled={isLoading || isResettingPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {showPassword ? t('hidePassword') : t('showPassword')}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full text-base" disabled={isLoading || isResettingPassword}>
            {isLoading && !isResettingPassword ? ( 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('signInButton')}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-sm text-center">
        <Button
          type="button"
          variant="link"
          className="font-medium text-primary hover:text-primary/80 p-0 h-auto"
          onClick={toggleResetForm}
          disabled={isLoading} // Only disable if main login is in progress
        >
          <MailQuestion className="mr-1 h-4 w-4" />
          {t('forgotPasswordLink')}
        </Button>
      </div>

      {showResetEmailInput && (
        <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="mt-4 space-y-4 py-4 border-t">
            <FormField
                control={resetForm.control}
                name="resetEmail"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('emailForPasswordResetLabel')}</FormLabel>
                    <FormControl>
                    <Input
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        {...field}
                        className="text-base"
                        disabled={isResettingPassword || isLoading}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" className="w-full text-base" disabled={isResettingPassword || isLoading}>
                {isResettingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : <Send className="mr-2 h-4 w-4" />}
                {t('sendResetLinkButton')}
            </Button>
            </form>
        </Form>
      )}
    </>
  );
}
