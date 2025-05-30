
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"; // Added sendPasswordResetEmail
import { Eye, EyeOff, Loader2, MailQuestion } from "lucide-react"; // Added MailQuestion
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

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false); // Added state for reset
  const [showPassword, setShowPassword] = useState(false);
  const { role } = useAuth();
  const { t } = useTranslation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: t('loginSuccessful'),
        description: t('welcomeBack'),
      });
      router.push('/');
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: t('loginFailed'),
        description: error.message || t('genericLoginError'), // Use a generic key
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    const emailForReset = window.prompt(t('enterEmailForPasswordReset'));
    if (emailForReset) {
      setIsResettingPassword(true);
      try {
        await sendPasswordResetEmail(auth, emailForReset);
        toast({
          title: t('passwordResetEmailSentTitle'),
          description: t('passwordResetEmailSentDesc', { email: emailForReset }),
          duration: 7000,
        });
      } catch (error: any) {
        console.error("Password reset error:", error);
        let errorMessage = t('passwordResetErrorGeneric');
        if (error.code === 'auth/user-not-found') {
          errorMessage = t('passwordResetErrorUserNotFound');
        } else if (error.code === 'auth/invalid-email') {
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
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
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
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
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
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            t('signInButton')
          )}
        </Button>
         <div className="text-sm text-center">
          <Button
            type="button"
            variant="link"
            className="font-medium text-primary hover:text-primary/80 p-0 h-auto"
            onClick={handlePasswordReset}
            disabled={isResettingPassword || isLoading}
          >
            {isResettingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailQuestion className="mr-1 h-4 w-4" /> }
            {t('forgotPasswordLink')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
