import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">新規登録</CardTitle>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
