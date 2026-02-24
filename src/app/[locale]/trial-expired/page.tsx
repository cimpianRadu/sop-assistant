import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/shared/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TrialExpiredPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("TrialExpired");
  const tc = await getTranslations("Common");

  const features = [t("feature1"), t("feature2"), t("feature3")];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription className="text-base">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("duringTrial")}
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <Button className="w-full" size="lg">
                {t("viewPricing")}
              </Button>
            </Link>
            <a href="mailto:contact@sopassistant.com" className="block">
              <Button variant="outline" className="w-full" size="lg">
                {t("contactToContinue")}
              </Button>
            </a>
            <LogoutButton
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
