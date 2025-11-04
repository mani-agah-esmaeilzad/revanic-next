import { buildStaticMetadata } from "@/lib/page-metadata";
import { LoginForm } from "./LoginForm";

export const metadata = buildStaticMetadata({
  title: "ورود به روانک",
  description: "برای دسترسی به حساب کاربری خود در مجله روانک وارد شوید یا از گزینه ورود با گوگل استفاده کنید.",
  path: "/login",
  keywords: ["ورود روانک", "حساب کاربری روانک", "login"],
});

const LoginPage = () => {
  return <LoginForm />;
};

export default LoginPage;
