import { buildStaticMetadata } from "@/lib/page-metadata";
import { RegisterForm } from "./RegisterForm";

export const metadata = buildStaticMetadata({
  title: "ثبت‌نام در روانک",
  description: "حساب کاربری جدیدی در مجله روانک بسازید و به جامعه نویسندگان و خوانندگان بپیوندید.",
  path: "/register",
  keywords: ["ثبت‌نام روانک", "عضویت روانک", "register"],
});

const RegisterPage = () => {
  return <RegisterForm />;
};

export default RegisterPage;
