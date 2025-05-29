
"use client";

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Car, Loader2 } from "lucide-react";

import { db } from "@/lib/firebase";
import type { Taxi } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation"; // Added

export default function AvailableTaxisList() {
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(); // Added

  useEffect(() => {
    setIsLoading(true);
    const taxisRef = collection(db, "taxis");
    const q = query(taxisRef, where("isActive", "==", true));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const taxisData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Taxi));
      setTaxis(taxisData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching taxis:", error);
      toast({ variant: "destructive", title: t('error'), description: t('errorLoadingTaxis') });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, t]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2 text-sm">{t('loadingTaxis')}</p>
      </div>
    );
  }

  if (taxis.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-6">{t('noTaxisActive')}</p>;
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {taxis.map((taxi) => (
        <Card key={taxi.id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Car className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">{taxi.licensePlate}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
